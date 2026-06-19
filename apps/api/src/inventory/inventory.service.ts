import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InventoryTransactionType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdjustInventoryDto,
  CreateInventoryProductDto,
  InventoryQueryDto,
  RestockInventoryDto,
  UpdateInventoryProductDto,
} from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(tenantId: string) {
    const products = await this.prisma.inventoryProduct.findMany({
      where: { tenantId, isActive: true },
      select: {
        quantity: true,
        lowStockThreshold: true,
        unitCost: true,
      },
    });

    let availableStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalValue = 0;

    for (const p of products) {
      availableStock += p.quantity;
      totalValue += p.quantity * Number(p.unitCost);
      if (p.quantity <= 0) outOfStock += 1;
      else if (p.quantity <= p.lowStockThreshold) lowStock += 1;
    }

    return {
      totalProducts: products.length,
      availableStock,
      lowStock,
      outOfStock,
      totalInventoryValue: totalValue,
    };
  }

  async findAll(tenantId: string, query: InventoryQueryDto) {
    const where: Prisma.InventoryProductWhereInput = { tenantId, isActive: true };

    if (query.category) where.category = query.category;
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { sku: { contains: query.q, mode: 'insensitive' } },
        { category: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const products = await this.prisma.inventoryProduct.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    if (query.stockStatus === 'low') {
      return products.filter(
        (p) => p.quantity > 0 && p.quantity <= p.lowStockThreshold,
      );
    }
    if (query.stockStatus === 'out') {
      return products.filter((p) => p.quantity <= 0);
    }
    if (query.stockStatus === 'available') {
      return products.filter((p) => p.quantity > p.lowStockThreshold);
    }

    return products;
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.inventoryProduct.findFirst({
      where: { id, tenantId },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(tenantId: string, dto: CreateInventoryProductDto) {
    return this.prisma.inventoryProduct.create({
      data: {
        tenantId,
        name: dto.name,
        category: dto.category,
        description: dto.description,
        sku: dto.sku,
        photoUrls: dto.photoUrls ?? [],
        unitCost: dto.unitCost ?? 0,
        unitPrice: dto.unitPrice ?? 0,
        quantity: dto.quantity ?? 0,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
        supplier: dto.supplier,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateInventoryProductDto) {
    await this.findOne(tenantId, id);
    return this.prisma.inventoryProduct.update({ where: { id }, data: dto });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.inventoryProduct.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async restock(
    tenantId: string,
    id: string,
    dto: RestockInventoryDto,
    userId?: string,
  ) {
    const product = await this.findOne(tenantId, id);
    const previousQty = product.quantity;
    const newQty = previousQty + dto.quantity;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.inventoryProduct.update({
        where: { id },
        data: {
          quantity: newQty,
          ...(dto.unitCost != null ? { unitCost: dto.unitCost } : {}),
          ...(dto.supplier ? { supplier: dto.supplier } : {}),
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          tenantId,
          productId: id,
          type: InventoryTransactionType.RESTOCK,
          quantity: dto.quantity,
          previousQty,
          newQty,
          unitCost: dto.unitCost,
          supplier: dto.supplier,
          notes: dto.notes,
          createdBy: userId,
        },
      });

      return updated;
    });
  }

  async adjust(
    tenantId: string,
    id: string,
    dto: AdjustInventoryDto,
    userId?: string,
  ) {
    const product = await this.findOne(tenantId, id);
    const previousQty = product.quantity;
    const delta =
      dto.type === InventoryTransactionType.USAGE
        ? -Math.abs(dto.quantity)
        : dto.quantity;
    const newQty = previousQty + delta;

    if (newQty < 0) {
      throw new BadRequestException('Insufficient stock for this adjustment');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.inventoryProduct.update({
        where: { id },
        data: { quantity: newQty },
      });

      await tx.inventoryTransaction.create({
        data: {
          tenantId,
          productId: id,
          type: dto.type,
          quantity: Math.abs(dto.quantity),
          previousQty,
          newQty,
          notes: dto.notes,
          createdBy: userId,
        },
      });

      return updated;
    });
  }

  async listTransactions(tenantId: string, productId?: string) {
    return this.prisma.inventoryTransaction.findMany({
      where: {
        tenantId,
        ...(productId ? { productId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
    });
  }
}
