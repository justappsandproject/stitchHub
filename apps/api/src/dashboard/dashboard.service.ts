import { Injectable } from '@nestjs/common';
import { OrderStatus, UserRole } from '@prisma/client';
import { PLAN_CONFIG } from '@stitchhub/shared';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getTenantDashboard(tenantId: string) {
    const [
      totalCustomers,
      totalOrders,
      activeOrders,
      deliveredOrders,
      revenueAgg,
      outstandingAgg,
      ordersByStatus,
      recentOrders,
    ] = await Promise.all([
      this.prisma.customer.count({ where: { tenantId } }),
      this.prisma.order.count({ where: { tenantId } }),
      this.prisma.order.count({
        where: {
          tenantId,
          status: { notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] },
        },
      }),
      this.prisma.order.count({
        where: { tenantId, status: OrderStatus.DELIVERED },
      }),
      this.prisma.payment.aggregate({
        where: { tenantId, status: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.order.aggregate({
        where: {
          tenantId,
          balanceAmount: { gt: 0 },
          status: { not: OrderStatus.CANCELLED },
        },
        _sum: { balanceAmount: true },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { status: true },
      }),
      this.prisma.order.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          customer: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    return {
      summary: {
        totalCustomers,
        totalOrders,
        activeOrders,
        deliveredOrders,
        totalRevenue: Number(revenueAgg._sum.amount ?? 0),
        outstandingBalance: Number(outstandingAgg._sum.balanceAmount ?? 0),
      },
      ordersByStatus: ordersByStatus.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      recentOrders,
    };
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

  async getDashboard(user: JwtPayload) {
    if (user.role === UserRole.SUPER_ADMIN) {
      return this.getSuperAdminDashboard();
    }

    if (!user.tenantId) {
      return { message: 'No tenant associated with user' };
    }

    return this.getTenantDashboard(user.tenantId);
  }
}
