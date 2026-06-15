import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStyleDto, StyleQueryDto, UpdateStyleDto } from './dto/style.dto';

@Injectable()
export class StylesService {
  constructor(private prisma: PrismaService) {}

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
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
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
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateStyleDto) {
    await this.findOne(tenantId, id);
    return this.prisma.style.update({ where: { id }, data: dto });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.style.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
