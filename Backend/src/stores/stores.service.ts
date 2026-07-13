import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateStoreDto) {
    return this.prisma.store.create({
      data: {
        ownerId:          dto.ownerId,
        name:             dto.name,
        slug:             dto.slug,
        tagline:          dto.tagline,
        coverUrl:         dto.coverUrl,
        address:          dto.address,
        city:             dto.city,
        pincode:          dto.pincode,
        categories:       dto.categories ?? [],
        deliveryFee:      dto.deliveryFee ?? 49,
        freeDeliveryAbove: dto.freeDeliveryAbove ?? 999,
        deliveryRadiusKm: dto.deliveryRadiusKm ?? 5,
        isOpen:           false,
        status:           'active',
      },
    });
  }

  findAll(city?: string, category?: string, ownerId?: string) {
    return this.prisma.store.findMany({
      where: {
        ...(ownerId ? { ownerId } : { status: 'active' }),
        ...(city     ? { city: { contains: city, mode: 'insensitive' } } : {}),
        ...(category ? { categories: { has: category } }               : {}),
      },
      orderBy: { rating: 'desc' },
    });
  }

  async findOne(id: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new NotFoundException(`Store "${id}" not found`);
    return store;
  }

  async findBySlug(slug: string) {
    // Try exact slug match first, then by id
    const store = await this.prisma.store.findFirst({
      where: {
        OR: [
          { slug },
          { id: slug },
          { slug: { startsWith: slug } },
        ],
        status: { not: 'removed' },
      },
    });
    if (!store) throw new NotFoundException(`Store "${slug}" not found`);
    return store;
  }

  async update(id: string, dto: UpdateStoreDto) {
    await this.findOne(id);
    return this.prisma.store.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.store.delete({ where: { id } });
  }

  async findProducts(slugOrId: string, category?: string, published = true) {
    // Try by slug first, then by id
    const store = await this.prisma.store.findFirst({
      where: {
        OR: [
          { slug: slugOrId },
          { id: slugOrId },
          { slug: { startsWith: slugOrId } },
        ],
      },
    });
    if (!store) throw new NotFoundException(`Store "${slugOrId}" not found`);

    return this.prisma.product.findMany({
      where: {
        storeId: store.id,
        ...(published ? { published: true } : {}),
        ...(category ? { category } : {}),
      },
      include: { inventory: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
