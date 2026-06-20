import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    tenantId?: string;
    userId?: string;
    actorType?: string;
    action: string;
    entity: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        actorType: params.actorType ?? 'STAFF',
        action: params.action,
        entity: params.entity,
        entityType: params.entityType ?? params.entity,
        entityId: params.entityId,
        metadata: params.metadata as object | undefined,
        ipAddress: params.ipAddress,
      },
    });
  }
}
