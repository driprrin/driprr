import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Public — list products with optional filters
  @Get()
  findAll(
    @Query('category')  category?:  string,
    @Query('storeId')   storeId?:   string,
    @Query('brand')     brand?:     string,
    @Query('search')    search?:    string,
    @Query('published') published?: string,
  ) {
    // Store owners can fetch unpublished (published=false) — default shows published only
    const pub = published === 'false' ? false : published === 'all' ? undefined : true;
    return this.productsService.findAll({ category, storeId, brand, search, published: pub });
  }

  // Public — single product
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // Protected — create product (store owner)
  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductDto, @CurrentUser() user: any) {
    // Ensure storeId belongs to requesting user (or admin)
    return this.productsService.create({ ...dto });
  }

  // Protected — update product
  @Patch(':id')
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: any,
  ) {
    return this.productsService.update(id, dto, user.id);
  }

  // Protected — toggle publish/draft
  @Patch(':id/publish')
  @UseGuards(AuthGuard)
  togglePublish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productsService.togglePublish(id, user.id);
  }

  // Protected — delete product
  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productsService.remove(id, user.id);
  }
}

