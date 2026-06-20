import { Module } from '@nestjs/common';
import { DiscountsModule } from '../discounts/discounts.module';
import { PaymentsModule } from '../payments/payments.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [SubscriptionsModule, DiscountsModule, PortfolioModule, PaymentsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
