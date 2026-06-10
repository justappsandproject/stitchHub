import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { ORDER_STATUS_PROGRESS } from '@stitchhub/shared';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import {
  CreateOrderDto,
  OrderQueryDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private subscriptions: SubscriptionsService,
  ) {}

  private async generateOrderNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.order.count({ where: { tenantId } });
    const year = new Date().getFullYear();
    return `ORD-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  async create(tenantId: string, dto: CreateOrderDto) {
    await this.subscriptions.assertCanCreateOrder(tenantId);

    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const orderNumber = await this.generateOrderNumber(tenantId);
    const deposit = dto.depositAmount ?? 0;
    const balance = dto.totalAmount - deposit;

    return this.prisma.order.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        styleId: dto.styleId,
        orderNumber,
        fabric: dto.fabric,
        deliveryDate: dto.deliveryDate
          ? new Date(dto.deliveryDate)
          : undefined,
        priority: dto.priority,
        notes: dto.notes,
        totalAmount: dto.totalAmount,
        depositAmount: deposit,
        balanceAmount: balance,
        statusHistory: {
          create: { status: OrderStatus.NEW, notes: 'Order created' },
        },
      },
      include: {
        customer: true,
        style: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async findAll(tenantId: string, query: OrderQueryDto) {
    const where: Prisma.OrderWhereInput = { tenantId };

    if (query.status) where.status = query.status;
    if (query.customerId) where.customerId = query.customerId;

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
        style: { select: { id: true, name: true, category: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return orders.map((order) => ({
      ...order,
      progress: ORDER_STATUS_PROGRESS[order.status],
    }));
  }

  async findKanban(tenantId: string) {
    const orders = await this.findAll(tenantId, {});

    const columns: Record<string, typeof orders> = {
      NEW: [],
      CUTTING: [],
      SEWING: [],
      FITTING: [],
      FINISHING: [],
      READY: [],
      DELIVERED: [],
    };

    for (const order of orders) {
      if (order.status === OrderStatus.CANCELLED) continue;
      const key =
        order.status === OrderStatus.MEASURED ? 'NEW' : order.status;
      if (columns[key]) {
        columns[key].push(order);
      }
    }

    return columns;
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        style: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
        invoices: { include: { payments: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    return {
      ...order,
      progress: ORDER_STATUS_PROGRESS[order.status],
    };
  }

  async updateStatus(
    tenantId: string,
    id: string,
    dto: UpdateOrderStatusDto,
    changedBy?: string,
  ) {
    await this.findOne(tenantId, id);

    return this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        assignedToId: dto.assignedToId,
        statusHistory: {
          create: {
            status: dto.status,
            notes: dto.notes,
            changedBy,
          },
        },
      },
      include: {
        customer: true,
        statusHistory: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
  }
}
