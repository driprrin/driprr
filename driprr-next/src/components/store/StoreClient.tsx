"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, Heart, Star, PackageOpen, Loader2 } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import { useCartStore } from "@/store/cartStore";
import storeVogue from "@/assets/store-vogue.jpg";
import { supabase } from "@/lib/supabase";

export default function StoreClient({ slug }: { slug: string }) {
  const { addItem } = useCartStore();
  const [store,    setStore]    = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Filters
  const [sortBy, setSortBy]         = useState<"default" | "price-asc" | "price-desc" | "newest">("default");
  const [filterCat, setFilterCat]   = useState("All");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setNotFound(false);

      // Skip backend entirely — go directly to Supabase (most reliable)
      const { data: storeRows, error: storeErr } = await supabase
        .from("Store")
        .select("*")
        .eq("slug", slug)
        .limit(1);

      console.log("Store query result:", { storeRows, storeErr, slug });

      if (storeErr || !storeRows || storeRows.length === 0) {
        // Try by ID as fallback
        const { data: byIdRows } = await supabase
          .from("Store")
          .select("*")
          .eq("id", slug)
          .limit(1);

        if (!byIdRows || byIdRows.length === 0) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setStore(byIdRows[0]);

        const { data: prodData } = await supabase
          .from("Product")
          .select("*")
          .eq("storeId", byIdRows[0].id)
          .eq("published", true);
        setProducts(prodData ?? []);
      } else {
        setStore(storeRows[0]);

        const { data: prodData } = await supabase
          .from("Product")
          .select("*")
          .eq("storeId", storeRows[0].id)
          .eq("published", true);
        setProducts(prodData ?? []);
      }

      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="min-h-screen bg-background text-text-primary pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="px-4 pt-4">
            <Link href="/" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-surface-1 border border-border-low text-text-dim hover:text-text-primary transition-colors">
              <ChevronLeft size={20} />
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-surface-1 border border-border-low flex items-center justify-center text-text-mute">
              <PackageOpen size={28} />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl">Store not found</h1>
              <p className="text-text-mute text-sm mt-1">This store doesn't exist or hasn't been set up yet.</p>
            </div>
            <Link href="/stores" className="px-5 py-2.5 bg-primary text-on-primary font-bold rounded-2xl text-sm">Browse Stores</Link>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Filter & sort products
  const filteredProducts = (() => {
    let list = [...products];
    if (filterCat !== "All") {
      list = list.filter((p: any) => (p.tags ?? []).includes(filterCat) || p.category === filterCat);
    }
    switch (sortBy) {
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "newest": list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    }
    return list;
  })();

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24">
      <div className="max-w-5xl mx-auto">
        {/* Cover */}
        <div className="relative h-56 sm:h-72 bg-surface-2">
          <Image src={store.coverUrl || storeVogue} alt={store.name} fill className="object-cover" priority sizes="100vw" unoptimized={!!store.coverUrl} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <Link href="/" className="absolute top-4 left-4 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full">
            <span className="text-white text-xs font-bold">{store.deliveryFee === 0 ? "Free Delivery" : `₹${store.deliveryFee} delivery`}</span>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            {store.rating > 0 && (
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                <Star size={12} className="text-success fill-success" />
                <span className="text-white text-sm font-bold">{store.rating}</span>
              </div>
            )}
          </div>
        </div>

        {/* Store info */}
        <div className="px-4 py-4 border-b border-border-low">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="font-display font-bold text-xl">{store.name}</h1>
              {store.tagline && <p className="text-sm text-text-mute mt-0.5">{store.tagline}</p>}
            </div>
            <span className={`shrink-0 flex items-center gap-1.5 text-sm font-semibold mt-1 ${store.isOpen ? "text-success" : "text-text-mute"}`}>
              <span className={`w-2 h-2 rounded-full ${store.isOpen ? "bg-success animate-pulse" : "bg-text-mute"}`} />
              {store.isOpen ? "Live" : "Closed"}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-sm text-text-mute">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            ~{store.etaMin ?? 45} min delivery
          </div>
        </div>

        {/* Products */}
        <div className="px-4 pt-5 pb-2 flex items-center justify-between">
          <h2 className="font-display font-bold text-lg">Available Now</h2>
          <span className="text-xs text-text-mute">{filteredProducts.length} items</span>
        </div>

        {/* Filters */}
        {products.length > 0 && (
          <div className="px-4 pb-3 space-y-2">
            {/* Type chips (from tags) */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {["All", ...Array.from(new Set(products.flatMap((p: any) => p.tags ?? []).filter(Boolean)))].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setFilterCat(tag)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    filterCat === tag
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-1 border-border-low text-text-dim hover:border-text-mute"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {/* Sort */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {([
                { key: "default", label: "Relevance" },
                { key: "price-asc", label: "Price: Low" },
                { key: "price-desc", label: "Price: High" },
                { key: "newest", label: "Newest" },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSortBy(opt.key)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    sortBy === opt.key
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-1 border-border-low text-text-dim hover:border-text-mute"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredProducts.length === 0 && products.length > 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-6">
            <div className="w-14 h-14 rounded-3xl bg-surface-1 border border-border-low flex items-center justify-center text-text-mute">
              <PackageOpen size={24} />
            </div>
            <p className="text-text-mute text-sm">No products match your filter.</p>
            <button onClick={() => { setFilterCat("All"); setSortBy("default"); }} className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl">Clear Filters</button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-6">
            <div className="w-14 h-14 rounded-3xl bg-surface-1 border border-border-low flex items-center justify-center text-text-mute">
              <PackageOpen size={24} />
            </div>
            <p className="text-text-mute text-sm">No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-border-low">
            {filteredProducts.map((p: any) => {
              const discount = p.originalPrice > p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
              return (
                <Link key={p.id} href={`/product/${p.id}`} className="bg-background flex flex-col group cursor-pointer">
                  <div className="relative aspect-[3/4] overflow-hidden bg-surface-1">
                    {p.imageUrls?.[0] ? (
                      <Image src={p.imageUrls[0]} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 50vw, 25vw" unoptimized />
                    ) : (
                      <div className="w-full h-full bg-surface-2 flex items-center justify-center text-text-mute text-xs">No image</div>
                    )}
                    <button aria-label="Wishlist" onClick={(e) => e.preventDefault()} className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-full bg-background/70 backdrop-blur-sm hover:bg-primary hover:text-on-primary transition-colors">
                      <Heart size={13} />
                    </button>
                  </div>
                  <div className="p-3 flex flex-col gap-1">
                    <p className="text-[10px] text-text-mute font-semibold tracking-widest uppercase">{p.brand}</p>
                    <p className="text-sm text-text-primary leading-snug line-clamp-2">{p.name}</p>
                    <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                      <span className="font-bold text-sm">₹{p.price.toLocaleString("en-IN")}</span>
                      {p.originalPrice > p.price && <span className="text-xs text-text-mute line-through">₹{p.originalPrice.toLocaleString("en-IN")}</span>}
                      {discount > 0 && <span className="text-xs font-semibold text-success">{discount}% off</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

