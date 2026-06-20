import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { ConversationsModule } from './conversations/conversations.module';
import { CustomersModule } from './customers/customers.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DiscountsModule } from './discounts/discounts.module';
import { FinancialsModule } from './financials/financials.module';
import { MeasurementsModule } from './measurements/measurements.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { StaffModule } from './staff/staff.module';
import { StylesModule } from './styles/styles.module';
import { PrismaModule } from './prisma/prisma.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TenantsModule } from './tenants/tenants.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { InventoryModule } from './inventory/inventory.module';
import { TicketsModule } from './tickets/tickets.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    AuthModule,
    TenantsModule,
    CustomersModule,
    MeasurementsModule,
    OrdersModule,
    PaymentsModule,
    DashboardModule,
    SubscriptionsModule,
    MessagesModule,
    ConversationsModule,
    TicketsModule,
    FinancialsModule,
    StaffModule,
    NotificationsModule,
    UploadsModule,
    PortfolioModule,
    DiscountsModule,
    StylesModule,
    InventoryModule,
  ],
})
export class AppModule {}
