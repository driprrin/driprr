"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRiderStore } from "@/store/riderStore";
import { Eye, EyeOff, Bike } from "lucide-react";

export default function LoginPage() {
  const router   = useRouter();
  const setAuth  = useRiderStore((s) => s.setAuth);

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      if (!data.session) throw new Error("No session.");

      const role = data.session.user.user_metadata?.role;
      if (role !== "RIDER") {
        await supabase.auth.signOut();
        throw new Error("This account is not registered as a rider.");
      }

      setAuth(
        {
          id:          data.session.user.id,
          name:        data.session.user.user_metadata?.name || "Rider",
          email,
          phone:       data.session.user.user_metadata?.phone || "",
          zone:        data.session.user.user_metadata?.zone  || "Hubli",
          vehicleType: data.session.user.user_metadata?.vehicleType || "bike",
          isActive:    false,
        },
        data.session.access_token
      );
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5 relative overflow-hidden">
      <div className="absolute top-[-30%] left-[-30%] w-[80%] h-[80%] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />

      <div className="w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-primary/30">
            <Bike size={36} className="text-on-primary" />
          </div>
          <h1 className="text-3xl font-black text-text-primary">DRIPRR Rider</h1>
          <p className="text-text-mute text-sm mt-1">Delivery partner portal</p>
        </div>

        {error && (
          <div className="p-4 bg-danger/10 border border-danger/30 rounded-2xl text-danger text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-text-mute uppercase tracking-wider mb-2">Email</label>
            <input type="email" placeholder="rider@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required autoFocus
              className="w-full px-4 py-4 bg-surface-1 border border-border-low focus:border-primary/60 rounded-2xl text-text-primary placeholder-text-mute focus:outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-text-mute uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} placeholder="Your password" value={password}
                onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-4 py-4 pr-14 bg-surface-1 border border-border-low focus:border-primary/60 rounded-2xl text-text-primary placeholder-text-mute focus:outline-none transition-colors" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-mute hover:text-text-primary">
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-4 bg-primary text-on-primary font-black text-base rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-70 active:scale-[0.98]">
            {loading
              ? <div className="w-6 h-6 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              : <><Bike size={20} /> Start Riding</>
            }
          </button>
        </form>

        <p className="text-center text-xs text-text-mute">
          Not registered as a rider?{" "}
          <Link href="/register" className="text-primary font-bold hover:underline">
            Apply to become a rider
          </Link>
        </p>
      </div>
    </div>
  );
}
