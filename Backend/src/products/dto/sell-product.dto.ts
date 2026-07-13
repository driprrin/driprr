import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class SellProductDto {
  @IsString()
  @IsNotEmpty({ message: 'size is required' })
  size: string;

  @IsInt({ message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be at least 1' })
  quantity: number;
}
