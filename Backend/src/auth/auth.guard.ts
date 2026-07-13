import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      throw new UnauthorizedException('Invalid Authorization token format');
    }

    const client = this.supabaseService.getClient();
    const { data, error } = await client.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    const supabaseUser = data.user;

    // Look up user in local database
    let dbUser = await this.prisma.user.findUnique({
      where: { id: supabaseUser.id },
    });

    if (!dbUser) {
      // Resolve phone — stored in metadata (signup set it there)
      const phone =
        supabaseUser.user_metadata?.phone ||
        supabaseUser.phone ||
        `user_${supabaseUser.id.slice(0, 8)}`;

      const name = supabaseUser.user_metadata?.name || 'User';
      const email = supabaseUser.email || null;

      let role: UserRole = UserRole.CUSTOMER;
      const metadataRole = supabaseUser.user_metadata?.role;
      if (metadataRole === 'STORE_OWNER') role = UserRole.STORE_OWNER;
      if (metadataRole === 'RIDER') role = UserRole.RIDER;
      if (metadataRole === 'ADMIN') role = UserRole.ADMIN;

      dbUser = await this.prisma.user.create({
        data: {
          id: supabaseUser.id,
          phone,
          email,
          name,
          role,
          avatar: supabaseUser.user_metadata?.avatar_url || null,
        },
      });
    } else {
      // Update email if it is now available and not yet stored
      if (!dbUser.email && supabaseUser.email) {
        dbUser = await this.prisma.user.update({
          where: { id: dbUser.id },
          data: { email: supabaseUser.email },
        });
      }
    }

    request.user = dbUser;
    return true;
  }
}
