import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import {
  CreateCustomerDto,
  OnboardCustomerDto,
  SearchCustomersDto,
  UpdateCustomerDto,
} from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private subscriptions: SubscriptionsService,
    private audit: AuditService,
    private notifications: NotificationsService,
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

  private generateUsername(firstName: string, lastName: string) {
    const base = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z0-9.]/g, '');
    const suffix = Math.floor(Math.random() * 900 + 100);
    return `${base}${suffix}`;
  }

  async onboard(tenantId: string, actorId: string, dto: OnboardCustomerDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const customer = await this.create(tenantId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      email: dto.email,
    });

    const username = dto.username ?? this.generateUsername(dto.firstName, dto.lastName);
    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const email =
      dto.email ?? `${username}@customers.stitchhub.local`;

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email,
        username,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: UserRole.CUSTOMER,
        mustResetPassword: true,
        invitedAt: new Date(),
      },
    });

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: { userId: user.id },
    });

    await this.audit.log({
      tenantId,
      userId: actorId,
      action: 'CUSTOMER_ONBOARDED',
      entity: 'Customer',
      entityId: customer.id,
      metadata: { username },
    });

    const message = `${tenant.name} has added you to StitchHub. Download the app and log in with Username: ${username} and Password: ${tempPassword}. You'll be prompted to change your password on first login.`;

    await this.notifications.notifyCustomerOnboard({
      email: dto.email,
      phone: dto.phone,
      fashionHouseName: tenant.name,
      username,
      tempPassword,
      welcomeMessage: message,
      userId: user.id,
    });

    return {
      customer: { ...customer, userId: user.id },
      username,
      temporaryPassword: tempPassword,
      welcomeMessage: message,
    };
  }

  async findAll(tenantId: string, query: SearchCustomersDto) {
    const where: Prisma.CustomerWhereInput = { tenantId, deletedAt: null };

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
        where: { id, tenantId, deletedAt: null },
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
            select: {
              id: true,
              orderNumber: true,
              status: true,
              totalAmount: true,
              createdAt: true,
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

    const activeOrders = await this.prisma.order.count({
      where: {
        tenantId,
        customerId: id,
        deletedAt: null,
        status: { notIn: ['DELIVERED', 'CANCELLED'] },
      },
    });

    if (activeOrders > 0) {
      throw new ConflictException(
        'Cannot delete customer with active orders. Cancel or complete orders first.',
      );
    }

    return this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
