import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvoiceStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { AuditService } from '../common/services/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicePdfService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  private uploadsDir() {
    const dir = path.join(process.cwd(), 'uploads', 'invoices');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  private buildPdfContent(data: {
    tenantName: string;
    logoUrl?: string | null;
    invoiceNumber: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    fabric?: string | null;
    styleName?: string | null;
    subtotal: number;
    discount: number;
    total: number;
    deposit: number;
    balance: number;
    deliveryDate?: Date | null;
  }): string {
    const lines = [
      data.tenantName,
      'INVOICE',
      `Invoice #: ${data.invoiceNumber}`,
      `Order #: ${data.orderNumber}`,
      '',
      `Customer: ${data.customerName}`,
      `Phone: ${data.customerPhone}`,
      data.styleName ? `Style: ${data.styleName}` : '',
      data.fabric ? `Fabric: ${data.fabric}` : '',
      '',
      `Subtotal: NGN ${data.subtotal.toLocaleString()}`,
      `Discount: NGN ${data.discount.toLocaleString()}`,
      `Total: NGN ${data.total.toLocaleString()}`,
      `Deposit Paid: NGN ${data.deposit.toLocaleString()}`,
      `Balance Due: NGN ${data.balance.toLocaleString()}`,
      data.deliveryDate
        ? `Delivery Date: ${data.deliveryDate.toLocaleDateString()}`
        : '',
      '',
      'Powered by StitchHub',
    ].filter(Boolean);

    return lines.join('\n');
  }

  async generateForOrder(tenantId: string, orderId: string, actorId?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: {
        customer: true,
        style: true,
        tenant: true,
        invoices: { where: { status: { not: InvoiceStatus.CANCELLED } } },
      },
    });

    if (!order) return null;

    let invoice = order.invoices[0];
    if (!invoice) {
      const count = await this.prisma.invoice.count({ where: { tenantId } });
      const year = new Date().getFullYear();
      const invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;
      invoice = await this.prisma.invoice.create({
        data: {
          tenantId,
          orderId: order.id,
          invoiceNumber,
          amount: order.balanceAmount,
          dueDate: order.deliveryDate,
          status: InvoiceStatus.SENT,
        },
      });
    }

    const content = this.buildPdfContent({
      tenantName: order.tenant.name,
      logoUrl: order.tenant.logoUrl,
      invoiceNumber: invoice.invoiceNumber,
      orderNumber: order.orderNumber,
      customerName: `${order.customer.firstName} ${order.customer.lastName}`,
      customerPhone: order.customer.phone,
      fabric: order.fabric,
      styleName: order.style?.name,
      subtotal: Number(order.subtotalAmount),
      discount: Number(order.discountAmount),
      total: Number(order.totalAmount),
      deposit: Number(order.depositAmount),
      balance: Number(order.balanceAmount),
      deliveryDate: order.deliveryDate,
    });

    const filename = `${invoice.invoiceNumber}.txt`;
    const filepath = path.join(this.uploadsDir(), filename);
    fs.writeFileSync(filepath, content, 'utf8');

    const baseUrl =
      this.config.get<string>('API_PUBLIC_URL') ??
      `http://localhost:${this.config.get('PORT') ?? 3001}`;

    const pdfUrl = `${baseUrl}/uploads/invoices/${filename}`;

    const updated = await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl, sentAt: new Date(), status: InvoiceStatus.SENT },
    });

    await this.audit.log({
      tenantId,
      userId: actorId,
      action: 'INVOICE_GENERATED',
      entity: 'Invoice',
      entityId: invoice.id,
      metadata: { orderId, pdfUrl },
    });

    if (order.customer.userId) {
      await this.notifications.notifyOrderConfirmed({
        userId: order.customer.userId,
        email: order.customer.email,
        phone: order.customer.phone,
        orderNumber: order.orderNumber,
        fashionHouseName: order.tenant.name,
        invoiceText: content,
        pdfUrl,
      });
    }

    return { invoice: updated, pdfUrl, content };
  }

  async resend(tenantId: string, orderId: string, actorId?: string) {
    return this.generateForOrder(tenantId, orderId, actorId);
  }
}
