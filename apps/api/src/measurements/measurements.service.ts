import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMeasurementDto,
  CreateMeasurementTemplateDto,
  UpdateMeasurementDto,
} from './dto/measurement.dto';

@Injectable()
export class MeasurementsService {
  constructor(private prisma: PrismaService) {}

  async getTemplates(tenantId: string) {
    return this.prisma.measurementTemplate.findMany({
      where: { tenantId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async createTemplate(tenantId: string, dto: CreateMeasurementTemplateDto) {
    return this.prisma.measurementTemplate.create({
      data: { tenantId, ...dto, fields: dto.fields as object },
    });
  }

  async create(
    tenantId: string,
    dto: CreateMeasurementDto,
    takenBy?: string,
  ) {
    const [customer, template] = await Promise.all([
      this.prisma.customer.findFirst({
        where: { id: dto.customerId, tenantId },
      }),
      this.prisma.measurementTemplate.findFirst({
        where: { id: dto.templateId, tenantId },
      }),
    ]);

    if (!customer) throw new NotFoundException('Customer not found');
    if (!template) throw new NotFoundException('Template not found');

    const latest = await this.prisma.measurement.findFirst({
      where: { customerId: dto.customerId, templateId: dto.templateId },
      orderBy: { version: 'desc' },
    });

    const version = (latest?.version ?? 0) + 1;

    return this.prisma.measurement.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        templateId: dto.templateId,
        version,
        values: dto.values,
        notes: dto.notes,
        takenBy,
      },
      include: { template: true, customer: true },
    });
  }

  async findByCustomer(tenantId: string, customerId: string) {
    return this.prisma.measurement.findMany({
      where: { tenantId, customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        template: true,
        revisions: { orderBy: { version: 'desc' } },
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const measurement = await this.prisma.measurement.findFirst({
      where: { id, tenantId },
      include: {
        template: true,
        customer: true,
        revisions: { orderBy: { version: 'desc' } },
      },
    });

    if (!measurement) {
      throw new NotFoundException('Measurement not found');
    }

    return measurement;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateMeasurementDto,
    revisedBy?: string,
  ) {
    const existing = await this.findOne(tenantId, id);

    await this.prisma.measurementRevision.create({
      data: {
        measurementId: id,
        version: existing.version,
        values: existing.values as object,
        notes: existing.notes,
        revisedBy,
      },
    });

    return this.prisma.measurement.update({
      where: { id },
      data: {
        values: dto.values,
        notes: dto.notes,
        version: existing.version + 1,
      },
      include: { template: true, revisions: true },
    });
  }
}
