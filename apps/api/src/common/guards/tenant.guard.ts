import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    if (!user.tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    request.tenantId = user.tenantId;
    return true;
  }
}
