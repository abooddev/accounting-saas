import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class ApplyCreditNoteDto {
  @IsString()
  invoiceId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
