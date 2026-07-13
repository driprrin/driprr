"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Eye, EyeOff, Mail, Lock, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router   = useRouter();
  const setAuth  = useAuthStore((s) => s.setAuth);
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
      if (role !== "ADMIN") {
        await supabase.auth.signOut();
        throw new Error("Access denied. Admin accounts only.");
      }

      setAuth(
        { id: data.session.user.id, name: data.session.user.user_metadata?.name || "Admin", email, role: "ADMIN" },
        data.session.access_token
      );
      router.push("/applications");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full py-3.5 bg-surface-2 border border-border-low focus:border-primary/60 rounded-2xl text-text-primary placeholder-text-mute focus:outline-none transition-colors text-sm";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm bg-surface-1/60 backdrop-blur-xl border border-border-low rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <ShieldCheck size={28} className="text-on-primary" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">DRIPRR Admin</h1>
          <p className="text-text-mute text-xs mt-1">Internal operations panel</p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-950/40 border border-red-900/60 rounded-2xl text-red-400 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mute" />
            <input type="email" placeholder="admin@driprr.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required autoFocus
              className={`${inputCls} pl-11 pr-4`} />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mute" />
            <input type={showPass ? "text" : "password"} placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)} required
              className={`${inputCls} pl-11 pr-12`} />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-mute hover:text-text-primary">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><ShieldCheck size={16} /> Sign In to Admin</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}
