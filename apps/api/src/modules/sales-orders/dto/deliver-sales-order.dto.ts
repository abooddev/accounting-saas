import { Type } from 'class-transformer';
import {
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  ArrayMinSize,
  IsUUID,
} from 'class-validator';

export class DeliveryItemDto {
  @IsUUID()
  itemId: string;

  @IsNumber()
  @Min(0.001)
  quantityDelivered: number;
}

export class DeliverSalesOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => DeliveryItemDto)
  items: DeliveryItemDto[];
}
