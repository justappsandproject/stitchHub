import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

export function resolveTenantId(
  user: JwtPayload,
  requestedTenantId?: string,
): string {
  if (user.role === UserRole.SUPER_ADMIN) {
    if (!requestedTenantId) {
      throw new ForbiddenException('Super admin must specify tenantId');
    }
    return requestedTenantId;
  }

  if (!user.tenantId) {
    throw new ForbiddenException('Tenant context required');
  }

  return user.tenantId;
}
