import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { resolveTenantId } from '../common/utils/tenant-scope';
import { ChangePlanDto } from './dto/subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('current')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  getCurrent(@CurrentUser() user: JwtPayload) {
    const tenantId = resolveTenantId(user);
    return this.subscriptionsService.getCurrent(tenantId);
  }

  @Post('change-plan')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_OWNER)
  @ApiBearerAuth()
  changePlan(@CurrentUser() user: JwtPayload, @Body() dto: ChangePlanDto) {
    const tenantId = resolveTenantId(user);
    return this.subscriptionsService.changePlan(tenantId, dto.plan);
  }
}
