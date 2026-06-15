import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PortfolioSource, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePortfolioItemDto,
  PortfolioQueryDto,
  UpdatePortfolioItemDto,
} from './dto/portfolio.dto';

@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: PortfolioQueryDto, publishedOnly = false) {
    const where: Prisma.PortfolioItemWhereInput = { tenantId };

    if (publishedOnly) where.isPublished = true;
    if (query.category) where.category = query.category;
    if (query.featured !== undefined) where.isFeatured = query.featured;
    if (query.source) where.source = query.source;
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { styleName: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.portfolioItem.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { completedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            customer: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async findOne(tenantId: string, id: string, publishedOnly = false) {
    const item = await this.prisma.portfolioItem.findFirst({
      where: {
        id,
        tenantId,
        ...(publishedOnly ? { isPublished: true } : {}),
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            fabric: true,
            style: { select: { name: true, category: true } },
          },
        },
      },
    });

    if (!item) throw new NotFoundException('Portfolio item not found');
    return item;
  }

  async create(tenantId: string, dto: CreatePortfolioItemDto) {
    if (dto.orderId) {
      const order = await this.prisma.order.findFirst({
        where: { id: dto.orderId, tenantId },
        include: { style: true },
      });
      if (!order) throw new NotFoundException('Linked order not found');

      const existing = await this.prisma.portfolioItem.findUnique({
        where: { orderId: dto.orderId },
      });
      if (existing) return existing;
    }

    return this.prisma.portfolioItem.create({
      data: {
        tenantId,
        orderId: dto.orderId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        fabric: dto.fabric,
        styleName: dto.styleName,
        photoUrls: dto.photoUrls ?? [],
        source: dto.orderId ? PortfolioSource.ORDER : PortfolioSource.MANUAL,
        isFeatured: dto.isFeatured ?? false,
        isPublished: dto.isPublished ?? true,
        completedAt: dto.orderId ? new Date() : undefined,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdatePortfolioItemDto) {
    await this.findOne(tenantId, id);
    return this.prisma.portfolioItem.update({
      where: { id },
      data: dto,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.portfolioItem.delete({ where: { id } });
  }

  async createFromDeliveredOrder(tenantId: string, orderId: string) {
    const existing = await this.prisma.portfolioItem.findUnique({
      where: { orderId },
    });
    if (existing) return existing;

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId, status: OrderStatus.DELIVERED },
      include: {
        style: true,
        customer: { select: { firstName: true, lastName: true } },
      },
    });
    if (!order) return null;

    const title = order.style?.name ?? `${order.fabric ?? 'Custom'} Look`;
    return this.prisma.portfolioItem.create({
      data: {
        tenantId,
        orderId: order.id,
        title,
        description: `Completed order ${order.orderNumber} for ${order.customer.firstName} ${order.customer.lastName}`,
        category: order.style?.category ?? 'Custom',
        fabric: order.fabric ?? undefined,
        styleName: order.style?.name ?? undefined,
        source: PortfolioSource.ORDER,
        isPublished: true,
        completedAt: new Date(),
      },
    });
  }
}
