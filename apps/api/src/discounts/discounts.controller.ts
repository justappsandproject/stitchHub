import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import {
  CreateDiscountDto,
  UpdateDiscountDto,
  ValidateDiscountDto,
} from './dto/discount.dto';
import { DiscountsService } from './discounts.service';

@ApiTags('Discounts')
@Controller('discounts')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class DiscountsController {
  constructor(private discountsService: DiscountsService) {}

  @Get()
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  findAll(@CurrentUser() user: JwtPayload) {
    const tenantId = resolveTenantId(user);
    return this.discountsService.findAll(tenantId);
  }

  @Post('validate')
  @Roles(
    UserRole.TENANT_OWNER,
    UserRole.MANAGER,
    UserRole.TAILOR,
    UserRole.CUSTOMER,
  )
  validate(@CurrentUser() user: JwtPayload, @Body() dto: ValidateDiscountDto) {
    const tenantId = resolveTenantId(user);
    return this.discountsService.validate(tenantId, dto);
  }

  @Get(':id')
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const tenantId = resolveTenantId(user);
    return this.discountsService.findOne(tenantId, id);
  }

  @Post()
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateDiscountDto) {
    const tenantId = resolveTenantId(user);
    return this.discountsService.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateDiscountDto,
  ) {
    const tenantId = resolveTenantId(user);
    return this.discountsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const tenantId = resolveTenantId(user);
    return this.discountsService.remove(tenantId, id);
  }
}
