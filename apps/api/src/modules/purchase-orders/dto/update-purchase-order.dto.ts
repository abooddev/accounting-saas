import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsIn,
  Min,
} from 'class-validator';

export class UpdatePurchaseOrderItemDto {
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

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['USD', 'LBP'])
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePurchaseOrderItemDto)
  items?: UpdatePurchaseOrderItemDto[];
}
