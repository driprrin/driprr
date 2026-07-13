"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAddressStore } from "@/store/addressStore";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Please enter your email."); return; }
    if (!password) { setError("Please enter your password."); return; }

    setLoading(true);
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;
      if (!data.session) throw new Error("Login failed — no session returned.");

      const token = data.session.access_token;
      const su = data.session.user;

      setAuth(
        {
          id: su.id,
          phone: su.user_metadata?.phone || "",
          name: su.user_metadata?.name || su.email?.split("@")[0] || "User",
          role: su.user_metadata?.role || "CUSTOMER",
        },
        token
      );

      await fetchProfile();

      // Sync wishlist and addresses from DB
      const { syncFromDB: syncWishlist } = useWishlistStore.getState();
      const { syncFromDB: syncAddresses } = useAddressStore.getState();
      await Promise.allSettled([
        syncWishlist(data.session.user.id),
        syncAddresses(data.session.user.id),
      ]);

      router.push("/");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.toLowerCase().includes("invalid")) {
          setError("Wrong email or password.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Login failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden text-text-primary">
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 w-10 h-10 bg-surface-2 border border-border-low rounded-2xl flex items-center justify-center text-text-dim hover:text-text-primary transition-all"
      >
        <span className="material-symbols-outlined text-[20px]">home</span>
      </Link>

      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-surface-1/60 backdrop-blur-xl border border-border-low rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined text-white text-[28px]">local_fire_department</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">DRIPRR</h1>
          <p className="text-text-dim text-sm mt-1">hyperlocal streetwear dispatch</p>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-red-950/40 border border-red-900/60 rounded-2xl text-red-400 text-xs flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider text-text-dim uppercase mb-2">
              Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full pl-12 pr-4 py-3.5 bg-surface-2 border border-border-low focus:border-primary/60 rounded-2xl text-text-primary placeholder-text-mute focus:outline-none transition-colors text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider text-text-dim uppercase mb-2">
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-12 py-3.5 bg-surface-2 border border-border-low focus:border-primary/60 rounded-2xl text-text-primary placeholder-text-mute focus:outline-none transition-colors text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-on-primary font-bold rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Log In</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </Button>

          <div className="text-center pt-1">
            <span className="text-xs text-text-mute">Don&apos;t have an account? </span>
            <Link href="/signup" className="text-xs text-primary font-bold hover:underline">
              Create Account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
