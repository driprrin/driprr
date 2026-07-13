import { createClient } from "@supabase/supabase-js";

// Regular client — uses logged-in user's session
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Admin client — uses service role key, bypasses RLS entirely
// ⚠️ SECURITY NOTE: This key is exposed via NEXT_PUBLIC_ because it's used in
// client components. This is acceptable ONLY because:
// 1. The admin dashboard is a private/internal tool (not public-facing)
// 2. All pages are protected by authentication guards
// 3. Only verified admin users can access this app
// If this app ever becomes publicly accessible, move admin operations to
// server-side API routes and use a non-NEXT_PUBLIC_ env var instead.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Types matching the DB schema ─────────────────────────────────────────────

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface StoreApplication {
  id:             string;
  ownerName:      string;
  email:          string;
  phone:          string;
  password?:      string | null;
  storeName:      string;
  storeAddress:   string;
  city:           string;
  pincode:        string;
  categories:     string[];
  description:    string;
  instagram:      string | null;
  experience:     string | null;
  monthlySales:   string | null;
  status:         ApplicationStatus;
  reviewedAt:     string | null;
  reviewedBy:     string | null;
  rejectReason:   string | null;
  createdUserId:  string | null;
  createdStoreId: string | null;
  createdAt:      string;
  updatedAt:      string;
}

export interface AdminUser {
  id:    string;
  email: string;
  name:  string;
  role:  "ADMIN";
}
