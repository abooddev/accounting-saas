import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  MaxLength,
} from 'class-validator';

export class CreatePriceListDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameAr?: string;

  @IsOptional()
  @IsEnum(['USD', 'LBP'])
  currency?: 'USD' | 'LBP';

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
