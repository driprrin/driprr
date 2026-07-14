"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";
import { MapPin, Loader2, Store as StoreIcon, Plus } from "lucide-react";
import storeVogue from "@/assets/store-vogue.jpg";
import storeDrip from "@/assets/store-drip.jpg";
import { supabase } from "@/lib/supabase";

interface Store {
  id: string;
  name: string;
  location: string;
  city?: string;
  status: string;
  slug?: string;
  isOpen?: boolean;
  rating?: number;
  coverUrl?: string;
}

export default function StoresPage() {
  const user = useAuthStore((s) => s.user);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("Store")
      .select("*")
      .eq("status", "active")
      .order("rating", { ascending: false })
      .then(({ data }) => {
        setStores(data ?? []);
        setLoading(false);
      });
  }, []);

  const isStoreOwner = user?.role === "STORE_OWNER" || user?.role === "ADMIN";

  // Predefined streetwear images to cycle through for mock/placeholder display
  const storeImages = [storeVogue, storeDrip];

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center justify-between border-b border-border-low bg-surface-1/40 backdrop-blur-md sticky top-0 z-30 max-w-6xl mx-auto w-full">
        {/* Left: Home navigation */}
        <Link
          href="/"
          className="w-10 h-10 bg-surface-2 border border-border-low rounded-2xl flex items-center justify-center text-text-dim hover:text-text-primary transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">home</span>
        </Link>

        {/* Center Title */}
        <h1 className="text-lg font-black tracking-widest uppercase">STORES</h1>

        {/* Right Action: Create Store button for Store Owners */}
        {isStoreOwner ? (
          <Link
            href="/store/create"
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-soft text-on-primary font-bold text-xs uppercase rounded-xl transition-all shadow-md active:scale-[0.98]"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>Create Store</span>
          </Link>
        ) : (
          <div className="w-10" />
        )}
      </header>

      <main className="max-w-6xl mx-auto px-5 pt-8 relative z-10">
        {/* SEO intro — always rendered server-side */}
        <p className="text-sm text-text-dim leading-relaxed mb-6">
          Every store on Driprr is a real, verified fashion retailer in Hubli-Dharwad. Browse stores near you and get their in-stock products delivered in 30-90 minutes.
        </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center max-w-sm mx-auto gap-4">
            <div className="w-16 h-16 rounded-3xl bg-surface-2 border border-border-low flex items-center justify-center text-text-dim">
              <StoreIcon size={32} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase">No stores registered yet</h2>
              <p className="text-text-dim text-xs mt-1.5 leading-relaxed">
                Be the first to open a storefront! Sign in as a Store Owner to list your boutique on DRIPRR.
              </p>
            </div>
            {isStoreOwner && (
              <Link
                href="/store/create"
                className="px-5 py-3 bg-primary hover:bg-primary-soft text-on-primary font-bold text-xs uppercase rounded-xl transition-all shadow-md"
              >
                Open Your Store Now
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {stores.map((s, idx) => {
              const image = storeImages[idx % storeImages.length];
              return (
                <Link
                  key={s.id}
                  href={`/store/${s.slug || s.id}`}
                  className="bg-surface-1 border border-border-low rounded-3xl overflow-hidden cursor-pointer group hover:scale-[1.02] transition-all duration-250 shadow-sm flex flex-col h-full"
                >
                  <div className="relative h-44 w-full">
                    <Image
                      src={image}
                      alt={s.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-black uppercase rounded-md tracking-wider">
                        {s.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display font-bold text-base group-hover:text-primary transition-colors leading-tight">
                        {s.name}
                      </h3>
                      <p className="text-text-dim text-xs mt-1 flex items-center gap-1">
                        <MapPin size={12} className="text-primary shrink-0" />
                        <span className="truncate">{s.city || s.location || "—"}</span>
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border-low flex items-center justify-between text-[11px]">
                      <span className="text-text-mute">Streetwear collection</span>
                      <span className="text-primary font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                        Explore →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
