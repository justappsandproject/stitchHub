import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionPlan } from '@prisma/client';
import { PLAN_CONFIG } from '@stitchhub/shared';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    status: string;
    reference: string;
    amount: number;
  };
}

@Injectable()
export class PaystackService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  isEnabled() {
    return Boolean(this.config.get<string>('PAYSTACK_SECRET_KEY'));
  }

  getConfig() {
    return {
      enabled: this.isEnabled(),
      publicKey: this.config.get<string>('PAYSTACK_PUBLIC_KEY') ?? null,
    };
  }

  private secretKey() {
    const key = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!key) {
      throw new ServiceUnavailableException(
        'Paystack is not configured. Add PAYSTACK_SECRET_KEY to enable payments.',
      );
    }
    return key;
  }

  async initialize(tenantId: string, plan: SubscriptionPlan, email: string) {
    const config = PLAN_CONFIG[plan];
    const reference = `sh_${randomBytes(12).toString('hex')}`;
    const amountKobo = config.priceNgn * 100;

    await this.prisma.subscriptionPayment.create({
      data: {
        tenantId,
        plan,
        amount: config.priceNgn,
        reference,
        status: 'PENDING',
      },
    });

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        reference,
        currency: 'NGN',
        metadata: { tenantId, plan },
        callback_url: this.config.get<string>('PAYSTACK_CALLBACK_URL'),
      }),
    });

    const json = (await res.json()) as PaystackInitResponse;
    if (!json.status) {
      throw new BadRequestException(json.message || 'Paystack initialization failed');
    }

    await this.prisma.subscriptionPayment.update({
      where: { reference },
      data: { paystackRef: json.data.reference },
    });

    return {
      authorizationUrl: json.data.authorization_url,
      reference: json.data.reference,
      amount: config.priceNgn,
      plan,
    };
  }

  async verify(reference: string) {
    const payment = await this.prisma.subscriptionPayment.findUnique({
      where: { reference },
    });
    if (!payment) {
      throw new BadRequestException('Payment reference not found');
    }
    if (payment.status === 'SUCCESS') {
      return { status: 'SUCCESS', plan: payment.plan, tenantId: payment.tenantId };
    }

    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${this.secretKey()}` },
      },
    );

    const json = (await res.json()) as PaystackVerifyResponse;
    if (!json.status || json.data.status !== 'success') {
      await this.prisma.subscriptionPayment.update({
        where: { reference },
        data: { status: 'FAILED' },
      });
      throw new BadRequestException('Payment verification failed');
    }

    await this.prisma.subscriptionPayment.update({
      where: { reference },
      data: { status: 'SUCCESS', paidAt: new Date() },
    });

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await this.prisma.subscription.update({
      where: { tenantId: payment.tenantId },
      data: {
        plan: payment.plan,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    await this.prisma.tenant.update({
      where: { id: payment.tenantId },
      data: { isActive: true },
    });

    return {
      status: 'SUCCESS',
      plan: payment.plan,
      tenantId: payment.tenantId,
    };
  }
}
