import { Global, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email.service';
import { FcmService } from './fcm.service';
import { NotificationsService } from './notifications.service';
import { SmsService } from './sms.service';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [
    EmailService,
    SmsService,
    FcmService,
    NotificationsService,
  ],
  exports: [NotificationsService, EmailService, SmsService, FcmService],
})
export class NotificationsModule {}
