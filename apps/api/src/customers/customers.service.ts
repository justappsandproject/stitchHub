import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import {
  generateSecurePassword,
  usernameBase,
} from '../common/utils/credentials.util';
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

  private async generateUniqueUsername(
    firstName: string,
    lastName: string,
    preferred?: string,
  ): Promise<string> {
    if (preferred) {
      const taken = await this.prisma.user.findUnique({
        where: { username: preferred },
      });
      if (!taken) return preferred;
    }

    const base = usernameBase(firstName, lastName) || 'customer';
    for (let attempt = 0; attempt < 20; attempt++) {
      const suffix = Math.floor(Math.random() * 900 + 100);
      const candidate = `${base}${suffix}`;
      const [userHit, customerHit] = await Promise.all([
        this.prisma.user.findUnique({ where: { username: candidate } }),
        this.prisma.customer.findFirst({ where: { username: candidate } }),
      ]);
      if (!userHit && !customerHit) return candidate;
    }
    throw new ConflictException('Could not generate a unique username');
  }

  async create(
    tenantId: string,
    dto: CreateCustomerDto,
    actorId?: string,
    preferredUsername?: string,
  ) {
    await this.subscriptions.assertCanAddCustomer(tenantId);

    const existing = await this.prisma.customer.findUnique({
      where: { tenantId_phone: { tenantId, phone: dto.phone } },
    });

    if (existing) {
      throw new ConflictException('Customer with this phone already exists');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const username = await this.generateUniqueUsername(
      dto.firstName,
      dto.lastName,
      preferredUsername,
    );
    const plainPassword = generateSecurePassword(10);
    const passwordHash = await bcrypt.hash(plainPassword, 12);
    const email = dto.email ?? `${username}@customers.stitchhub.local`;

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

    const customer = await this.prisma.customer.create({
      data: {
        tenantId,
        userId: user.id,
        username,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        gender: dto.gender,
        address: dto.address,
        photoUrl: dto.photoUrl,
        notes: dto.notes,
        isVip: dto.isVip ?? false,
        tags: dto.tags ?? [],
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });

    const welcomeMessage = `${tenant.name} has added you to StitchHub. Log in with Username: ${username} and Password: ${plainPassword}. You'll be prompted to change your password on first login.`;

    await this.notifications.notifyCustomerOnboard({
      email: dto.email,
      phone: dto.phone,
      fashionHouseName: tenant.name,
      username,
      tempPassword: plainPassword,
      welcomeMessage,
      userId: user.id,
    });

    if (actorId) {
      await this.audit.log({
        tenantId,
        userId: actorId,
        action: 'CUSTOMER_CREATED',
        entity: 'Customer',
        entityId: customer.id,
        metadata: { username },
      });
    }

    return {
      ...customer,
      credentials: {
        username,
        password: plainPassword,
      },
    };
  }

  async onboard(tenantId: string, actorId: string, dto: OnboardCustomerDto) {
    const result = await this.create(
      tenantId,
      {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
      },
      actorId,
      dto.username,
    );

    return {
      customer: result,
      username: result.credentials.username,
      temporaryPassword: result.credentials.password,
      welcomeMessage: `Share these credentials with your customer. Username: ${result.credentials.username}`,
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