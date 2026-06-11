import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUpdateTenantDto } from './dto/admin-tenant.dto';
import { UpdateTenantDto } from './dto/tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    private prisma: PrismaService,
    private subscriptions: SubscriptionsService,
  ) {}

  async findAll() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        subscription: {
          select: { plan: true, status: true, currentPeriodEnd: true },
        },
        users: {
          where: { role: UserRole.TENANT_OWNER },
          take: 1,
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        _count: { select: { users: true, customers: true, orders: true } },
      },
    });
  }

  async findOne(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            orders: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async update(tenantId: string, dto: UpdateTenantDto) {
    await this.findOne(tenantId);
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: dto,
    });
  }

  async adminUpdate(tenantId: string, dto: AdminUpdateTenantDto) {
    await this.findOne(tenantId);

    if (dto.plan) {
      await this.subscriptions.adminChangePlan(tenantId, dto.plan);
    }

    const { plan: _, ...tenantData } = dto;
    if (Object.keys(tenantData).length > 0) {
      return this.prisma.tenant.update({
        where: { id: tenantId },
        data: tenantData,
      });
    }

    return this.findOne(tenantId);
  }

  async resetOwnerPassword(tenantId: string, newPassword: string) {
    const owner = await this.prisma.user.findFirst({
      where: { tenantId, role: UserRole.TENANT_OWNER },
    });
    if (!owner) {
      throw new NotFoundException('Fashion house owner not found');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: owner.id },
      data: { passwordHash },
    });
    return { message: 'Owner password updated' };
  }
}
