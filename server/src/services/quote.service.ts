import prisma from '../lib/prisma';
import { pricingService } from './pricing.service';
import type { Prisma } from '@prisma/client';

export class QuoteService {
  /** 生成报价号 QT-20260522-0001 */
  private async generateQuoteNumber(): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `QT-${today}-`;
    const last = await prisma.quote.findFirst({
      where: { quoteNumber: { startsWith: prefix } },
      orderBy: { quoteNumber: 'desc' },
    });
    const nextSeq = last ? parseInt(last.quoteNumber.split('-')[2], 10) + 1 : 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  // ===== 前台接口 =====

  /** 校验必选配置组是否都已选择 */
  private async validateRequiredOptions(productId: number, optionValueIds: number[]) {
    const requiredGroups = await prisma.optionGroup.findMany({
      where: { productId, isRequired: true },
      select: { id: true, name: true, optionValues: { select: { id: true } } },
    });

    const missing: string[] = [];
    for (const group of requiredGroups) {
      const groupValueIds = group.optionValues.map(v => v.id);
      if (!optionValueIds.some(id => groupValueIds.includes(id))) {
        missing.push(group.name);
      }
    }

    if (missing.length > 0) {
      throw new Error(`请选择必选配置项：${missing.join('、')}`);
    }
  }

  async createQuote(userId: string, data: {
    productId: number;
    customerName: string;
    numberOfUnits?: number;
    optionValueIds: number[];
    discountType?: string;
    discountValue?: number;
    notes?: string;
  }) {
    await this.validateRequiredOptions(data.productId, data.optionValueIds);

    // 计算价格
    const pricing = await pricingService.calculatePrice(
      data.productId, data.optionValueIds, data.numberOfUnits || 1
    );

    let discountTotal = 0;
    if (data.discountValue && data.discountValue > 0) {
      discountTotal = data.discountType === 'PERCENTAGE'
        ? pricing.subtotal * data.discountValue / 100
        : data.discountValue;
    }

    const quoteNumber = await this.generateQuoteNumber();
    const total = pricing.subtotal - discountTotal;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        productId: data.productId,
        customerName: data.customerName,
        numberOfUnits: data.numberOfUnits || 1,
        subtotal: pricing.subtotal,
        discountTotal,
        total,
        currency: pricing.currency,
        validUntil,
        notes: data.notes,
        createdById: userId,
        items: {
          create: pricing.items.map(item => ({
            optionGroupId: item.optionGroupId,
            optionValueId: item.optionValueId,
            priceDelta: item.priceDelta,
          })),
        },
        discounts: data.discountValue && data.discountValue > 0 ? {
          create: {
            name: 'Dealer Discount',
            type: (data.discountType as any) || 'PERCENTAGE',
            value: data.discountValue,
          },
        } : undefined,
      },
      include: {
        items: { include: { optionGroup: true, optionValue: true } },
        discounts: true,
        product: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    // 创建历史快照
    await prisma.quoteHistory.create({
      data: {
        quoteId: quote.id,
        version: 1,
        snapshot: quote as any,
        changedById: userId,
        changeNote: '创建报价',
      },
    });

    return quote;
  }

  async getMyQuotes(userId: string, page = 1, pageSize = 20, status?: string) {
    const where: Prisma.QuoteWhereInput = { createdById: userId };
    if (status) where.status = status as any;

    const [items, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: { product: true, createdBy: { select: { name: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quote.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async getQuoteById(quoteId: number) {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        product: true,
        createdBy: { select: { id: true, name: true, email: true } },
        items: { include: { optionGroup: true, optionValue: true } },
        discounts: true,
        history: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!quote) throw new Error('报价不存在');
    return quote;
  }

  async updateQuote(quoteId: number, userId: string, data: {
    customerName?: string;
    numberOfUnits?: number;
    optionValueIds?: number[];
    discountType?: string;
    discountValue?: number;
    notes?: string;
  }) {
    const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote) throw new Error('报价不存在');
    if (quote.createdById !== userId) throw new Error('只能编辑自己的报价');
    if (quote.status !== 'DRAFT') throw new Error('只能编辑草稿状态的报价');

    // 如果更新了配置项，重新计算价格
    if (data.optionValueIds || data.numberOfUnits || data.discountValue !== undefined) {
      if (data.optionValueIds) {
        await this.validateRequiredOptions(quote.productId, data.optionValueIds);
      }

      const productId = quote.productId;
      const units = data.numberOfUnits || quote.numberOfUnits;

      // 确定当前使用的选项值
      const optionValueIds = data.optionValueIds ||
        (await prisma.quoteItem.findMany({ where: { quoteId }, select: { optionValueId: true } }))
          .map(i => i.optionValueId);

      const pricing = await pricingService.calculatePrice(productId, optionValueIds, units);

      let discountTotal = 0;
      const dv = data.discountValue !== undefined ? data.discountValue : Number(quote.discountTotal) > 0 ? Number(quote.discountTotal) : 0;
      if (dv > 0) {
        discountTotal = (data.discountType || 'PERCENTAGE') === 'PERCENTAGE'
          ? pricing.subtotal * dv / 100 : dv;
      }

      const total = pricing.subtotal - discountTotal;

      // 删除旧行项，创建新行项
      await prisma.quoteItem.deleteMany({ where: { quoteId } });
      await prisma.quoteDiscount.deleteMany({ where: { quoteId } });

      const updated = await prisma.quote.update({
        where: { id: quoteId },
        data: {
          customerName: data.customerName,
          numberOfUnits: units,
          subtotal: pricing.subtotal,
          discountTotal,
          total,
          notes: data.notes,
          items: {
            create: pricing.items.map(item => ({
              optionGroupId: item.optionGroupId,
              optionValueId: item.optionValueId,
              priceDelta: item.priceDelta,
            })),
          },
          discounts: dv > 0 ? {
            create: { name: 'Dealer Discount', type: (data.discountType as any) || 'PERCENTAGE', value: dv },
          } : undefined,
        },
        include: {
          items: { include: { optionGroup: true, optionValue: true } },
          discounts: true,
          product: true,
          createdBy: { select: { id: true, name: true } },
        },
      });

      // 保存历史快照
      const lastHistory = await prisma.quoteHistory.findFirst({
        where: { quoteId }, orderBy: { version: 'desc' },
      });
      await prisma.quoteHistory.create({
        data: {
          quoteId,
          version: (lastHistory?.version || 1) + 1,
          snapshot: updated as any,
          changedById: userId,
          changeNote: '更新报价',
        },
      });

      return updated;
    }

    // 仅更新客户名和备注
    return prisma.quote.update({
      where: { id: quoteId },
      data: { customerName: data.customerName, notes: data.notes },
      include: { items: { include: { optionGroup: true, optionValue: true } }, discounts: true },
    });
  }

  async copyQuote(quoteId: number, userId: string) {
    const source = await this.getQuoteById(quoteId);
    const optionValueIds = source.items.map(i => i.optionValueId);
    const discountVal = source.discounts.length > 0 ? Number(source.discounts[0].value) : 0;
    const discountType = source.discounts.length > 0 ? source.discounts[0].type : 'PERCENTAGE';

    return this.createQuote(userId, {
      productId: source.productId,
      customerName: source.customerName + ' (副本)',
      numberOfUnits: source.numberOfUnits,
      optionValueIds,
      discountValue: discountVal,
      discountType,
      notes: source.notes || undefined,
    });
  }

  // ===== 后台接口 =====
  async getAllQuotes(page = 1, pageSize = 20, filters?: {
    status?: string; customerName?: string; createdById?: string;
  }) {
    const where: Prisma.QuoteWhereInput = {};
    if (filters?.status) where.status = filters.status as any;
    if (filters?.customerName) where.customerName = { contains: filters.customerName, mode: 'insensitive' };
    if (filters?.createdById) where.createdById = filters.createdById;

    const [items, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          product: true,
          createdBy: { select: { id: true, name: true, email: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quote.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async updateQuoteStatus(quoteId: number, status: string) {
    return prisma.quote.update({
      where: { id: quoteId },
      data: { status: status as any },
    });
  }

  // ===== 用户管理 =====
  async getAllUsers(page = 1, pageSize = 20) {
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);
    return { items, total, page, pageSize };
  }

  async updateUser(id: string, data: { name?: string; role?: string; isActive?: boolean }) {
    return prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.role !== undefined && { role: data.role as any }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });
  }
}

export const quoteService = new QuoteService();
