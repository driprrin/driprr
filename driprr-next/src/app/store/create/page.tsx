"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Store, MapPin, Loader2, ArrowLeft } from "lucide-react";

export default function CreateStorePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Simulate frontend-only creation sandbox via localStorage
      const saved = localStorage.getItem("driprr_stores");
      const currentStores = saved ? JSON.parse(saved) : [];
      
      const newStore = {
        id: Date.now().toString(),
        name,
        location,
        status: "Open",
      };

      localStorage.setItem("driprr_stores", JSON.stringify([...currentStores, newStore]));

      setSuccess(true);
      setTimeout(() => {
        router.push("/stores");
      }, 1500);
    } catch (err: any) {
      console.error("Failed to create store", err);
      setError("Failed to create store. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-12 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Back to Stores list button */}
      <Link
        href="/stores"
        className="fixed top-4 left-4 z-50 w-10 h-10 bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-2xl flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-700 transition-all"
      >
        <ArrowLeft size={18} />
      </Link>

      <div className="w-full max-w-md bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30 text-white">
            <Store size={26} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Open Store</h1>
          <p className="text-neutral-400 text-sm mt-1">Register your streetwear boutique</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-900/60 rounded-2xl text-red-400 text-xs flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-900/60 rounded-2xl text-emerald-400 text-xs flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>Store created successfully! Redirecting…</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Name */}
          <div>
            <label htmlFor="store-name" className="block text-[11px] font-bold tracking-wider text-neutral-400 uppercase mb-2">
              Store Name
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 material-symbols-outlined text-[20px]">storefront</span>
              <input
                id="store-name"
                type="text"
                placeholder="e.g. Hype District"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3.5 bg-neutral-950 border border-neutral-800 focus:border-primary/60 rounded-2xl text-white placeholder-neutral-600 focus:outline-none transition-colors text-sm"
              />
            </div>
          </div>

          {/* Store Location */}
          <div>
            <label htmlFor="store-location" className="block text-[11px] font-bold tracking-wider text-neutral-400 uppercase mb-2">
              Store Location / Address
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 material-symbols-outlined text-[20px]">location_on</span>
              <input
                id="store-location"
                type="text"
                placeholder="e.g. MG Road, Bangalore"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3.5 bg-neutral-950 border border-neutral-800 focus:border-primary/60 rounded-2xl text-white placeholder-neutral-600 focus:outline-none transition-colors text-sm"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || success}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>
                <span>Launch Store</span>
                <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
              </>
            )}
          </Button>

          <div className="text-center pt-2">
            <Link href="/stores" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
              Cancel and go back
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
