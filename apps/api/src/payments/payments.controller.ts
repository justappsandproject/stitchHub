import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { resolveTenantId } from '../common/utils/tenant-scope';
import { CreateInvoiceDto, CreatePaymentDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('invoices')
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  createInvoice(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateInvoiceDto,
  ) {
    const tenantId = resolveTenantId(user);
    return this.paymentsService.createInvoice(tenantId, dto);
  }

  @Get('invoices')
  @Roles(
    UserRole.TENANT_OWNER,
    UserRole.MANAGER,
    UserRole.TAILOR,
    UserRole.CUSTOMER,
  )
  findInvoices(
    @CurrentUser() user: JwtPayload,
    @Query('orderId') orderId?: string,
  ) {
    const tenantId = resolveTenantId(user);
    return this.paymentsService.findInvoices(tenantId, orderId, user);
  }

  @Post()
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  createPayment(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePaymentDto,
  ) {
    const tenantId = resolveTenantId(user);
    return this.paymentsService.createPayment(tenantId, dto);
  }

  @Get()
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  findPayments(@CurrentUser() user: JwtPayload) {
    const tenantId = resolveTenantId(user);
    return this.paymentsService.findPayments(tenantId);
  }

  @Get('receipts')
  @Roles(
    UserRole.TENANT_OWNER,
    UserRole.MANAGER,
    UserRole.TAILOR,
    UserRole.CUSTOMER,
  )
  findReceipts(@CurrentUser() user: JwtPayload) {
    const tenantId = resolveTenantId(user);
    return this.paymentsService.findReceipts(tenantId, user);
  }
}
