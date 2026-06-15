import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DiscountApplicability, DiscountType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDiscountDto,
  UpdateDiscountDto,
  ValidateDiscountDto,
} from './dto/discount.dto';

export interface DiscountValidationResult {
  valid: boolean;
  discountId?: string;
  code?: string;
  name?: string;
  type?: DiscountType;
  discountAmount: number;
  subtotalAmount: number;
  totalAmount: number;
  message?: string;
}

@Injectable()
export class DiscountsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.discount.findMany({
      where: { tenantId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(tenantId: string, id: string) {
    const discount = await this.prisma.discount.findFirst({
      where: { id, tenantId },
    });
    if (!discount) throw new NotFoundException('Discount not found');
    return discount;
  }

  async create(tenantId: string, dto: CreateDiscountDto) {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.discount.findUnique({
      where: { tenantId_code: { tenantId, code } },
    });
    if (existing) {
      throw new BadRequestException('Discount code already exists');
    }

    if (dto.type === DiscountType.PERCENTAGE && dto.value > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }

    return this.prisma.discount.create({
      data: {
        tenantId,
        code,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        value: dto.value,
        applicability: dto.applicability ?? DiscountApplicability.ALL_ORDERS,
        minOrderAmount: dto.minOrderAmount,
        maxDiscountCap: dto.maxDiscountCap,
        maxUses: dto.maxUses,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateDiscountDto) {
    await this.findOne(tenantId, id);

    if (dto.type === DiscountType.PERCENTAGE && dto.value !== undefined && dto.value > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }

    return this.prisma.discount.update({
      where: { id },
      data: {
        ...dto,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.discount.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async validate(
    tenantId: string,
    dto: ValidateDiscountDto,
  ): Promise<DiscountValidationResult> {
    const code = dto.code.trim().toUpperCase();
    const discount = await this.prisma.discount.findUnique({
      where: { tenantId_code: { tenantId, code } },
    });

    if (!discount || !discount.isActive) {
      return {
        valid: false,
        discountAmount: 0,
        subtotalAmount: dto.orderAmount,
        totalAmount: dto.orderAmount,
        message: 'Invalid or inactive discount code',
      };
    }

    const now = new Date();
    if (discount.validFrom && discount.validFrom > now) {
      return this.invalid(dto.orderAmount, 'Discount is not active yet');
    }
    if (discount.validUntil && discount.validUntil < now) {
      return this.invalid(dto.orderAmount, 'Discount has expired');
    }
    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
      return this.invalid(dto.orderAmount, 'Discount usage limit reached');
    }

    if (
      discount.applicability === DiscountApplicability.MINIMUM_SPEND ||
      discount.minOrderAmount
    ) {
      const minimum = Number(discount.minOrderAmount ?? 0);
      if (dto.orderAmount < minimum) {
        return this.invalid(
          dto.orderAmount,
          `Minimum order amount is ₦${minimum.toLocaleString()}`,
        );
      }
    }

    if (discount.applicability === DiscountApplicability.FIRST_ORDER && dto.customerId) {
      const priorOrders = await this.prisma.order.count({
        where: { tenantId, customerId: dto.customerId },
      });
      if (priorOrders > 0) {
        return this.invalid(dto.orderAmount, 'Discount applies to first orders only');
      }
    }

    if (discount.applicability === DiscountApplicability.VIP_ONLY && dto.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, tenantId },
      });
      if (!customer?.isVip) {
        return this.invalid(dto.orderAmount, 'Discount is for VIP customers only');
      }
    }

    const discountAmount = this.calculateAmount(discount, dto.orderAmount);
    const totalAmount = Math.max(dto.orderAmount - discountAmount, 0);

    return {
      valid: true,
      discountId: discount.id,
      code: discount.code,
      name: discount.name,
      type: discount.type,
      discountAmount,
      subtotalAmount: dto.orderAmount,
      totalAmount,
    };
  }

  calculateAmount(
    discount: { type: DiscountType; value: Prisma.Decimal; maxDiscountCap: Prisma.Decimal | null },
    orderAmount: number,
  ) {
    let amount =
      discount.type === DiscountType.PERCENTAGE
        ? (orderAmount * Number(discount.value)) / 100
        : Number(discount.value);

    if (discount.maxDiscountCap) {
      amount = Math.min(amount, Number(discount.maxDiscountCap));
    }

    return Math.min(amount, orderAmount);
  }

  async applyToOrder(
    tenantId: string,
    discountId: string,
    subtotalAmount: number,
  ) {
    const discount = await this.findOne(tenantId, discountId);
    const validation = await this.validate(tenantId, {
      code: discount.code,
      orderAmount: subtotalAmount,
    });

    if (!validation.valid || !validation.discountId) {
      throw new BadRequestException(validation.message ?? 'Discount cannot be applied');
    }

    await this.prisma.discount.update({
      where: { id: discountId },
      data: { usedCount: { increment: 1 } },
    });

    return validation;
  }

  private invalid(orderAmount: number, message: string): DiscountValidationResult {
    return {
      valid: false,
      discountAmount: 0,
      subtotalAmount: orderAmount,
      totalAmount: orderAmount,
      message,
    };
  }
}
