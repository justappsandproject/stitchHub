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
import {
  CreateFinancialEntryDto,
  FinancialQueryDto,
} from './dto/financial.dto';
import { FinancialsService } from './financials.service';

@ApiTags('Financials')
@Controller('financials')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class FinancialsController {
  constructor(private financialsService: FinancialsService) {}

  @Get()
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  findAll(@CurrentUser() user: JwtPayload, @Query() query: FinancialQueryDto) {
    return this.financialsService.findAll(resolveTenantId(user), query);
  }

  @Get('summary')
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  summary(@CurrentUser() user: JwtPayload) {
    return this.financialsService.getSummary(resolveTenantId(user));
  }

  @Post()
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateFinancialEntryDto) {
    return this.financialsService.create(
      resolveTenantId(user),
      user.sub,
      dto,
    );
  }
}
