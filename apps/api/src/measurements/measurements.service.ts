import { Injectable, NotFoundException } from '@nestjs/common';
import { MeasurementCategory, Prisma, UserRole } from '@prisma/client';
import { BODY_MEASUREMENT_FIELDS } from '@stitchhub/shared';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { assertCustomerResource } from '../common/utils/customer-scope';
import { AuditService } from '../common/services/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBodyMeasurementDto,
  CreateMeasurementDto,
  CreateMeasurementTemplateDto,
  MeasurementQueryDto,
  UpdateMeasurementDto,
} from './dto/measurement.dto';

const BODY_TEMPLATE_NAME = 'Standard Body Measurements';

@Injectable()
export class MeasurementsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

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
        unit: dto.unit ?? 'cm',
        photoUrls: dto.photoUrls ?? [],
        takenBy,
        takenById: takenBy,
      },
      include: { template: true, customer: true },
    });
  }

  private async ensureBodyTemplate(tenantId: string) {
    const existing = await this.prisma.measurementTemplate.findFirst({
      where: { tenantId, name: BODY_TEMPLATE_NAME },
    });
    if (existing) return existing;

    const allFields = [
      ...BODY_MEASUREMENT_FIELDS.upperBody,
      ...BODY_MEASUREMENT_FIELDS.lowerBody,
      ...BODY_MEASUREMENT_FIELDS.fullBody,
    ].map((key) => ({ key, label: key, type: 'number' }));

    return this.prisma.measurementTemplate.create({
      data: {
        tenantId,
        name: BODY_TEMPLATE_NAME,
        category: MeasurementCategory.WOMEN,
        isDefault: true,
        fields: allFields,
      },
    });
  }

  async createBodyMeasurement(
    tenantId: string,
    dto: CreateBodyMeasurementDto,
    takenBy?: string,
  ) {
    const template = await this.ensureBodyTemplate(tenantId);
    const measurement = await this.create(
      tenantId,
      {
        customerId: dto.customerId,
        templateId: template.id,
        values: dto.values,
        notes: dto.notes,
        unit: dto.unit,
        photoUrls: dto.photoUrls,
      },
      takenBy,
    );

    await this.audit.log({
      tenantId,
      userId: takenBy,
      action: 'MEASUREMENT_ADDED',
      entity: 'Measurement',
      entityId: measurement.id,
      metadata: { customerId: dto.customerId },
    });

    return measurement;
  }

  async findAll(tenantId: string, query: MeasurementQueryDto) {
    const where: Prisma.MeasurementWhereInput = { tenantId };

    if (query.customerId) where.customerId = query.customerId;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    return this.prisma.measurement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        template: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        takenByUser: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async findByCustomer(
    tenantId: string,
    customerId: string,
    user?: JwtPayload,
  ) {
    if (user?.role === UserRole.CUSTOMER) {
      await assertCustomerResource(this.prisma, user, customerId);
    }

    return this.prisma.measurement.findMany({
      where: { tenantId, customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        template: true,
        revisions: { orderBy: { version: 'desc' } },
      },
    });
  }

  async findMine(tenantId: string, user: JwtPayload) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId: user.sub },
      select: { id: true },
    });
    if (!customer) throw new NotFoundException('Customer profile not found');
    return this.findByCustomer(tenantId, customer.id, user);
  }

  async findOne(tenantId: string, id: string, user?: JwtPayload) {
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

    if (user?.role === UserRole.CUSTOMER) {
      await assertCustomerResource(this.prisma, user, measurement.customerId);
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
