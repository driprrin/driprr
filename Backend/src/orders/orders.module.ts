import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ProductsModule } from '../products/products.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports:     [ProductsModule, GatewayModule],
  controllers: [OrdersController],
  providers:   [OrdersService],
})
export class OrdersModule {}
