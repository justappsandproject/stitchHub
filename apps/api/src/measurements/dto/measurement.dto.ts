import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MeasurementCategory } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMeasurementTemplateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: MeasurementCategory })
  @IsEnum(MeasurementCategory)
  category: MeasurementCategory;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  @IsArray()
  fields: Record<string, unknown>[];
}

export class CreateMeasurementDto {
  @ApiProperty()
  @IsString()
  customerId: string;

  @ApiProperty()
  @IsString()
  templateId: string;

  @ApiProperty({ type: Object, additionalProperties: true })
  @IsObject()
  values: Record<string, number | string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: ['cm', 'inches'] })
  @IsOptional()
  @IsIn(['cm', 'inches'])
  unit?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}

export class CreateBodyMeasurementDto {
  @ApiProperty()
  @IsString()
  customerId: string;

  @ApiProperty({ type: Object, additionalProperties: true })
  @IsObject()
  values: Record<string, number | string>;

  @ApiPropertyOptional({ enum: ['cm', 'inches'] })
  @IsOptional()
  @IsIn(['cm', 'inches'])
  unit?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class MeasurementQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  to?: string;
}

export class UpdateMeasurementDto {
  @ApiProperty({ type: Object, additionalProperties: true })
  @IsObject()
  values: Record<string, number | string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
