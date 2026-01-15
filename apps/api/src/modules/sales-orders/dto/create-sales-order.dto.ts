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
  IsUUID,
} from 'class-validator';

export class CreateSalesOrderItemDto {
  @IsUUID()
  productId: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0.001)
  quantityOrdered: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPercent?: number;
}

export class CreateSalesOrderDto {
  @IsUUID()
  customerId: string;

  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['draft', 'confirmed'])
  status?: string;

  @IsString()
  @IsIn(['USD', 'LBP'])
  currency: string;

  @IsNumber()
  @Min(0)
  exchangeRate: number;

  @IsOptional()
  @IsUUID()
  priceListId?: string;

  @IsOptional()
  @IsUUID()
  salesRepId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateSalesOrderItemDto)
  items: CreateSalesOrderItemDto[];
}
