import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { AuthGuard } from './auth.guard';
import { AuthController } from './auth.controller';

@Global()
@Module({
  controllers: [AuthController],
  providers: [SupabaseService, AuthGuard],
  exports: [SupabaseService, AuthGuard],
})
export class AuthModule {}
