import {
  IsString, IsNotEmpty, IsNumber, IsArray, IsBoolean,
  IsOptional, Min, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InventoryItemDto {
  @IsString() @IsNotEmpty() size:  string;
  @IsNumber() @Min(0)       stock: number;
}

export class CreateProductDto {
  @IsString() @IsNotEmpty() storeId:       string;
  @IsString() @IsNotEmpty() name:          string;
  @IsString() @IsNotEmpty() brand:         string;
  @IsString() @IsNotEmpty() category:      string;
  @IsNumber() @Min(0)       price:         number;
  @IsNumber() @Min(0)       originalPrice: number;

  @IsString() @IsOptional()  description?:  string;
  @IsArray()  @IsOptional()  tags?:         string[];
  @IsArray()  @IsOptional()  imageUrls?:    string[];
  @IsString() @IsOptional()  badge?:        string;
  @IsBoolean() @IsOptional() published?:    boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryItemDto)
  @IsOptional()
  inventory?: InventoryItemDto[];
}
