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

export class CreateCreditNoteItemDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateCreditNoteDto {
  @IsString()
  @IsIn(['credit', 'debit'])
  type: 'credit' | 'debit';

  @IsString()
  contactId: string;

  @IsString()
  @IsIn(['customer', 'supplier'])
  contactType: 'customer' | 'supplier';

  @IsOptional()
  @IsString()
  originalInvoiceId?: string;

  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsString()
  @IsIn(['USD', 'LBP'])
  currency: string;

  @IsNumber()
  @Min(0)
  exchangeRate: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateCreditNoteItemDto)
  items: CreateCreditNoteItemDto[];
}
