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
import { CreateCreditNoteItemDto } from './create-credit-note.dto';

export class UpdateCreditNoteDto {
  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['customer', 'supplier'])
  contactType?: 'customer' | 'supplier';

  @IsOptional()
  @IsString()
  originalInvoiceId?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  reason?: string;

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
  taxRate?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCreditNoteItemDto)
  items?: CreateCreditNoteItemDto[];
}
