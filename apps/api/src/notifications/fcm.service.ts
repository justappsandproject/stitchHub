import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import {
  getMessaging,
  type MulticastMessage,
} from 'firebase-admin/messaging';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private ready = false;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    if (getApps().length > 0) {
      this.ready = true;
      return;
    }

    const json = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    const path = this.config.get<string>('GOOGLE_APPLICATION_CREDENTIALS');

    try {
      if (json) {
        const serviceAccount = JSON.parse(json) as ServiceAccount;
        initializeApp({ credential: cert(serviceAccount) });
        this.ready = true;
        this.logger.log('FCM initialized from FIREBASE_SERVICE_ACCOUNT_JSON');
      } else if (path) {
        initializeApp();
        this.ready = true;
        this.logger.log('FCM initialized from GOOGLE_APPLICATION_CREDENTIALS');
      } else {
        this.logger.debug(
          'FCM not configured — set FIREBASE_SERVICE_ACCOUNT_JSON',
        );
      }
    } catch (err) {
      this.logger.warn(`FCM init failed: ${err}`);
    }
  }

  isConfigured(): boolean {
    return this.ready;
  }

  async sendToTokens(
    tokens: string[],
    payload: PushPayload,
  ): Promise<{ sent: number; failed: number }> {
    if (!this.ready || tokens.length === 0) {
      return { sent: 0, failed: tokens.length };
    }

    const message: MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    };

    try {
      const result = await getMessaging().sendEachForMulticast(message);
      if (result.failureCount > 0) {
        this.logger.debug(
          `FCM: ${result.successCount} sent, ${result.failureCount} failed`,
        );
      }
      return { sent: result.successCount, failed: result.failureCount };
    } catch (err) {
      this.logger.warn(`FCM send error: ${err}`);
      return { sent: 0, failed: tokens.length };
    }
  }
}
