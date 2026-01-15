import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsIn,
  Min,
  ArrayMinSize,
} from 'class-validator';

export class CreatePurchaseOrderItemDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0.001)
  quantityOrdered: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreatePurchaseOrderDto {
  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['draft', 'sent'])
  status?: string;

  @IsString()
  @IsIn(['USD', 'LBP'])
  currency: string;

  @IsNumber()
  @Min(0)
  exchangeRate: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}
