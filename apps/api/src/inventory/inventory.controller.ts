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
  AdjustInventoryDto,
  CreateInventoryProductDto,
  InventoryQueryDto,
  RestockInventoryDto,
  UpdateInventoryProductDto,
} from './dto/inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('dashboard')
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER, UserRole.TAILOR)
  getDashboard(@CurrentUser() user: JwtPayload) {
    return this.inventoryService.getDashboard(resolveTenantId(user));
  }

  @Get('transactions')
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER, UserRole.TAILOR)
  listTransactions(
    @CurrentUser() user: JwtPayload,
    @Query('productId') productId?: string,
  ) {
    return this.inventoryService.listTransactions(
      resolveTenantId(user),
      productId,
    );
  }

  @Get()
  @Roles(
    UserRole.TENANT_OWNER,
    UserRole.MANAGER,
    UserRole.TAILOR,
    UserRole.CUTTER,
    UserRole.FINISHER,
  )
  findAll(@CurrentUser() user: JwtPayload, @Query() query: InventoryQueryDto) {
    return this.inventoryService.findAll(resolveTenantId(user), query);
  }

  @Get(':id')
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER, UserRole.TAILOR)
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.inventoryService.findOne(resolveTenantId(user), id);
  }

  @Post()
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateInventoryProductDto) {
    return this.inventoryService.create(resolveTenantId(user), dto);
  }

  @Patch(':id')
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateInventoryProductDto,
  ) {
    return this.inventoryService.update(resolveTenantId(user), id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.inventoryService.remove(resolveTenantId(user), id);
  }

  @Post(':id/restock')
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER, UserRole.TAILOR)
  restock(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: RestockInventoryDto,
  ) {
    return this.inventoryService.restock(
      resolveTenantId(user),
      id,
      dto,
      user.sub,
    );
  }

  @Post(':id/adjust')
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER, UserRole.TAILOR)
  adjust(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AdjustInventoryDto,
  ) {
    return this.inventoryService.adjust(
      resolveTenantId(user),
      id,
      dto,
      user.sub,
    );
  }
}
