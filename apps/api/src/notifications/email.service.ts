import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('RESEND_API_KEY'));
  }

  async send(params: SendEmailParams): Promise<{ sent: boolean; id?: string }> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from =
      this.config.get<string>('RESEND_FROM_EMAIL') ??
      'StitchHub <onboarding@resend.dev>';

    if (!apiKey) {
      this.logger.debug(`Email skipped (no RESEND_API_KEY): ${params.subject} → ${params.to}`);
      return { sent: false };
    }

    try {
      const body: Record<string, unknown> = {
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      };

      if (params.attachments?.length) {
        body.attachments = params.attachments.map((a) => ({
          filename: a.filename,
          content:
            typeof a.content === 'string'
              ? Buffer.from(a.content).toString('base64')
              : a.content.toString('base64'),
          content_type: a.contentType ?? 'application/octet-stream',
        }));
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        this.logger.warn(`Resend failed (${res.status}): ${err}`);
        return { sent: false };
      }

      const data = (await res.json()) as { id?: string };
      return { sent: true, id: data.id };
    } catch (err) {
      this.logger.warn(`Resend error: ${err}`);
      return { sent: false };
    }
  }
}
