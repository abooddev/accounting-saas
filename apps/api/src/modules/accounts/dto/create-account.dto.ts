import { IsString, IsOptional, IsBoolean, IsNumber, IsIn, Min } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  nameAr?: string;

  @IsString()
  @IsIn(['cash', 'bank'])
  type: string;

  @IsString()
  @IsIn(['USD', 'LBP'])
  currency: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  openingBalance?: number;
}
