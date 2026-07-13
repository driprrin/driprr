import {
  IsString, IsNotEmpty, IsNumber, IsArray,
  ValidateNested, IsInt, Min, IsOptional, IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethodEnum {
  RAZORPAY = 'RAZORPAY',
  COD      = 'COD',
}

export class OrderItemDto {
  @IsString() @IsNotEmpty() productId: string;
  @IsString() @IsNotEmpty() name:      string;
  @IsString() @IsNotEmpty() brand:     string;
  @IsString() @IsNotEmpty() size:      string;
  @IsNumber()  @Min(0)      price:     number;
  @IsInt()     @Min(1)      qty:       number;
  @IsString()  @IsOptional() imageUrl?: string;
}

export class CreateOrderDto {
  @IsString() @IsNotEmpty() userId:  string;
  @IsString() @IsNotEmpty() storeId: string;

  // Payment
  @IsEnum(PaymentMethodEnum)
  paymentMethod: PaymentMethodEnum;

  // Pricing
  @IsNumber() @Min(0) subtotal:    number;
  @IsNumber() @Min(0) deliveryFee: number;
  @IsNumber() @Min(0) discount:    number;
  @IsNumber() @Min(0) total:       number;

  // Delivery address
  @IsString() @IsNotEmpty() deliveryName:    string;
  @IsString() @IsNotEmpty() deliveryPhone:   string;
  @IsString() @IsNotEmpty() deliveryAddress: string;
  @IsString() @IsNotEmpty() deliveryPincode: string;
  @IsString() @IsOptional() deliveryLandmark?: string;

  // Slot
  @IsString() @IsOptional() deliverySlot?: string;
  @IsString() @IsOptional() couponCode?:  string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
