import { IsString, IsOptional, IsNumber, IsIn, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsIn(['supplier_payment', 'expense_payment', 'customer_receipt'])
  type: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsString()
  accountId: string;

  @IsString()
  date: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsIn(['USD', 'LBP'])
  currency: string;

  @IsNumber()
  @Min(0)
  exchangeRate: number;

  @IsString()
  @IsIn(['cash', 'bank_transfer', 'check', 'whish', 'omt'])
  paymentMethod: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
