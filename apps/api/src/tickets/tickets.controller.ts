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
  CreateTicketDto,
  CreateTicketReplyDto,
  UpdateTicketStatusDto,
} from './dto/ticket.dto';
import { TicketsService } from './tickets.service';

@ApiTags('Tickets')
@Controller('tickets')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTicketDto) {
    return this.ticketsService.create(resolveTenantId(user), user, dto);
  }

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
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('customerId') customerId?: string,
  ) {
    const tenantId = resolveTenantId(user);
    if (user.role === UserRole.CUSTOMER) {
      return this.ticketsService.findAll(tenantId);
    }
    return this.ticketsService.findAll(tenantId, customerId);
  }

  @Get(':id')
  @Roles(
    UserRole.TENANT_OWNER,
    UserRole.MANAGER,
    UserRole.TAILOR,
    UserRole.CUSTOMER,
  )
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ticketsService.findOne(resolveTenantId(user), id, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.TENANT_OWNER, UserRole.MANAGER, UserRole.TAILOR)
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return this.ticketsService.updateStatus(
      resolveTenantId(user),
      id,
      dto,
      user,
    );
  }

  @Post(':id/replies')
  @Roles(
    UserRole.TENANT_OWNER,
    UserRole.MANAGER,
    UserRole.TAILOR,
    UserRole.CUSTOMER,
  )
  addReply(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateTicketReplyDto,
  ) {
    return this.ticketsService.addReply(
      resolveTenantId(user),
      id,
      user,
      dto,
    );
  }
}
