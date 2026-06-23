import {
  Body,
  Controller,
  Delete,
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
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateStyleDto, StyleQueryDto, UpdateStyleDto } from './dto/style.dto';
import { TryOnDto } from './dto/try-on.dto';
import { StylesService } from './styles.service';

@ApiTags('Styles')
@Controller('styles')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class StylesController {
  constructor(
    private stylesService: StylesService,
    private subscriptions: SubscriptionsService,
  ) {}

  @Get()
  @Roles(
    UserRole.TENANT_OWNER,
    UserRole.MANAGER,
    UserRole.TAILOR,
    UserRole.CUTTER,
    UserRole.FINISHER,
    UserRole.APPRENTICE,
    UserRole.CUSTOMER,
  )
  findAll(@CurrentUser() user: JwtPayload, @Query() query: StyleQueryDto) {
    const tenantId = resolveTenantId(user);
    const activeOnly = user.role === UserRole.CUSTOMER;
    return this.stylesService.findAll(tenantId, query, activeOnly);
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
    const activeOnly = user.role === UserRole.CUSTOMER;
    return this.stylesService.findOne(tenantId, id, activeOnly);
  }

  @Post()
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateStyleDto) {
    const tenantId = resolveTenantId(user);
    return this.subscriptions
      .assertFeature(tenantId, 'styleStore')
      .then(() => this.stylesService.create(tenantId, dto));
  }

  @Patch(':id')
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateStyleDto,
  ) {
    const tenantId = resolveTenantId(user);
    return this.subscriptions
      .assertFeature(tenantId, 'styleStore')
      .then(() => this.stylesService.update(tenantId, id, dto));
  }

  @Delete(':id')
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const tenantId = resolveTenantId(user);
    return this.subscriptions
      .assertFeature(tenantId, 'styleStore')
      .then(() => this.stylesService.remove(tenantId, id));
  }

  @Post(':id/try-on')
  @Roles(UserRole.CUSTOMER)
  tryOn(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: TryOnDto,
  ) {
    const tenantId = resolveTenantId(user);
    return this.stylesService.tryOn(tenantId, id, user, dto);
  }
}
