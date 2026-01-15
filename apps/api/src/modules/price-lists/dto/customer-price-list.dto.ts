import {
  IsUUID,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class AssignCustomerPriceListDto {
  @IsUUID()
  customerId: string;

  @IsUUID()
  priceListId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;
}

export class UpdateCustomerPriceListPriorityDto {
  @IsNumber()
  @Min(0)
  priority: number;
}
