import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly gateway: EventsGateway,
  ) {}

  async create(dto: CreateOrderDto) {
    const order = await this.prisma.order.create({
      data: {
        userId:          dto.userId,
        storeId:         dto.storeId,
        paymentMethod:   dto.paymentMethod,
        status:          'PLACED',
        subtotal:        dto.subtotal,
        deliveryFee:     dto.deliveryFee,
        discount:        dto.discount,
        total:           dto.total,
        deliveryName:    dto.deliveryName,
        deliveryPhone:   dto.deliveryPhone,
        deliveryAddress: dto.deliveryAddress,
        deliveryLandmark: dto.deliveryLandmark,
        deliveryPincode: dto.deliveryPincode,
        deliverySlot:    dto.deliverySlot,
        couponCode:      dto.couponCode,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            name:      item.name,
            brand:     item.brand,
            size:      item.size,
            price:     item.price,
            qty:       item.qty,
            imageUrl:  item.imageUrl,
          })),
        },
      },
      include: { items: true, store: { select: { name: true, ownerId: true } } },
    });

    // Deduct inventory AFTER order is created successfully
    for (const item of dto.items) {
      try {
        await this.productsService.sell(item.productId, item.size, item.qty);
      } catch { /* non-blocking — order is already placed */ }
    }

    // 🔔 Notify store owner of new order via WebSocket
    try {
      if (order.store?.ownerId) {
        this.gateway.emitNewOrderToStore(order.store.ownerId, {
          id:           order.id,
          customerId:   order.userId,
          customerName: order.deliveryName,
          status:       order.status,
          total:        order.total,
          itemCount:    order.items.length,
          placedAt:     order.createdAt,
        });
      }
    } catch { /* non-blocking */ }

    return order;
  }

  findByUser(userId: string) {
    return this.prisma.order.findMany({
      where:   { userId },
      include: { items: true, store: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByStore(storeId: string) {
    return this.prisma.order.findMany({
      where:   { storeId },
      include: { items: true, user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Order "${id}" not found`);
    const updated = await this.prisma.order.update({
      where:   { id },
      data:    { status: dto.status },
      include: { items: true },
    });

    // 🔔 Notify customer of status change via WebSocket
    try {
      this.gateway.emitOrderStatus(order.userId, {
        orderId: id,
        status:  dto.status,
      });
    } catch { /* non-blocking */ }

    return updated;
  }
}
