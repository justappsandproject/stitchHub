import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessageSenderType, TicketStatus, UserRole } from '@prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { resolveCustomerId } from '../common/utils/customer-scope';
import { AuditService } from '../common/services/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTicketDto,
  CreateTicketReplyDto,
  UpdateTicketStatusDto,
} from './dto/ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  async create(tenantId: string, user: JwtPayload, dto: CreateTicketDto) {
    const customerId = await resolveCustomerId(this.prisma, user);
    if (!customerId) {
      throw new ForbiddenException('Customer profile required');
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        tenantId,
        customerId,
        subject: dto.subject,
        category: dto.category,
        description: dto.description,
        attachments: dto.attachments ?? [],
      },
      include: {
        customer: {
          select: { firstName: true, lastName: true, phone: true },
        },
      },
    });

    await this.audit.log({
      tenantId,
      userId: user.sub,
      actorType: 'CUSTOMER',
      action: 'TICKET_CREATED',
      entity: 'Ticket',
      entityId: ticket.id,
    });

    return ticket;
  }

  async findAll(tenantId: string, customerId?: string) {
    return this.prisma.ticket.findMany({
      where: {
        tenantId,
        ...(customerId ? { customerId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        _count: { select: { replies: true } },
      },
    });
  }

  async findOne(tenantId: string, id: string, user: JwtPayload) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
          },
        },
      },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    if (user.role === UserRole.CUSTOMER) {
      const ownId = await resolveCustomerId(this.prisma, user);
      if (ownId !== ticket.customerId) {
        throw new ForbiddenException('Access denied');
      }
      ticket.replies = ticket.replies.filter((r) => !r.isInternal);
    }

    return ticket;
  }

  async updateStatus(
    tenantId: string,
    id: string,
    dto: UpdateTicketStatusDto,
    user: JwtPayload,
  ) {
    const ticket = await this.findOne(tenantId, id, user);

    const updated = await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: dto.status },
    });

    await this.audit.log({
      tenantId,
      userId: user.sub,
      action: 'TICKET_STATUS_UPDATED',
      entity: 'Ticket',
      entityId: id,
      metadata: { status: dto.status },
    });

    const customer = await this.prisma.customer.findUnique({
      where: { id: ticket.customerId },
      select: { userId: true },
    });
    if (customer?.userId) {
      await this.notifications.notifyTicketUpdate({
        userId: customer.userId,
        ticketSubject: ticket.subject,
        status: dto.status,
      });
    }

    return updated;
  }

  async addReply(
    tenantId: string,
    id: string,
    user: JwtPayload,
    dto: CreateTicketReplyDto,
  ) {
    const ticket = await this.findOne(tenantId, id, user);
    const authorType =
      user.role === UserRole.CUSTOMER
        ? MessageSenderType.CUSTOMER
        : MessageSenderType.STAFF;

    if (user.role === UserRole.CUSTOMER && dto.isInternal) {
      throw new ForbiddenException('Customers cannot add internal notes');
    }

    const reply = await this.prisma.ticketReply.create({
      data: {
        ticketId: ticket.id,
        authorId: user.sub,
        authorType,
        content: dto.content,
        isInternal: dto.isInternal ?? false,
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    if (ticket.status === TicketStatus.OPEN && authorType === MessageSenderType.STAFF) {
      await this.prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: TicketStatus.IN_PROGRESS },
      });
    }

    return reply;
  }
}
