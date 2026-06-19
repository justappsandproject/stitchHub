import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  InvoiceStatus,
  PaymentStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { resolveCustomerId } from '../common/utils/customer-scope';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto, CreatePaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.invoice.count({ where: { tenantId } });
    const year = new Date().getFullYear();
    return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  private async generateReceiptNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.receipt.count({ where: { tenantId } });
    const year = new Date().getFullYear();
    return `RCP-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  async createInvoice(tenantId: string, dto: CreateInvoiceDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, tenantId },
    });
    if (!order) throw new NotFoundException('Order not found');

    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    return this.prisma.invoice.create({
      data: {
        tenantId,
        orderId: dto.orderId,
        invoiceNumber,
        amount: dto.amount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: dto.notes,
        status: InvoiceStatus.SENT,
      },
      include: { order: { include: { customer: true } } },
    });
  }

  async findInvoices(tenantId: string, orderId?: string, user?: JwtPayload) {
    const where: Prisma.InvoiceWhereInput = { tenantId };
    if (orderId) where.orderId = orderId;

    if (user?.role === UserRole.CUSTOMER) {
      const customerId = await resolveCustomerId(this.prisma, user);
      if (!customerId) {
        throw new ForbiddenException('No customer profile linked to this account');
      }
      where.order = { customerId };
    }

    return this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            orderNumber: true,
            customer: { select: { firstName: true, lastName: true } },
          },
        },
        payments: true,
      },
    });
  }

  async createPayment(tenantId: string, dto: CreatePaymentDto) {
    let invoice = null;

    if (dto.invoiceId) {
      invoice = await this.prisma.invoice.findFirst({
        where: { id: dto.invoiceId, tenantId },
      });
      if (!invoice) throw new NotFoundException('Invoice not found');
    }

    const payment = await this.prisma.payment.create({
      data: {
        tenantId,
        invoiceId: dto.invoiceId,
        amount: dto.amount,
        method: dto.method,
        status: PaymentStatus.PAID,
        reference: dto.reference,
        notes: dto.notes,
        paidAt: new Date(),
      },
    });

    const receiptNumber = await this.generateReceiptNumber(tenantId);
    const receipt = await this.prisma.receipt.create({
      data: {
        tenantId,
        paymentId: payment.id,
        receiptNumber,
      },
    });

    if (invoice) {
      const newPaidAmount = Number(invoice.paidAmount) + dto.amount;
      const invoiceAmount = Number(invoice.amount);

      let status: InvoiceStatus = InvoiceStatus.PARTIALLY_PAID;
      if (newPaidAmount >= invoiceAmount) {
        status = InvoiceStatus.PAID;
      }

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { paidAmount: newPaidAmount, status },
      });

      const order = await this.prisma.order.findUnique({
        where: { id: invoice.orderId },
      });

      if (order) {
        const newDeposit = Number(order.depositAmount) + dto.amount;
        const newBalance = Number(order.totalAmount) - newDeposit;
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            depositAmount: newDeposit,
            balanceAmount: Math.max(0, newBalance),
          },
        });
      }
    }

    return { payment, receipt };
  }

  async findPayments(tenantId: string, user?: JwtPayload) {
    const where: Prisma.PaymentWhereInput = { tenantId };

    if (user?.role === UserRole.CUSTOMER) {
      const customerId = await resolveCustomerId(this.prisma, user);
      if (!customerId) {
        throw new ForbiddenException('No customer profile linked to this account');
      }
      where.invoice = { order: { customerId } };
    }

    return this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            order: {
              select: {
                orderNumber: true,
                customer: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        receipt: true,
      },
    });
  }

  async findReceipts(tenantId: string, user?: JwtPayload) {
    const where: Prisma.ReceiptWhereInput = { tenantId };

    if (user?.role === UserRole.CUSTOMER) {
      const customerId = await resolveCustomerId(this.prisma, user);
      if (!customerId) {
        throw new ForbiddenException('No customer profile linked to this account');
      }
      where.payment = { invoice: { order: { customerId } } };
    }

    return this.prisma.receipt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        payment: {
          include: {
            invoice: {
              select: {
                invoiceNumber: true,
                order: {
                  select: {
                    orderNumber: true,
                    customer: { select: { firstName: true, lastName: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
