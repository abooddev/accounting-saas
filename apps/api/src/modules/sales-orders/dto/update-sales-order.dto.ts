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
import { CreateSalesOrderItemDto } from './create-sales-order.dto';

export class UpdateSalesOrderDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

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
  @IsUUID()
  priceListId?: string;

  @IsOptional()
  @IsUUID()
  salesRepId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateSalesOrderItemDto)
  items?: CreateSalesOrderItemDto[];
}
