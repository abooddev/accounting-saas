import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreateExchangeRateDto {
  @IsNumber()
  @Min(0)
  rate: number;

  @IsString()
  effectiveDate: string;

  @IsOptional()
  @IsString()
  fromCurrency?: string;

  @IsOptional()
  @IsString()
  toCurrency?: string;

  @IsOptional()
  @IsString()
  source?: string;
}
