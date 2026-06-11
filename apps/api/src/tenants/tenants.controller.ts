import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { resolveTenantId } from '../common/utils/tenant-scope';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UpdateTenantDto } from './dto/tenant.dto';
import {
  AdminUpdateTenantDto,
  ResetOwnerPasswordDto,
} from './dto/admin-tenant.dto';
import { TenantsService } from './tenants.service';

@ApiTags('Tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get('current')
  @UseGuards(TenantGuard)
  findCurrent(@CurrentUser() user: JwtPayload) {
    const tenantId = resolveTenantId(user);
    return this.tenantsService.findOne(tenantId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch('current')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles(UserRole.TENANT_OWNER)
  updateCurrent(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTenantDto,
  ) {
    const tenantId = resolveTenantId(user);
    return this.tenantsService.update(tenantId, dto);
  }

  @Patch(':id/admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  adminUpdate(@Param('id') id: string, @Body() dto: AdminUpdateTenantDto) {
    return this.tenantsService.adminUpdate(id, dto);
  }

  @Patch(':id/owner-password')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  resetOwnerPassword(
    @Param('id') id: string,
    @Body() dto: ResetOwnerPasswordDto,
  ) {
    return this.tenantsService.resetOwnerPassword(id, dto.newPassword);
  }
}
