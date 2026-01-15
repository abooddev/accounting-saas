import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  ArrayMinSize,
} from 'class-validator';

export class ReceiveGoodsItemDto {
  @IsString()
  itemId: string;

  @IsNumber()
  @Min(0.001)
  quantityReceived: number;
}

export class ReceiveGoodsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => ReceiveGoodsItemDto)
  items: ReceiveGoodsItemDto[];
}
