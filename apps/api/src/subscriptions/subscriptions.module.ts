import { Module } from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, PaystackService],
  exports: [SubscriptionsService, PaystackService],
})
export class SubscriptionsModule {}
