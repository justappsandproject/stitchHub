import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AiTryOnService } from './ai-try-on.service';
import { StylesController } from './styles.controller';
import { StylesLookbookController } from './styles-lookbook.controller';
import { StylesService } from './styles.service';

@Module({
  imports: [SubscriptionsModule],
  controllers: [StylesLookbookController, StylesController],
  providers: [StylesService, AiTryOnService],
  exports: [StylesService],
})
export class StylesModule {}
