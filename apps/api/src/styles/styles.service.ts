import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { resolveCustomerId } from '../common/utils/customer-scope';
import { PrismaService } from '../prisma/prisma.service';
import { AiTryOnService } from './ai-try-on.service';
import { CreateStyleDto, StyleQueryDto, UpdateStyleDto } from './dto/style.dto';
import { TryOnDto } from './dto/try-on.dto';

@Injectable()
export class StylesService {
  constructor(
    private prisma: PrismaService,
    private aiTryOn: AiTryOnService,
  ) {}

  async findAll(tenantId: string, query: StyleQueryDto, activeOnly = false) {
    const where: Prisma.StyleWhereInput = { tenantId };
    if (activeOnly) where.isActive = true;
    if (query.category) where.category = query.category;
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { category: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.style.findMany({
      where,
      orderBy: this.resolveSort(query.sort),
    });
  }

  private resolveSort(sort?: string): Prisma.StyleOrderByWithRelationInput[] {
    switch (sort) {
      case 'price':
        return [{ basePrice: 'desc' }, { createdAt: 'desc' }];
      case 'name':
        return [{ name: 'asc' }];
      case 'date':
      default:
        return [{ isActive: 'desc' }, { createdAt: 'desc' }];
    }
  }

  async findOne(tenantId: string, id: string, activeOnly = false) {
    const style = await this.prisma.style.findFirst({
      where: {
        id,
        tenantId,
        ...(activeOnly ? { isActive: true } : {}),
      },
    });
    if (!style) throw new NotFoundException('Style not found');
    return style;
  }

  async create(tenantId: string, dto: CreateStyleDto) {
    return this.prisma.style.create({
      data: {
        tenantId,
        name: dto.name,
        category: dto.category,
        description: dto.description,
        photoUrls: dto.photoUrls ?? [],
        videoUrls: dto.videoUrls ?? [],
        basePrice: dto.basePrice,
        stockQuantity: dto.stockQuantity ?? 0,
        tags: dto.tags ?? [],
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateStyleDto) {
    await this.findOne(tenantId, id);
    return this.prisma.style.update({ where: { id }, data: dto });
  }

  async remove(tenantId: string, id: string) {
    const style = await this.findOne(tenantId, id);
    await this.prisma.style.delete({ where: { id: style.id } });
    return { message: 'Style deleted', id };
  }

  async tryOn(
    tenantId: string,
    styleId: string,
    user: JwtPayload,
    dto: TryOnDto,
  ) {
    if (user.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException('Try-on is available to customers only');
    }

    const style = await this.findOne(tenantId, styleId, true);
    const customerId = await resolveCustomerId(this.prisma, user);
    if (!customerId) {
      throw new ForbiddenException('No customer profile linked to this account');
    }

    const measurements = await this.prisma.measurement.findMany({
      where: { customerId, tenantId },
      include: { template: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const snapshots = measurements.map((m) => ({
      templateName: m.template?.name ?? 'Measurement',
      values: (m.values as Record<string, number>) ?? {},
    }));

    return this.aiTryOn.generatePreview({
      styleName: style.name,
      styleCategory: style.category,
      styleDescription: style.description,
      stylePhotoUrls: style.photoUrls,
      measurements: snapshots,
      customerPhotoUrl: dto.customerPhotoUrl,
      skinTone: dto.skinTone,
      bodyType: dto.bodyType,
      gender: dto.gender,
    });
  }

  async findLookbook(query: {
    tenantSlug?: string;
    fashionHouseId?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    let tenantId = query.fashionHouseId;
    if (!tenantId && query.tenantSlug) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: query.tenantSlug },
        select: { id: true, name: true, slug: true },
      });
      if (!tenant) return { items: [], total: 0, page, limit };
      tenantId = tenant.id;
    }
    if (!tenantId) return { items: [], total: 0, page, limit };

    const where: Prisma.StyleWhereInput = {
      tenantId,
      isActive: true,
      ...(query.category ? { category: query.category } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.style.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.style.count({ where }),
    ]);

    return { items, total, page, limit };
  }
}
