import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { InvoicePdfService } from './invoice-pdf.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, InvoicePdfService],
  exports: [PaymentsService, InvoicePdfService],
})
export class PaymentsModule {}
