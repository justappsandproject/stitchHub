import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { resolveTenantId } from '../common/utils/tenant-scope';
import { SendMessageDto } from './dto/message.dto';
import { MessagesService } from './messages.service';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.messagesService.getUnreadCount(user);
  }

  @Get('threads')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  listThreads() {
    return this.messagesService.listThreads();
  }

  @Get('inbox')
  @UseGuards(TenantGuard)
  getInbox(@CurrentUser() user: JwtPayload) {
    const tenantId = resolveTenantId(user);
    return this.messagesService.getThread(tenantId, user);
  }

  @Get('tenant/:tenantId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  getTenantThread(
    @Param('tenantId') tenantId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagesService.getThread(tenantId, user);
  }

  @Patch('tenant/:tenantId/read')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  markRead(@Param('tenantId') tenantId: string) {
    return this.messagesService.markThreadRead(tenantId);
  }

  @Post()
  send(@CurrentUser() user: JwtPayload, @Body() dto: SendMessageDto) {
    return this.messagesService.send(dto, user);
  }
}
