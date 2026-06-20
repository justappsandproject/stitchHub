import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import {
  CreateBodyMeasurementDto,
  CreateMeasurementDto,
  CreateMeasurementTemplateDto,
  MeasurementQueryDto,
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

  @Post('body')
  @Roles(
    UserRole.TENANT_OWNER,
    UserRole.MANAGER,
    UserRole.TAILOR,
    UserRole.CUTTER,
  )
  createBody(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBodyMeasurementDto,
  ) {
    const tenantId = resolveTenantId(user);
    return this.measurementsService.createBodyMeasurement(
      tenantId,
      dto,
      user.sub,
    );
  }

  @Get()
  @Roles(
    UserRole.TENANT_OWNER,
    UserRole.MANAGER,
    UserRole.TAILOR,
    UserRole.CUTTER,
    UserRole.FINISHER,
    UserRole.APPRENTICE,
  )
  findAll(@CurrentUser() user: JwtPayload, @Query() query: MeasurementQueryDto) {
    return this.measurementsService.findAll(resolveTenantId(user), query);
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
    return this.measurementsService.findByCustomer(tenantId, customerId, user);
  }

  @Get('me')
  @Roles(UserRole.CUSTOMER)
  findMine(@CurrentUser() user: JwtPayload) {
    const tenantId = resolveTenantId(user);
    return this.measurementsService.findMine(tenantId, user);
  }

  @Get(':id')
  @Roles(
    UserRole.TENANT_OWNER,
    UserRole.MANAGER,
    UserRole.TAILOR,
    UserRole.CUTTER,
    UserRole.FINISHER,
    UserRole.APPRENTICE,
    UserRole.CUSTOMER,
  )
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const tenantId = resolveTenantId(user);
    return this.measurementsService.findOne(tenantId, id, user);
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
