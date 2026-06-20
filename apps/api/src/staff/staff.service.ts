import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../common/services/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto';

const STAFF_ROLES: UserRole[] = [
  UserRole.TENANT_OWNER,
  UserRole.MANAGER,
  UserRole.TAILOR,
  UserRole.CUTTER,
  UserRole.FINISHER,
  UserRole.APPRENTICE,
];

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private subscriptions: SubscriptionsService,
    private audit: AuditService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId, role: { in: STAFF_ROLES } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        pin: true,
        isActive: true,
        invitedAt: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { assignedOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, actorId: string, dto: CreateStaffDto) {
    await this.subscriptions.assertFeature(tenantId, 'staffManagement');

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role,
        pin: dto.pin,
        mustResetPassword: true,
        invitedAt: new Date(),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    await this.audit.log({
      tenantId,
      userId: actorId,
      action: 'STAFF_CREATED',
      entity: 'User',
      entityId: user.id,
    });

    return { user, temporaryPassword: tempPassword };
  }

  async update(
    tenantId: string,
    id: string,
    actorId: string,
    dto: UpdateStaffDto,
  ) {
    const staff = await this.prisma.user.findFirst({
      where: { id, tenantId, role: { in: STAFF_ROLES } },
    });
    if (!staff) throw new NotFoundException('Staff member not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role,
        isActive: dto.isActive,
        pin: dto.pin,
      },
    });

    await this.audit.log({
      tenantId,
      userId: actorId,
      action: 'STAFF_UPDATED',
      entity: 'User',
      entityId: id,
      metadata: { ...dto },
    });

    return updated;
  }
}
