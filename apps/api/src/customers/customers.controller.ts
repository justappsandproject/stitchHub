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
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  SearchCustomersDto,
  UpdateCustomerDto,
} from './dto/customer.dto';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(
  UserRole.TENANT_OWNER,
  UserRole.MANAGER,
  UserRole.TAILOR,
  UserRole.CUTTER,
  UserRole.FINISHER,
  UserRole.APPRENTICE,
)
@ApiBearerAuth()
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCustomerDto) {
    const tenantId = resolveTenantId(user);
    return this.customersService.create(tenantId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: SearchCustomersDto,
  ) {
    const tenantId = resolveTenantId(user);
    return this.customersService.findAll(tenantId, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const tenantId = resolveTenantId(user);
    return this.customersService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const tenantId = resolveTenantId(user);
    return this.customersService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const tenantId = resolveTenantId(user);
    return this.customersService.remove(tenantId, id);
  }
}
