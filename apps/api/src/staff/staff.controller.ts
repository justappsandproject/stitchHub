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
import { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto';
import { StaffService } from './staff.service';

@ApiTags('Staff')
@Controller('staff')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Get()
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER)
  findAll(@CurrentUser() user: JwtPayload) {
    return this.staffService.findAll(resolveTenantId(user));
  }

  @Post()
  @Roles(UserRole.TENANT_OWNER)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateStaffDto) {
    return this.staffService.create(resolveTenantId(user), user.sub, dto);
  }

  @Patch(':id')
  @Roles(UserRole.TENANT_OWNER)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.staffService.update(resolveTenantId(user), id, user.sub, dto);
  }
}
