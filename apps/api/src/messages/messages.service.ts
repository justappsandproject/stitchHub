import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { SendMessageDto } from './dto/message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async listThreads() {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        platformMessages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            body: true,
            createdAt: true,
            readAt: true,
            sender: { select: { role: true, firstName: true, lastName: true } },
          },
        },
        _count: {
          select: {
            platformMessages: {
              where: {
                readAt: null,
                sender: { role: { not: UserRole.SUPER_ADMIN } },
              },
            },
          },
        },
      },
    });

    return tenants
      .filter((t) => t.platformMessages.length > 0)
      .map((t) => {
        const last = t.platformMessages[0];
        const lastFromTenant = last?.sender.role !== UserRole.SUPER_ADMIN;
        return {
          tenantId: t.id,
          tenantName: t.name,
          slug: t.slug,
          unreadCount: t._count.platformMessages,
          lastMessage: last
            ? {
                ...last,
                isUnread: lastFromTenant && !last.readAt,
              }
            : null,
        };
      })
      .sort((a, b) => {
        if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
        const aTime = a.lastMessage?.createdAt?.getTime() ?? 0;
        const bTime = b.lastMessage?.createdAt?.getTime() ?? 0;
        return bTime - aTime;
      });
  }

  async getUnreadCount(user: JwtPayload) {
    if (user.role === UserRole.SUPER_ADMIN) {
      const count = await this.prisma.platformMessage.count({
        where: {
          readAt: null,
          sender: { role: { not: UserRole.SUPER_ADMIN } },
        },
      });
      return { count };
    }

    if (!user.tenantId) return { count: 0 };

    const count = await this.prisma.platformMessage.count({
      where: {
        tenantId: user.tenantId,
        readAt: null,
        sender: { role: UserRole.SUPER_ADMIN },
      },
    });
    return { count };
  }

  async getThread(tenantId: string, user: JwtPayload) {
    if (user.role !== UserRole.SUPER_ADMIN && user.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true },
    });
    if (!tenant) throw new NotFoundException('Fashion house not found');

    if (user.role === UserRole.SUPER_ADMIN) {
      await this.markThreadRead(tenantId);
    } else {
      await this.prisma.platformMessage.updateMany({
        where: {
          tenantId,
          readAt: null,
          sender: { role: UserRole.SUPER_ADMIN },
        },
        data: { readAt: new Date() },
      });
    }

    const messages = await this.prisma.platformMessage.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            email: true,
          },
        },
      },
    });

    return { tenant, messages, unreadCount: 0 };
  }

  async send(dto: SendMessageDto, user: JwtPayload) {
    let tenantId: string;

    if (user.role === UserRole.SUPER_ADMIN) {
      if (!dto.tenantId) {
        throw new ForbiddenException('tenantId is required');
      }
      tenantId = dto.tenantId;
    } else {
      if (!user.tenantId) {
        throw new ForbiddenException('Tenant context required');
      }
      tenantId = user.tenantId;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Fashion house not found');

    return this.prisma.platformMessage.create({
      data: {
        tenantId,
        senderId: user.sub,
        body: dto.body.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  async markThreadRead(tenantId: string) {
    await this.prisma.platformMessage.updateMany({
      where: {
        tenantId,
        readAt: null,
        sender: { role: { not: UserRole.SUPER_ADMIN } },
      },
      data: { readAt: new Date() },
    });
    return { message: 'Marked as read' };
  }
}
