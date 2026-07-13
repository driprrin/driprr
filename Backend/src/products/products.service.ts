import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

interface FindAllOptions {
  category?: string;
  storeId?:  string;
  brand?:    string;
  search?:   string;
  published?: boolean;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll({ category, storeId, brand, search, published = true }: FindAllOptions) {
    return this.prisma.product.findMany({
      where: {
        ...(published !== undefined ? { published } : {}),
        ...(category ? { category } : {}),
        ...(storeId  ? { storeId }  : {}),
        ...(brand    ? { brand: { contains: brand, mode: 'insensitive' } } : {}),
        ...(search   ? {
          OR: [
            { name:  { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
      },
      include: { inventory: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        inventory: true,
        store: {
          select: { id: true, name: true, slug: true, rating: true, coverUrl: true, etaMin: true, deliveryFee: true, freeDeliveryAbove: true },
        },
      },
    });
    if (!product) throw new NotFoundException(`Product "${id}" not found`);
    return product;
  }

  async create(dto: CreateProductDto) {
    const { inventory, ...productData } = dto;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        tags:      dto.tags      ?? [],
        imageUrls: dto.imageUrls ?? [],
        published: dto.published ?? false,
      },
    });

    // Create inventory rows if provided
    if (inventory?.length) {
      await this.prisma.inventory.createMany({
        data: inventory.map((inv) => ({
          productId: product.id,
          size:      inv.size,
          stock:     inv.stock,
        })),
        skipDuplicates: true,
      });
    }

    return this.findOne(product.id);
  }

  async update(id: string, dto: UpdateProductDto, requestingUserId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true } } },
    });
    if (!product) throw new NotFoundException(`Product "${id}" not found`);

    // Only store owner or admin can edit
    if (requestingUserId && product.store.ownerId !== requestingUserId) {
      const user = await this.prisma.user.findUnique({ where: { id: requestingUserId } });
      if (user?.role !== 'ADMIN') throw new ForbiddenException('Not authorized to edit this product');
    }

    const { inventory, ...productData } = dto;

    await this.prisma.product.update({
      where: { id },
      data:  { ...productData },
    });

    // Update inventory if provided
    if (inventory?.length) {
      for (const inv of inventory) {
        await this.prisma.inventory.upsert({
          where:  { productId_size: { productId: id, size: inv.size } },
          create: { productId: id, size: inv.size, stock: inv.stock },
          update: { stock: inv.stock },
        });
      }
    }

    return this.findOne(id);
  }

  async remove(id: string, requestingUserId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true } } },
    });
    if (!product) throw new NotFoundException(`Product "${id}" not found`);

    if (requestingUserId && product.store.ownerId !== requestingUserId) {
      const user = await this.prisma.user.findUnique({ where: { id: requestingUserId } });
      if (user?.role !== 'ADMIN') throw new ForbiddenException('Not authorized to delete this product');
    }

    // Cascade delete inventory then product
    await this.prisma.inventory.deleteMany({ where: { productId: id } });
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }

  async togglePublish(id: string, requestingUserId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true } } },
    });
    if (!product) throw new NotFoundException(`Product "${id}" not found`);

    if (requestingUserId && product.store.ownerId !== requestingUserId) {
      const user = await this.prisma.user.findUnique({ where: { id: requestingUserId } });
      if (user?.role !== 'ADMIN') throw new ForbiddenException('Not authorized');
    }

    return this.prisma.product.update({
      where: { id },
      data:  { published: !product.published },
    });
  }

  async sell(id: string, size: string, quantity: number) {
    await this.findOne(id);
    const inventory = await this.prisma.inventory.findFirst({ where: { productId: id, size } });
    if (!inventory) throw new NotFoundException(`Inventory for product "${id}", size "${size}" not found`);
    if (quantity > inventory.stock) throw new BadRequestException(`Insufficient stock. Requested ${quantity}, available ${inventory.stock}`);
    return this.prisma.inventory.update({ where: { id: inventory.id }, data: { stock: { decrement: quantity } } });
  }
}

