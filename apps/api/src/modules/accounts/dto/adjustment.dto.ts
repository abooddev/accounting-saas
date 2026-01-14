import { IsString, IsNumber, IsIn, Min } from 'class-validator';

export class AdjustmentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsIn(['in', 'out'])
  type: 'in' | 'out';

  @IsString()
  description: string;

  @IsString()
  date: string;
}
