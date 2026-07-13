import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { StoresModule } from './stores/stores.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { ApplicationsModule } from './applications/applications.module';
import { GatewayModule } from './gateway/gateway.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    // Rate limiting: 60 requests per 60 seconds per IP (applied per-route via @UseGuards(ThrottlerGuard))
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    PrismaModule, StoresModule, ProductsModule, OrdersModule, AuthModule, ApplicationsModule, GatewayModule, PaymentsModule,
  ],
})
export class AppModule {}
