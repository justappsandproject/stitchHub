import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantDto } from './dto/tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

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
}
