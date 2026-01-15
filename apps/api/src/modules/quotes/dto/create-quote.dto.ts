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

export class CreateQuoteItemDto {
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

export class CreateQuoteDto {
  @IsUUID()
  customerId: string;

  @IsString()
  date: string;

  @IsString()
  validUntil: string;

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
  @IsString()
  terms?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateQuoteItemDto)
  items: CreateQuoteItemDto[];
}
