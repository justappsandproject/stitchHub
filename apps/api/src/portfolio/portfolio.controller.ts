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
import {
  CreatePortfolioItemDto,
  PortfolioQueryDto,
  UpdatePortfolioItemDto,
} from './dto/portfolio.dto';
import { PortfolioService } from './portfolio.service';

@ApiTags('Portfolio')
@Controller('portfolio')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

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
  findAll(@CurrentUser() user: JwtPayload, @Query() query: PortfolioQueryDto) {
    const tenantId = resolveTenantId(user);
    const publishedOnly = user.role === UserRole.CUSTOMER;
    return this.portfolioService.findAll(tenantId, query, publishedOnly);
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
    const publishedOnly = user.role === UserRole.CUSTOMER;
    return this.portfolioService.findOne(tenantId, id, publishedOnly);
  }

  @Post()
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePortfolioItemDto) {
    const tenantId = resolveTenantId(user);
    return this.portfolioService.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePortfolioItemDto,
  ) {
    const tenantId = resolveTenantId(user);
    return this.portfolioService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const tenantId = resolveTenantId(user);
    return this.portfolioService.remove(tenantId, id);
  }
}
