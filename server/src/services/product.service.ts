import prisma from '../lib/prisma';
import type { Prisma } from '@prisma/client';

export class ProductService {
  // ===== 前台：获取可配置产品列表 =====
  async getActiveProducts() {
    return prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProductConfig(productId: number) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        standardSpecs: { orderBy: { sortOrder: 'asc' } },
        optionGroups: {
          orderBy: { sortOrder: 'asc' },
          include: {
            optionValues: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });
    if (!product) throw new Error('产品不存在');
    return product;
  }

  // ===== 后台：产品CRUD =====
  async getAllProducts(page = 1, pageSize = 20, search?: string) {
    const where: Prisma.ProductWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async createProduct(data: {
    sku: string; name: string; description?: string;
    basePrice: number; currency?: string; categoryId: number;
  }) {
    return prisma.product.create({ data });
  }

  async updateProduct(id: number, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({ where: { id }, data });
  }

  async deleteProduct(id: number) {
    return prisma.product.delete({ where: { id } });
  }

  // ===== 配置项管理 =====
  async getProductOptions(productId: number) {
    return prisma.optionGroup.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
      include: {
        optionValues: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async createOptionGroup(productId: number, data: {
    name: string; description?: string; isRequired?: boolean;
    isMultiSelect?: boolean; sortOrder?: number;
  }) {
    return prisma.optionGroup.create({
      data: { ...data, productId },
    });
  }

  async updateOptionGroup(id: number, data: Prisma.OptionGroupUpdateInput) {
    return prisma.optionGroup.update({ where: { id }, data });
  }

  async deleteOptionGroup(id: number) {
    return prisma.optionGroup.delete({ where: { id } });
  }

  async createOptionValue(groupId: number, data: {
    label: string; priceDelta?: number; isDefault?: boolean; sortOrder?: number;
  }) {
    return prisma.optionValue.create({
      data: { ...data, optionGroupId: groupId },
    });
  }

  async updateOptionValue(id: number, data: Prisma.OptionValueUpdateInput) {
    return prisma.optionValue.update({ where: { id }, data });
  }

  async deleteOptionValue(id: number) {
    return prisma.optionValue.delete({ where: { id } });
  }

  // ===== 分类管理 =====
  async getCategories() {
    return prisma.productCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { children: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async createCategory(data: { name: string; slug: string; parentId?: number; sortOrder?: number }) {
    return prisma.productCategory.create({ data });
  }
}

export const productService = new ProductService();
