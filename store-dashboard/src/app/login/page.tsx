"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

function LoginForm() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const setAuth       = useAuthStore((s) => s.setAuth);
  const fetchProfile  = useAuthStore((s) => s.fetchProfile);

  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(
    searchParams.get("error") === "not_store_owner"
      ? "This account doesn't have store access."
      : ""
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email)    { setError("Please enter your email.");    return; }
    if (!password) { setError("Please enter your password."); return; }

    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      if (!data.session) throw new Error("No session returned.");

      const su    = data.session.user;
      const role  = su.user_metadata?.role;

      if (role !== "STORE_OWNER" && role !== "ADMIN") {
        await supabase.auth.signOut();
        setError("This account doesn't have store access. Apply to become a seller.");
        setLoading(false);
        return;
      }

      setAuth(
        {
          id:   su.id,
          name: su.user_metadata?.name || su.email?.split("@")[0] || "Owner",
          email: su.email,
          phone: su.user_metadata?.phone || "",
          role,
          storeId:   su.user_metadata?.storeId,
          storeName: su.user_metadata?.storeName,
        },
        data.session.access_token
      );

      await fetchProfile();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-surface-1/60 backdrop-blur-xl border border-border-low rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined text-white text-[28px]">storefront</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">DRIPRR Store</h1>
          <p className="text-text-mute text-sm mt-1">Merchant dashboard</p>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-red-950/40 border border-red-900/60 rounded-2xl text-red-400 text-xs flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold tracking-wider text-text-mute uppercase mb-2">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mute" />
              <input
                type="email"
                placeholder="owner@store.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full pl-12 pr-4 py-3.5 bg-surface-2 border border-border-low focus:border-primary/60 rounded-2xl text-text-primary placeholder-text-mute focus:outline-none transition-colors text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold tracking-wider text-text-mute uppercase mb-2">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mute" />
              <input
                type={showPass ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-12 py-3.5 bg-surface-2 border border-border-low focus:border-primary/60 rounded-2xl text-text-primary placeholder-text-mute focus:outline-none transition-colors text-sm"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-mute hover:text-text-primary">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-on-primary font-bold rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all mt-2 disabled:opacity-70"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-text-mute mt-6">
          Not a seller yet?{" "}
          <Link href="/apply" className="text-primary font-bold hover:underline">
            Apply to sell on DRIPRR
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}
