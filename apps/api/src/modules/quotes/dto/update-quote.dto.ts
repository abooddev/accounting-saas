import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsIn,
  Min,
  IsUUID,
} from 'class-validator';

export class UpdateQuoteItemDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPercent?: number;
}

export class UpdateQuoteDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  @IsIn(['USD', 'LBP'])
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number;

  @IsOptional()
  @IsString()
  terms?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateQuoteItemDto)
  items?: UpdateQuoteItemDto[];
}
