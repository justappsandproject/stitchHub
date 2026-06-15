import { Module } from '@nestjs/common';
import { DiscountsModule } from '../discounts/discounts.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [SubscriptionsModule, DiscountsModule, PortfolioModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
