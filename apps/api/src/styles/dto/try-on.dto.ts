import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class TryOnDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerPhotoUrl?: string;

  @ApiPropertyOptional({ enum: ['light', 'medium', 'medium-dark', 'dark'] })
  @IsOptional()
  @IsIn(['light', 'medium', 'medium-dark', 'dark'])
  skinTone?: string;

  @ApiPropertyOptional({ enum: ['slim', 'athletic', 'average', 'plus'] })
  @IsOptional()
  @IsIn(['slim', 'athletic', 'average', 'plus'])
  bodyType?: string;

  @ApiPropertyOptional({ enum: ['female', 'male', 'unisex'] })
  @IsOptional()
  @IsIn(['female', 'male', 'unisex'])
  gender?: string;
}

export class LookbookQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fashionHouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;
}
