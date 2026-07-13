import {
  Controller, Get, Post, Body, Patch,
  Param, Delete, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  // Public — list all open stores (optionally filter by city / category / owner)
  @Get()
  findAll(
    @Query('city')     city?: string,
    @Query('category') category?: string,
    @Query('ownerId')  ownerId?: string,
  ) {
    return this.storesService.findAll(city, category, ownerId);
  }

  // Public — get store by slug or id
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.storesService.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  // Public — get products for a store (by slug or id)
  @Get(':slugOrId/products')
  findProducts(
    @Param('slugOrId') slugOrId: string,
    @Query('category') category?: string,
  ) {
    return this.storesService.findProducts(slugOrId, category);
  }

  // Protected — create store (store owner only)
  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateStoreDto) {
    return this.storesService.create(dto);
  }

  // Protected — update store
  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateStoreDto) {
    return this.storesService.update(id, dto);
  }

  // Protected — delete store
  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.storesService.remove(id);
  }
}
