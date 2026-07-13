"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

function SignupForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!email) { setError("Please enter your email."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role: "CUSTOMER" },
        },
      });

      if (signUpError) throw signUpError;
      if (!data.session) {
        // Email confirmation required — show a message
        setError("Account created! Please check your email to confirm before logging in.");
        setLoading(false);
        return;
      }

      const token = data.session.access_token;
      const su = data.session.user;

      setAuth(
        { id: su.id, phone: "", name, role: "CUSTOMER" },
        token
      );

      // Register user row in DB (best-effort — don't block signup if this fails)
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: su.id, name, email, role: "CUSTOMER" }),
        });
      } catch { /* ignore — AuthGuard will create the row on first API call */ }

      await fetchProfile();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed. Try again.");
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
            <span className="material-symbols-outlined text-white text-[28px]">person_add</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Join DRIPRR</h1>
          <p className="text-text-dim text-sm mt-1">Shop streetwear near you</p>
        </div>

        {error && (
          <div className={`mb-5 p-4 rounded-2xl text-xs flex items-center gap-3 ${
            error.includes("check your email")
              ? "bg-emerald-950/40 border border-emerald-900/60 text-emerald-400"
              : "bg-red-950/40 border border-red-900/60 text-red-400"
          }`}>
            <span className="material-symbols-outlined text-[18px]">
              {error.includes("check your email") ? "check_circle" : "error"}
            </span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider text-text-dim uppercase mb-2">
              Full Name
            </label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="w-full pl-12 pr-4 py-3.5 bg-surface-2 border border-border-low focus:border-primary/60 rounded-2xl text-text-primary placeholder-text-mute focus:outline-none transition-colors text-sm"
              />
            </div>
          </div>

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
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-12 py-3.5 bg-surface-2 border border-border-low focus:border-primary/60 rounded-2xl text-text-primary placeholder-text-mute focus:outline-none transition-colors text-sm"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider text-text-dim uppercase mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full pl-12 pr-12 py-3.5 bg-surface-2 border border-border-low focus:border-primary/60 rounded-2xl text-text-primary placeholder-text-mute focus:outline-none transition-colors text-sm"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary transition-colors">
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
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
                <span>Create Account</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </Button>

          <div className="text-center pt-1">
            <span className="text-xs text-text-mute">Already have an account? </span>
            <Link href="/login" className="text-xs text-primary font-bold hover:underline">
              Log In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
