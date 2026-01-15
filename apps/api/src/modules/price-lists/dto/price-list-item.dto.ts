import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddPriceListItemDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  minQuantity?: number;
}

export class AddPriceListItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddPriceListItemDto)
  items: AddPriceListItemDto[];
}

export class UpdatePriceListItemDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  minQuantity?: number;
}
