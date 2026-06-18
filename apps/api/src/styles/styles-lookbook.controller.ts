import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LookbookQueryDto } from './dto/try-on.dto';
import { StylesService } from './styles.service';

@ApiTags('Styles')
@Controller('styles')
export class StylesLookbookController {
  constructor(private stylesService: StylesService) {}

  /** Public lookbook — active styles for a fashion house (no auth). */
  @Get('lookbook')
  findLookbook(@Query() query: LookbookQueryDto) {
    return this.stylesService.findLookbook(query);
  }
}
