import { Module } from '@nestjs/common';
import { AiTryOnService } from './ai-try-on.service';
import { StylesController } from './styles.controller';
import { StylesLookbookController } from './styles-lookbook.controller';
import { StylesService } from './styles.service';

@Module({
  controllers: [StylesLookbookController, StylesController],
  providers: [StylesService, AiTryOnService],
  exports: [StylesService],
})
export class StylesModule {}
