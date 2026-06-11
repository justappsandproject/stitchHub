import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import { InitializePaymentDto } from './dto/payment.dto';
import { PaystackService } from './paystack.service';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private subscriptionsService: SubscriptionsService,
    private paystackService: PaystackService,
  ) {}

  @Get('plans')
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('paystack/config')
  getPaystackConfig() {
    return this.paystackService.getConfig();
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
    if (this.paystackService.isEnabled()) {
      return {
        requiresPayment: true,
        message: 'Use Paystack payment to change your plan.',
      };
    }
    return this.subscriptionsService.changePlan(tenantId, dto.plan);
  }

  @Post('paystack/initialize')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_OWNER)
  @ApiBearerAuth()
  initializePayment(
    @CurrentUser() user: JwtPayload,
    @Body() dto: InitializePaymentDto,
  ) {
    const tenantId = resolveTenantId(user);
    return this.paystackService.initialize(tenantId, dto.plan, user.email);
  }

  @Get('paystack/verify')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_OWNER)
  @ApiBearerAuth()
  verifyPayment(
    @Query('reference') reference: string,
  ) {
    return this.paystackService.verify(reference);
  }
}
