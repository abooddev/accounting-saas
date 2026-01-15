import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ScanInvoiceDto {
  @IsString()
  @IsNotEmpty()
  imagePath: string;
}

export class CreateInvoiceFromScanDto {
  @IsString()
  @IsNotEmpty()
  scanId: string;

  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsNumber()
  exchangeRate: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScanLineItemDto)
  items: ScanLineItemDto[];
}

export class ScanLineItemDto {
  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  unitPrice: number;
}
