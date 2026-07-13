import {
  Controller, Get, Post, Body, Patch,
  Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // POST /api/orders — place a new order (auth required)
  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    // Ensure userId comes from the authenticated user, not the body
    return this.ordersService.create({ ...dto, userId: user.id });
  }

  // GET /api/orders?storeId=xxx — get all orders for a store (store owner)
  // GET /api/orders — get authenticated user's orders
  @Get()
  @UseGuards(AuthGuard)
  findAll(@CurrentUser() user: any, @Query('storeId') storeId?: string) {
    if (storeId && (user.role === 'STORE_OWNER' || user.role === 'ADMIN')) {
      return this.ordersService.findByStore(storeId);
    }
    return this.ordersService.findByUser(user.id);
  }

  // PATCH /api/orders/:id/status — update order status (store owner / admin)
  @Patch(':id/status')
  @UseGuards(AuthGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}
