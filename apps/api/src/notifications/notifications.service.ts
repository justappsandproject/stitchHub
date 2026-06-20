import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { FcmService } from './fcm.service';
import { SmsService } from './sms.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private sms: SmsService,
    private fcm: FcmService,
  ) {}

  async registerDeviceToken(
    userId: string,
    token: string,
    platform: string,
  ) {
    await this.prisma.deviceToken.upsert({
      where: { userId_token: { userId, token } },
      update: { platform, updatedAt: new Date() },
      create: { userId, token, platform },
    });

    return { message: 'Device token registered' };
  }

  async getTokensForUser(userId: string) {
    return this.prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true, platform: true },
    });
  }

  async pushToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    const tokens = await this.getTokensForUser(userId);
    return this.fcm.sendToTokens(
      tokens.map((t) => t.token),
      { title, body, data },
    );
  }

  async notifyCustomerOnboard(params: {
    email?: string | null;
    phone: string;
    fashionHouseName: string;
    username: string;
    tempPassword: string;
    welcomeMessage: string;
    userId?: string;
  }) {
    const tasks: Promise<unknown>[] = [];

    if (params.email) {
      tasks.push(
        this.email.send({
          to: params.email,
          subject: `${params.fashionHouseName} invited you to StitchHub`,
          html: `<p>${params.welcomeMessage.replace(/\n/g, '<br>')}</p>`,
          text: params.welcomeMessage,
        }),
      );
    }

    tasks.push(this.sms.send(params.phone, params.welcomeMessage));

    if (params.userId) {
      tasks.push(
        this.pushToUser(
          params.userId,
          `${params.fashionHouseName} added you`,
          'Download StitchHub and log in with your new credentials.',
          { type: 'ONBOARD' },
        ),
      );
    }

    await Promise.allSettled(tasks);
  }

  async notifyOrderConfirmed(params: {
    userId?: string | null;
    email?: string | null;
    phone?: string | null;
    orderNumber: string;
    fashionHouseName: string;
    invoiceText?: string;
    pdfUrl?: string;
  }) {
    const message = `Your order ${params.orderNumber} has been confirmed. Your invoice is ready.${
      params.pdfUrl ? ` View: ${params.pdfUrl}` : ''
    }`;

    const tasks: Promise<unknown>[] = [];

    if (params.userId) {
      tasks.push(
        this.pushToUser(
          params.userId,
          `Order ${params.orderNumber} confirmed`,
          'Your invoice is ready.',
          {
            type: 'ORDER_CONFIRMED',
            orderNumber: params.orderNumber,
            ...(params.pdfUrl ? { pdfUrl: params.pdfUrl } : {}),
          },
        ),
      );
    }

    if (params.email) {
      tasks.push(
        this.email.send({
          to: params.email,
          subject: `Order ${params.orderNumber} confirmed — ${params.fashionHouseName}`,
          html: `<p>${message}</p>`,
          text: message,
          attachments: params.invoiceText
            ? [
                {
                  filename: `invoice-${params.orderNumber}.txt`,
                  content: params.invoiceText,
                  contentType: 'text/plain',
                },
              ]
            : undefined,
        }),
      );
    }

    if (params.phone) {
      tasks.push(this.sms.send(params.phone, message));
    }

    await Promise.allSettled(tasks);
  }

  async notifyNewMessage(params: {
    userId: string;
    title: string;
    body: string;
    customerId?: string;
  }) {
    await this.pushToUser(params.userId, params.title, params.body, {
      type: 'MESSAGE',
      ...(params.customerId ? { customerId: params.customerId } : {}),
    });
  }

  async notifyTicketUpdate(params: {
    userId: string;
    ticketSubject: string;
    status: string;
    body?: string;
  }) {
    await this.pushToUser(
      params.userId,
      `Ticket: ${params.ticketSubject}`,
      params.body ?? `Status updated to ${params.status}`,
      { type: 'TICKET', status: params.status },
    );
  }
}
