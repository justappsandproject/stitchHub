import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { FinancialsController } from './financials.controller';
import { FinancialsService } from './financials.service';

@Module({
  imports: [SubscriptionsModule],
  controllers: [FinancialsController],
  providers: [FinancialsService],
  exports: [FinancialsService],
})
export class FinancialsModule {}
