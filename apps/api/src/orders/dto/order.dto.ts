import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderPriority, OrderStatus } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  styleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fabric?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiPropertyOptional({ enum: OrderPriority })
  @IsOptional()
  @IsEnum(OrderPriority)
  priority?: OrderPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @ApiPropertyOptional({ description: 'Promo code to apply to subtotal' })
  @IsOptional()
  @IsString()
  discountCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  subtotalAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ enum: ['PERCENTAGE', 'FIXED_AMOUNT'] })
  @IsOptional()
  @IsString()
  discountType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  measurementId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  styleReferenceUrls?: string[];
}

export class ConfirmOrderDto extends CreateOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  declare customerId: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedToId?: string;
}

export class OrderQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;
}
