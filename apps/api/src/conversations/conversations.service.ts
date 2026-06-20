import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessageSenderType, UserRole } from '@prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { resolveCustomerId } from '../common/utils/customer-scope';
import { AuditService } from '../common/services/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  async listInbox(tenantId: string) {
    const messages = await this.prisma.conversationMessage.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            photoUrl: true,
          },
        },
        sender: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    const threads = new Map<
      string,
      {
        customer: (typeof messages)[0]['customer'];
        lastMessage: (typeof messages)[0];
        unreadCount: number;
      }
    >();

    for (const msg of messages) {
      const existing = threads.get(msg.customerId);
      if (!existing) {
        threads.set(msg.customerId, {
          customer: msg.customer,
          lastMessage: msg,
          unreadCount: msg.senderType === MessageSenderType.CUSTOMER && !msg.read ? 1 : 0,
        });
      } else if (msg.senderType === MessageSenderType.CUSTOMER && !msg.read) {
        existing.unreadCount += 1;
      }
    }

    return Array.from(threads.values());
  }

  async getThread(tenantId: string, customerId: string, user: JwtPayload) {
    if (user.role === UserRole.CUSTOMER) {
      const ownId = await resolveCustomerId(this.prisma, user);
      if (ownId !== customerId) {
        throw new ForbiddenException('Access denied');
      }
    }

    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    await this.prisma.conversationMessage.updateMany({
      where: {
        tenantId,
        customerId,
        read: false,
        senderType:
          user.role === UserRole.CUSTOMER
            ? MessageSenderType.STAFF
            : MessageSenderType.CUSTOMER,
      },
      data: { read: true },
    });

    return this.prisma.conversationMessage.findMany({
      where: { tenantId, customerId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  }

  async send(tenantId: string, user: JwtPayload, dto: SendMessageDto) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId },
      include: { user: true },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    if (user.role === UserRole.CUSTOMER) {
      const ownId = await resolveCustomerId(this.prisma, user);
      if (ownId !== dto.customerId) {
        throw new ForbiddenException('Access denied');
      }
    }

    const senderType =
      user.role === UserRole.CUSTOMER
        ? MessageSenderType.CUSTOMER
        : MessageSenderType.STAFF;

    const message = await this.prisma.conversationMessage.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        senderId: user.sub,
        senderType,
        content: dto.content,
        attachments: dto.attachments ?? [],
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    await this.audit.log({
      tenantId,
      userId: user.sub,
      actorType: senderType,
      action: 'MESSAGE_SENT',
      entity: 'ConversationMessage',
      entityId: message.id,
    });

    const notifyUserId =
      senderType === MessageSenderType.STAFF
        ? customer.userId
        : undefined;

    if (notifyUserId) {
      await this.notifications.notifyNewMessage({
        userId: notifyUserId,
        title: 'New message',
        body: dto.content ?? 'You have a new message',
        customerId: dto.customerId,
      });
    } else if (senderType === MessageSenderType.CUSTOMER) {
      const staff = await this.prisma.user.findMany({
        where: {
          tenantId,
          role: {
            in: [
              UserRole.TENANT_OWNER,
              UserRole.MANAGER,
              UserRole.TAILOR,
            ],
          },
          isActive: true,
        },
        select: { id: true },
      });
      await Promise.allSettled(
        staff.map((s) =>
          this.notifications.notifyNewMessage({
            userId: s.id,
            title: `Message from ${customer.firstName}`,
            body: dto.content ?? 'New customer message',
            customerId: dto.customerId,
          }),
        ),
      );
    }

    return message;
  }

  async unreadCount(tenantId: string, user: JwtPayload) {
    if (user.role === UserRole.CUSTOMER) {
      const customerId = await resolveCustomerId(this.prisma, user);
      if (!customerId) return { count: 0 };
      const count = await this.prisma.conversationMessage.count({
        where: {
          tenantId,
          customerId,
          read: false,
          senderType: MessageSenderType.STAFF,
        },
      });
      return { count };
    }

    const count = await this.prisma.conversationMessage.count({
      where: {
        tenantId,
        read: false,
        senderType: MessageSenderType.CUSTOMER,
      },
    });
    return { count };
  }
}
