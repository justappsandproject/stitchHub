import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('TERMII_API_KEY'));
  }

  async send(to: string, message: string): Promise<{ sent: boolean }> {
    const apiKey = this.config.get<string>('TERMII_API_KEY');
    const senderId =
      this.config.get<string>('TERMII_SENDER_ID') ?? 'StitchHub';

    if (!apiKey) {
      this.logger.debug(`SMS skipped (no TERMII_API_KEY): ${to}`);
      return { sent: false };
    }

    const phone = to.replace(/\s/g, '');
    const formatted = phone.startsWith('+')
      ? phone
      : phone.startsWith('0')
        ? `+234${phone.slice(1)}`
        : `+234${phone}`;

    try {
      const res = await fetch('https://api.ng.termii.com/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          to: formatted,
          from: senderId,
          sms: message,
          type: 'plain',
          channel: 'generic',
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        this.logger.warn(`Termii failed (${res.status}): ${err}`);
        return { sent: false };
      }

      return { sent: true };
    } catch (err) {
      this.logger.warn(`Termii error: ${err}`);
      return { sent: false };
    }
  }
}
