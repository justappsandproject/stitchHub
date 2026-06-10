import {
  Body,
  Controller,
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
  CreateMeasurementDto,
  CreateMeasurementTemplateDto,
  UpdateMeasurementDto,
} from './dto/measurement.dto';
import { MeasurementsService } from './measurements.service';

@ApiTags('Measurements')
@Controller('measurements')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class MeasurementsController {
  constructor(private measurementsService: MeasurementsService) {}

  @Get('templates')
  @Roles(
    UserRole.TENANT_OWNER,
    UserRole.MANAGER,
    UserRole.TAILOR,
    UserRole.CUTTER,
    UserRole.FINISHER,
    UserRole.APPRENTICE,
  )
  getTemplates(@CurrentUser() user: JwtPayload) {
    const tenantId = resolveTenantId(user);
    return this.measurementsService.getTemplates(tenantId);
  }

  @Post('templates')
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  createTemplate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMeasurementTemplateDto,
  ) {
    const tenantId = resolveTenantId(user);
    return this.measurementsService.createTemplate(tenantId, dto);
  }

  @Post()
  @Roles(
    UserRole.TENANT_OWNER,
    UserRole.MANAGER,
    UserRole.TAILOR,
    UserRole.CUTTER,
  )
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateMeasurementDto) {
    const tenantId = resolveTenantId(user);
    return this.measurementsService.create(tenantId, dto, user.sub);
  }

  @Get('customer/:customerId')
  @Roles(
    UserRole.TENANT_OWNER,
    UserRole.MANAGER,
    UserRole.TAILOR,
    UserRole.CUTTER,
    UserRole.FINISHER,
    UserRole.APPRENTICE,
    UserRole.CUSTOMER,
  )
  findByCustomer(
    @CurrentUser() user: JwtPayload,
    @Param('customerId') customerId: string,
  ) {
    const tenantId = resolveTenantId(user);
    return this.measurementsService.findByCustomer(tenantId, customerId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const tenantId = resolveTenantId(user);
    return this.measurementsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER, UserRole.TAILOR)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMeasurementDto,
  ) {
    const tenantId = resolveTenantId(user);
    return this.measurementsService.update(tenantId, id, dto, user.sub);
  }
}
