import prisma from '../lib/prisma';

export class PricingService {
  /**
   * 计算产品配置的总价
   * 输入选中的 optionValue ID 列表，返回价格明细
   */
  async calculatePrice(productId: number, selectedOptionValueIds: number[], numberOfUnits = 1) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { basePrice: true, currency: true },
    });
    if (!product) throw new Error('产品不存在');

    // 查询选中的选项值对应的价格增量
    const optionValues = await prisma.optionValue.findMany({
      where: { id: { in: selectedOptionValueIds } },
      include: {
        optionGroup: { select: { name: true, id: true } },
      },
    });

    const basePrice = Number(product.basePrice);
    const optionsTotal = optionValues.reduce((sum, ov) => sum + Number(ov.priceDelta), 0);
    const subtotal = (basePrice + optionsTotal) * numberOfUnits;

    return {
      basePrice,
      currency: product.currency,
      numberOfUnits,
      items: optionValues.map(ov => ({
        optionGroupId: ov.optionGroup.id,
        optionGroupName: ov.optionGroup.name,
        optionValueId: ov.id,
        optionValueLabel: ov.label,
        priceDelta: Number(ov.priceDelta),
      })),
      optionsTotal: optionsTotal * numberOfUnits,
      subtotal,
    };
  }
}

export const pricingService = new PricingService();
