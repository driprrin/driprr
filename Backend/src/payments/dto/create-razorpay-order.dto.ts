import { IsNumber, Min, IsString, IsNotEmpty } from 'class-validator';

export class CreateRazorpayOrderDto {
  @IsNumber()
  @Min(1)
  amount: number; // in rupees

  @IsString()
  @IsNotEmpty()
  receipt: string; // your internal order ID or a reference
}
