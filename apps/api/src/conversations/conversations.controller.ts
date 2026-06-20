import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { resolveTenantId } from '../common/utils/tenant-scope';
import { ConversationsService } from './conversations.service';
import { SendMessageDto } from './dto/conversation.dto';

@ApiTags('Conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  @Get('inbox')
  @Roles(
    UserRole.TENANT_OWNER,
    UserRole.MANAGER,
    UserRole.TAILOR,
    UserRole.CUTTER,
    UserRole.FINISHER,
    UserRole.APPRENTICE,
  )
  inbox(@CurrentUser() user: JwtPayload) {
    return this.conversationsService.listInbox(resolveTenantId(user));
  }

  @Get('unread-count')
  @Roles(
    UserRole.TENANT_OWNER,
    UserRole.MANAGER,
    UserRole.TAILOR,
    UserRole.CUTTER,
    UserRole.FINISHER,
    UserRole.APPRENTICE,
    UserRole.CUSTOMER,
  )
  unreadCount(@CurrentUser() user: JwtPayload) {
    return this.conversationsService.unreadCount(resolveTenantId(user), user);
  }

  @Get(':customerId')
  @Roles(
    UserRole.TENANT_OWNER,
    UserRole.MANAGER,
    UserRole.TAILOR,
    UserRole.CUTTER,
    UserRole.FINISHER,
    UserRole.APPRENTICE,
    UserRole.CUSTOMER,
  )
  thread(@CurrentUser() user: JwtPayload, @Param('customerId') customerId: string) {
    return this.conversationsService.getThread(
      resolveTenantId(user),
      customerId,
      user,
    );
  }

  @Post()
  @Roles(
    UserRole.TENANT_OWNER,
    UserRole.MANAGER,
    UserRole.TAILOR,
    UserRole.CUTTER,
    UserRole.FINISHER,
    UserRole.APPRENTICE,
    UserRole.CUSTOMER,
  )
  send(@CurrentUser() user: JwtPayload, @Body() dto: SendMessageDto) {
    return this.conversationsService.send(resolveTenantId(user), user, dto);
  }
}
