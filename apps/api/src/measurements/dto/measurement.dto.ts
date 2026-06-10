import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MeasurementCategory } from '@prisma/client';
import {
  IsArray,
  IsEnum,
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
