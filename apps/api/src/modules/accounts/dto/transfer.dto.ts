import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class TransferDto {
  @IsString()
  fromAccountId: string;

  @IsString()
  toAccountId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
