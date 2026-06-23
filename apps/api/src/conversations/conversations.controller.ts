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
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ConversationsService } from './conversations.service';
import { SendMessageDto } from './dto/conversation.dto';

@ApiTags('Conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class ConversationsController {
  constructor(
    private conversationsService: ConversationsService,
    private subscriptions: SubscriptionsService,
  ) {}

  private async assertMessaging(tenantId: string) {
    await this.subscriptions.assertFeature(tenantId, 'messaging');
  }

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
    const tenantId = resolveTenantId(user);
    return this.assertMessaging(tenantId).then(() =>
      this.conversationsService.listInbox(tenantId),
    );
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
    const tenantId = resolveTenantId(user);
    return this.assertMessaging(tenantId).then(() =>
      this.conversationsService.unreadCount(tenantId, user),
    );
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
    const tenantId = resolveTenantId(user);
    return this.assertMessaging(tenantId).then(() =>
      this.conversationsService.getThread(tenantId, customerId, user),
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
    const tenantId = resolveTenantId(user);
    return this.assertMessaging(tenantId).then(() =>
      this.conversationsService.send(tenantId, user, dto),
    );
  }
}
