import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { LoginDto, RegisterStaffDto, RegisterTenantDto } from './dto/auth.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private subscriptions: SubscriptionsService,
  ) {}

  async registerTenant(dto: RegisterTenantDto) {
    const existingSlug = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });
    if (existingSlug) {
      throw new ConflictException('Business slug already taken');
    }

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.businessName,
        slug: dto.slug,
        email: dto.email,
        phone: dto.phone,
        users: {
          create: {
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            role: UserRole.TENANT_OWNER,
          },
        },
        measurementTemplates: {
          create: [
            {
              name: 'Men Standard',
              category: 'MEN',
              isDefault: true,
              fields: [
                { key: 'neck', label: 'Neck', unit: 'in' },
                { key: 'chest', label: 'Chest', unit: 'in' },
                { key: 'waist', label: 'Waist', unit: 'in' },
                { key: 'hip', label: 'Hip', unit: 'in' },
                { key: 'shoulder', label: 'Shoulder', unit: 'in' },
                { key: 'sleeve', label: 'Sleeve', unit: 'in' },
                { key: 'wrist', label: 'Wrist', unit: 'in' },
                { key: 'inseam', label: 'Inseam', unit: 'in' },
                { key: 'trouser_length', label: 'Trouser Length', unit: 'in' },
              ],
            },
            {
              name: 'Women Standard',
              category: 'WOMEN',
              isDefault: true,
              fields: [
                { key: 'bust', label: 'Bust', unit: 'in' },
                { key: 'waist', label: 'Waist', unit: 'in' },
                { key: 'hip', label: 'Hip', unit: 'in' },
                { key: 'shoulder', label: 'Shoulder', unit: 'in' },
                { key: 'sleeve', label: 'Sleeve', unit: 'in' },
                { key: 'dress_length', label: 'Dress Length', unit: 'in' },
              ],
            },
            {
              name: 'Children Standard',
              category: 'CHILDREN',
              isDefault: true,
              fields: [
                { key: 'chest', label: 'Chest', unit: 'in' },
                { key: 'waist', label: 'Waist', unit: 'in' },
                { key: 'hip', label: 'Hip', unit: 'in' },
                { key: 'sleeve', label: 'Sleeve', unit: 'in' },
                { key: 'trouser_length', label: 'Trouser Length', unit: 'in' },
              ],
            },
          ],
        },
      },
      include: { users: true },
    });

    // Every new tenant starts on a 14-day Starter trial.
    await this.subscriptions.getOrCreate(tenant.id);

    const owner = tenant.users[0];
    return this.buildAuthResponse({ ...owner, tenant: { name: tenant.name } });
  }

  async registerStaff(tenantId: string, dto: RegisterStaffDto) {
    await this.subscriptions.assertFeature(tenantId, 'staffManagement');

    const staffRoles: UserRole[] = [
      UserRole.MANAGER,
      UserRole.TAILOR,
      UserRole.CUTTER,
      UserRole.FINISHER,
      UserRole.APPRENTICE,
    ];

    if (!staffRoles.includes(dto.role)) {
      throw new ConflictException('Invalid staff role');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role,
      },
    });

    return this.sanitizeUser(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { tenant: { select: { name: true } } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: { include: { tenant: { select: { name: true } } } },
      },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    return this.buildAuthResponse(stored.user);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        customer: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toAuthUser(user);
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    role: UserRole;
    tenantId: string | null;
    firstName: string;
    lastName: string;
    tenant?: { name: string } | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      firstName: user.firstName,
      lastName: user.lastName,
      fashionHouseName: user.tenant?.name ?? null,
    };
  }

  private async buildAuthResponse(user: {
    id: string;
    email: string;
    role: UserRole;
    tenantId: string | null;
    firstName: string;
    lastName: string;
    tenant?: { name: string } | null;
  }) {
    let fashionHouseName = user.tenant?.name ?? null;

    if (!fashionHouseName && user.tenantId) {
      const fashionHouse = await this.prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: { name: true },
      });
      fashionHouseName = fashionHouse?.name ?? null;
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        firstName: user.firstName,
        lastName: user.lastName,
        fashionHouseName,
      },
    };
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(40).toString('hex');
    const expiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    const expiresAt = new Date();
    const days = parseInt(expiresIn.replace('d', ''), 10) || 7;
    expiresAt.setDate(expiresAt.getDate() + days);

    await this.prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });

    return token;
  }

  private sanitizeUser(user: Record<string, unknown>) {
    const { passwordHash: _, ...rest } = user;
    return rest;
  }
}
