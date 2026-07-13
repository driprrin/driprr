import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private anonClient:    SupabaseClient;
  private serviceClient: SupabaseClient;

  onModuleInit() {
    const url     = process.env.SUPABASE_URL          || '';
    const anon    = process.env.SUPABASE_ANON_KEY     || process.env.SUPABASE_KEY || '';
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    this.anonClient    = createClient(url, anon);
    this.serviceClient = createClient(url, service, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  /** Used by AuthGuard to verify JWT tokens */
  getClient(): SupabaseClient {
    return this.anonClient;
  }

  /** Used for admin operations — user creation, deletion etc. */
  getAdminClient(): SupabaseClient {
    return this.serviceClient;
  }
}
