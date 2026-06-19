import { Injectable } from '@nestjs/common';
import { OrderStatus, UserRole } from '@prisma/client';
import { PLAN_CONFIG } from '@stitchhub/shared';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getTenantDashboard(tenantId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(startOfToday);
    startOfMonth.setDate(1);

    const orderScope = { tenantId, deletedAt: null };
    const customerScope = { tenantId, deletedAt: null };

    const [
      totalCustomers,
      totalOrders,
      activeOrders,
      deliveredOrders,
      revenueAgg,
      outstandingAgg,
      todayRevenueAgg,
      monthlyRevenueAgg,
      pendingInvoices,
      ordersByStatus,
      recentOrders,
      portfolioCount,
      activeDiscounts,
      recentPortfolio,
      paidPayments,
    ] = await Promise.all([
      this.prisma.customer.count({ where: customerScope }),
      this.prisma.order.count({ where: orderScope }),
      this.prisma.order.count({
        where: {
          ...orderScope,
          status: { notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] },
        },
      }),
      this.prisma.order.count({
        where: { ...orderScope, status: OrderStatus.DELIVERED },
      }),
      this.prisma.payment.aggregate({
        where: { tenantId, status: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.order.aggregate({
        where: {
          ...orderScope,
          balanceAmount: { gt: 0 },
          status: { not: OrderStatus.CANCELLED },
        },
        _sum: { balanceAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          tenantId,
          status: 'PAID',
          paidAt: { gte: startOfToday },
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          tenantId,
          status: 'PAID',
          paidAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.invoice.count({
        where: {
          tenantId,
          status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
        },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: orderScope,
        _count: { status: true },
      }),
      this.prisma.order.findMany({
        where: orderScope,
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          customer: { select: { firstName: true, lastName: true } },
          style: { select: { id: true, name: true } },
        },
      }),
      this.prisma.portfolioItem.count({
        where: { tenantId, isPublished: true },
      }),
      this.prisma.discount.count({
        where: { tenantId, isActive: true },
      }),
      this.prisma.portfolioItem.findMany({
        where: { tenantId, isPublished: true },
        orderBy: [{ isFeatured: 'desc' }, { completedAt: 'desc' }],
        take: 4,
        select: {
          id: true,
          title: true,
          category: true,
          photoUrls: true,
          isFeatured: true,
          source: true,
        },
      }),
      this.prisma.payment.findMany({
        where: { tenantId, status: 'PAID' },
        select: { amount: true, paidAt: true },
        orderBy: { paidAt: 'desc' },
        take: 500,
      }),
    ]);

    const revenueTrend = this.buildRevenueTrend(paidPayments);

    let inventorySummary = null;
    try {
      const products = await this.prisma.inventoryProduct.findMany({
        where: { tenantId, isActive: true },
        select: { quantity: true, lowStockThreshold: true, unitCost: true },
      });
      inventorySummary = {
        totalProducts: products.length,
        availableStock: products.reduce((s, p) => s + p.quantity, 0),
        lowStock: products.filter(
          (p) => p.quantity > 0 && p.quantity <= p.lowStockThreshold,
        ).length,
        outOfStock: products.filter((p) => p.quantity <= 0).length,
        totalInventoryValue: products.reduce(
          (s, p) => s + p.quantity * Number(p.unitCost),
          0,
        ),
      };
    } catch {
      inventorySummary = null;
    }

    const totalRevenue = Number(revenueAgg._sum.amount ?? 0);

    return {
      summary: {
        totalCustomers,
        totalOrders,
        activeOrders,
        deliveredOrders,
        totalRevenue,
        revenueReceived: totalRevenue,
        outstandingBalance: Number(outstandingAgg._sum.balanceAmount ?? 0),
        outstandingPayments: Number(outstandingAgg._sum.balanceAmount ?? 0),
        pendingInvoices,
        todayRevenue: Number(todayRevenueAgg._sum.amount ?? 0),
        monthlyRevenue: Number(monthlyRevenueAgg._sum.amount ?? 0),
        portfolioCount,
        activeDiscounts,
      },
      revenueTrend,
      inventorySummary,
      ordersByStatus: ordersByStatus.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      recentOrders,
      recentPortfolio,
    };
  }

  private buildRevenueTrend(
    payments: { amount: unknown; paidAt: Date | null }[],
  ) {
    const buckets = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.set(key, 0);
    }

    for (const payment of payments) {
      if (!payment.paidAt) continue;
      const d = payment.paidAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + Number(payment.amount));
      }
    }

    return Array.from(buckets.entries()).map(([month, amount]) => ({
      month,
      amount,
    }));
  }

  async getSuperAdminDashboard() {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalOrders,
      tenants,
      subscriptionGroups,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { isActive: true } }),
      this.prisma.user.count({
        where: { role: { not: UserRole.SUPER_ADMIN } },
      }),
      this.prisma.order.count(),
      this.prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          createdAt: true,
          subscription: { select: { plan: true, status: true } },
          _count: { select: { customers: true, orders: true } },
        },
      }),
      this.prisma.subscription.groupBy({
        by: ['plan', 'status'],
        _count: { _all: true },
      }),
    ]);

    const monthlyRecurringRevenue = subscriptionGroups
      .filter((g) => g.status === 'ACTIVE')
      .reduce(
        (sum, g) => sum + PLAN_CONFIG[g.plan].priceNgn * g._count._all,
        0,
      );

    return {
      summary: {
        totalTenants,
        activeTenants,
        totalUsers,
        totalOrders,
        monthlyRecurringRevenue,
      },
      planBreakdown: subscriptionGroups.map((g) => ({
        plan: g.plan,
        status: g.status,
        count: g._count._all,
      })),
      recentTenants: tenants,
    };
  }

  async getCustomerDashboard(tenantId: string, customerId: string) {
    const [
      totalOrders,
      activeOrders,
      deliveredOrders,
      outstandingAgg,
      recentOrders,
      recentPortfolio,
    ] = await Promise.all([
      this.prisma.order.count({ where: { tenantId, customerId } }),
      this.prisma.order.count({
        where: {
          tenantId,
          customerId,
          status: { notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] },
        },
      }),
      this.prisma.order.count({
        where: { tenantId, customerId, status: OrderStatus.DELIVERED },
      }),
      this.prisma.order.aggregate({
        where: {
          tenantId,
          customerId,
          balanceAmount: { gt: 0 },
          status: { not: OrderStatus.CANCELLED },
        },
        _sum: { balanceAmount: true },
      }),
      this.prisma.order.findMany({
        where: { tenantId, customerId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          style: { select: { name: true } },
        },
      }),
      this.prisma.portfolioItem.findMany({
        where: { tenantId, isPublished: true },
        orderBy: [{ isFeatured: 'desc' }, { completedAt: 'desc' }],
        take: 6,
        select: {
          id: true,
          title: true,
          category: true,
          photoUrls: true,
          fabric: true,
          styleName: true,
          isFeatured: true,
        },
      }),
    ]);

    return {
      summary: {
        totalOrders,
        activeOrders,
        deliveredOrders,
        outstandingBalance: Number(outstandingAgg._sum.balanceAmount ?? 0),
      },
      recentOrders,
      recentPortfolio,
    };
  }

  async getDashboard(user: JwtPayload) {
    if (user.role === UserRole.SUPER_ADMIN) {
      return this.getSuperAdminDashboard();
    }

    if (!user.tenantId) {
      return { message: 'No tenant associated with user' };
    }

    if (user.role === UserRole.CUSTOMER) {
      const customer = await this.prisma.customer.findUnique({
        where: { userId: user.sub },
        select: { id: true },
      });
      if (!customer) {
        return { message: 'No customer profile linked' };
      }
      return this.getCustomerDashboard(user.tenantId, customer.id);
    }

    return this.getTenantDashboard(user.tenantId);
  }
}
