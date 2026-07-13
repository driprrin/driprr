import {
  Controller, Get, Post, Body, Query,
  UseGuards, NotFoundException, ConflictException,
} from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { AuthThrottle } from './auth-throttle.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum } from 'class-validator';

class RegisterDto {
  @IsString() @IsNotEmpty() id:    string; // Supabase Auth UUID
  @IsString() @IsNotEmpty() name:  string;
  @IsEmail()  @IsOptional() email?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() role?:  string;
  @IsString() @IsOptional() avatar?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  // GET /api/auth/me — get current user profile (protected)
  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser() user: any) {
    // If store owner, include their storeId and storeName
    if (user.role === 'STORE_OWNER') {
      const store = await this.prisma.store.findFirst({
        where: { ownerId: user.id },
        select: { id: true, name: true },
      });
      if (store) {
        return { ...user, storeId: store.id, storeName: store.name };
      }
    }
    return user;
  }

  // POST /api/auth/register — create User row in DB after Supabase signup
  // Called by frontend immediately after signUp()
  @Post('register')
  @AuthThrottle() // Stricter: 5 requests per 60s to prevent abuse
  async register(@Body() dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { id: dto.id } });
    if (exists) return exists; // idempotent — return existing

    return this.prisma.user.create({
      data: {
        id:     dto.id,
        name:   dto.name,
        email:  dto.email  ?? null,
        phone:  dto.phone  ?? null,
        role:   (dto.role as any) ?? 'CUSTOMER',
        avatar: dto.avatar ?? null,
      },
    });
  }

  // GET /api/auth/email-by-phone — look up email by phone number
  @Get('email-by-phone')
  async getEmailByPhone(@Query('phone') phone: string) {
    if (!phone) throw new NotFoundException('Phone query parameter is required');

    const user = await this.prisma.user.findUnique({
      where:  { phone },
      select: { email: true },
    });

    if (!user?.email) throw new NotFoundException('No account found for this phone number');
    return { email: user.email };
  }
}
