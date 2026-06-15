import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import {
  CreateCustomerDto,
  SearchCustomersDto,
  UpdateCustomerDto,
} from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private subscriptions: SubscriptionsService,
  ) {}

  async create(tenantId: string, dto: CreateCustomerDto) {
    await this.subscriptions.assertCanAddCustomer(tenantId);

    const existing = await this.prisma.customer.findUnique({
      where: { tenantId_phone: { tenantId, phone: dto.phone } },
    });

    if (existing) {
      throw new ConflictException('Customer with this phone already exists');
    }

    return this.prisma.customer.create({
      data: {
        tenantId,
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
  }

  async findAll(tenantId: string, query: SearchCustomersDto) {
    const where: Prisma.CustomerWhereInput = { tenantId };

    if (query.q) {
      where.OR = [
        { firstName: { contains: query.q, mode: 'insensitive' } },
        { lastName: { contains: query.q, mode: 'insensitive' } },
        { phone: { contains: query.q } },
        { email: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    if (query.vipOnly) {
      where.isVip = true;
    }

    if (query.tag) {
      where.tags = { has: query.tag };
    }

    return this.prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { orders: true, measurements: true } },
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const [customer, subscription] = await Promise.all([
      this.prisma.customer.findFirst({
        where: { id, tenantId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              lastLoginAt: true,
            },
          },
          measurements: {
            orderBy: { createdAt: 'desc' },
            include: { template: true },
          },
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
              style: { select: { id: true, name: true, category: true } },
            },
          },
          _count: { select: { orders: true, measurements: true } },
        },
      }),
      this.subscriptions.getCurrent(tenantId),
    ]);

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return {
      ...customer,
      tenantPlan: subscription.plan,
      tenantSubscriptionStatus: subscription.status,
      tenantUsage: subscription.usage,
    };
  }

  async update(tenantId: string, id: string, dto: UpdateCustomerDto) {
    await this.findOne(tenantId, id);

    if (dto.phone) {
      const conflict = await this.prisma.customer.findFirst({
        where: { tenantId, phone: dto.phone, NOT: { id } },
      });
      if (conflict) {
        throw new ConflictException('Phone number already in use');
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.customer.delete({ where: { id } });
  }
}
