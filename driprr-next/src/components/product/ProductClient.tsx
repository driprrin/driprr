"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft, Heart, Clock, ChevronDown, ChevronUp,
  Star, Share2, ShoppingBag, Check, Store, Loader2,
} from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAuthStore } from "@/store/authStore";

function StarRow({ rating, size = 13, count }: { rating: number; size?: number; count?: number }) {
  const full = Math.floor(rating); const half = rating % 1 >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < full ? "fill-amber-400 text-amber-400" : i === full && half ? "fill-amber-400/50 text-amber-400" : "fill-none text-text-mute"} />
      ))}
      {count !== undefined && <span className="ml-1 text-xs text-text-mute">({count})</span>}
    </span>
  );
}

function Accordion({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border-low last:border-b-0">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between py-4 text-left group">
        <span className="font-semibold text-sm text-text-primary group-hover:text-primary transition-colors">{title}</span>
        {open ? <ChevronUp size={16} className="text-text-mute shrink-0" /> : <ChevronDown size={16} className="text-text-mute shrink-0" />}
      </button>
      {open && <div className="pb-5 text-sm text-text-dim leading-relaxed space-y-2">{children}</div>}
    </div>
  );
}

export default function ProductClient({ id }: { id: string }) {
  const { addItem } = useCartStore();
  const { toggleItem, isWishlisted } = useWishlistStore();
  const [product,      setProduct]      = useState<any | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [notFound,     setNotFound]     = useState(false);
  const [activeImg,    setActiveImg]    = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity,     setQuantity]     = useState(1);
  const [added,        setAdded]        = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // Try backend first
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${apiBase}/products/${id}`, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          setProduct(await res.json());
          setLoading(false);
          return;
        }
      } catch { /* backend down — fallback */ }

      // Fallback: Supabase direct
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data, error } = await supabase
          .from("Product")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) { console.error("Product fetch error:", error); setNotFound(true); setLoading(false); return; }
        if (!data) { setNotFound(true); setLoading(false); return; }

        // Fetch inventory (sizes + stock)
        const { data: invData } = await supabase
          .from("Inventory")
          .select("*")
          .eq("productId", data.id);
        if (invData) data.inventory = invData;

        // Also fetch store info separately
        if (data.storeId) {
          const { data: storeData } = await supabase
            .from("Store")
            .select("id, name, slug, rating, etaMin, deliveryFee, freeDeliveryAbove")
            .eq("id", data.storeId)
            .maybeSingle();
          if (storeData) data.store = storeData;
        }

        setProduct(data);
      } catch { setNotFound(true); }

      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex flex-col items-center justify-center gap-4 pb-24">
        <ShoppingBag size={48} className="text-text-mute" />
        <p className="text-text-mute text-lg font-medium">Product not found</p>
        <Link href="/" className="px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-xl text-sm">Back to Home</Link>
        <BottomNav />
      </div>
    );
  }

  const images: string[] = product.imageUrls ?? [];
  const sizes: string[] = (product.inventory ?? []).map((inv: any) => inv.size).filter((s: string, i: number, a: string[]) => a.indexOf(s) === i);
  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  function handleAddToBag(e: React.MouseEvent) {
    if (sizes.length > 0 && !selectedSize) {
      alert("Please select a size first");
      return;
    }
    window.dispatchEvent(new CustomEvent("add-to-cart-animate", { detail: { x: e.clientX, y: e.clientY, image: images[0] } }));
    addItem({
      id:       product.id,
      name:     product.name,
      brand:    product.brand,
      price:    product.price,
      image:    images[0] ?? "",
      size:     selectedSize ?? undefined,
      storeId:  product.store?.id ?? product.storeId ?? undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background text-text-primary pb-32 sm:pb-24">
      <div className="max-w-5xl mx-auto">

        {/* ── Sticky header ── */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border-low px-4 py-3 flex items-center gap-3">
          <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-1 transition-colors shrink-0">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-mute truncate leading-none">{product.brand}</p>
            <p className="text-sm font-semibold text-text-primary truncate leading-snug mt-0.5">{product.name}</p>
          </div>
          <button
            aria-label="Share"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-1 transition-colors"
            onClick={() => navigator.share?.({ title: product.name, url: window.location.href })}
          >
            <Share2 size={16} className="text-text-mute" />
          </button>
          <button
            aria-label="Wishlist"
            onClick={() => {
              const userId = useAuthStore.getState().user?.id;
              toggleItem(
                { id: product.id, name: product.name, brand: product.brand, price: product.price, originalPrice: product.originalPrice, image: images[0] ?? "" },
                userId
              );
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-1 transition-colors"
          >
            <Heart size={18} className={isWishlisted(product.id) ? "fill-red-500 text-red-500" : "text-text-mute"} />
          </button>
        </header>

        <div className="sm:grid sm:grid-cols-2 sm:gap-10 sm:p-6">

          {/* ── Image gallery ── */}
          <div className="flex flex-col gap-3">
            <div className="relative aspect-[3/4] bg-surface-1 overflow-hidden sm:rounded-2xl">
              {images[activeImg] ? (
                <Image src={images[activeImg]} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" priority unoptimized />
              ) : (
                <div className="w-full h-full bg-surface-2 flex items-center justify-center text-text-mute">No image</div>
              )}
              {product.badge && <span className="absolute top-3 left-3 px-2.5 py-1 bg-success text-white text-[10px] font-bold rounded-lg shadow">{product.badge}</span>}
              {discount > 0 && <span className="absolute top-3 right-3 px-2.5 py-1 bg-primary text-on-primary text-[11px] font-bold rounded-lg shadow">{discount}% OFF</span>}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={`rounded-full transition-all ${activeImg === i ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`} />
                ))}
              </div>
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 px-4 sm:px-0">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={`relative flex-1 aspect-square rounded-xl overflow-hidden transition-all ${activeImg === i ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-60 hover:opacity-100"}`}>
                    <Image src={img} alt={`View ${i + 1}`} fill className="object-cover" sizes="80px" unoptimized />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product info ── */}
          <div className="px-4 pt-5 sm:px-0 sm:pt-0 flex flex-col gap-5">
            <div>
              <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-text-mute">{product.brand}</p>
              <h1 className="font-display font-bold text-[1.6rem] leading-tight mt-1 text-text-primary">{product.name}</h1>
              {product.rating > 0 && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <StarRow rating={product.rating} size={14} />
                  <span className="text-sm font-bold text-text-primary">{product.rating}</span>
                  <span className="text-xs text-text-mute">{product.reviewCount} reviews</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl font-black text-primary tracking-tight">₹{product.price.toLocaleString("en-IN")}</span>
              {product.originalPrice > product.price && (
                <span className="text-base text-text-mute line-through">₹{product.originalPrice.toLocaleString("en-IN")}</span>
              )}
              {discount > 0 && (
                <span className="px-2.5 py-0.5 bg-success/15 text-success text-xs font-bold rounded-full border border-success/20">
                  Save ₹{(product.originalPrice - product.price).toLocaleString("en-IN")}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 bg-surface-1 rounded-2xl px-4 py-3 border border-border-low">
              <Clock size={16} className="text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Delivers in ~{product.store?.etaMin ?? 45} min</p>
                <p className="text-xs text-text-mute mt-0.5">Free delivery above ₹{(product.store?.freeDeliveryAbove ?? 999).toLocaleString("en-IN")}</p>
              </div>
            </div>

            {sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-text-primary">Select Size</p>
                  <button className="text-xs text-primary font-semibold underline underline-offset-4">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size: string) => (
                    <button key={size} onClick={() => setSelectedSize(size)}
                      className={`min-w-[48px] px-3 py-2.5 rounded-xl border-2 text-sm font-bold transition-all duration-150 ${selectedSize === size ? "bg-primary text-on-primary border-primary scale-105 shadow-md" : "bg-surface-1 border-border-low text-text-primary hover:border-primary/60 hover:bg-surface-2"}`}>
                      {size}
                    </button>
                  ))}
                </div>
                {!selectedSize && <p className="mt-2 text-[11px] text-text-mute">Please select a size before adding to bag</p>}
              </div>
            )}

            <div className="flex items-center gap-4">
              <p className="text-sm font-bold text-text-primary">Quantity</p>
              <div className="flex items-center bg-surface-1 border border-border-low rounded-xl overflow-hidden">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} className="w-10 h-10 flex items-center justify-center text-lg font-bold text-text-primary hover:bg-surface-2 transition-colors disabled:opacity-30">−</button>
                <span className="w-10 text-center text-sm font-bold text-text-primary select-none">{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(10, q + 1))} disabled={quantity >= 10} className="w-10 h-10 flex items-center justify-center text-lg font-bold text-text-primary hover:bg-surface-2 transition-colors disabled:opacity-30">+</button>
              </div>
            </div>

            <div className="hidden sm:flex gap-3 pt-1">
              <button
                disabled={sizes.length > 0 && !selectedSize}
                onClick={handleAddToBag} className={`flex-1 py-3.5 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${added ? "bg-success text-white" : "bg-primary text-on-primary hover:opacity-90 active:scale-[0.98]"}`}>
                {added ? <><Check size={16} /> Added to Bag</> : <><ShoppingBag size={16} /> Add to Bag</>}
              </button>
              <button onClick={() => {
                const userId = useAuthStore.getState().user?.id;
                toggleItem(
                  { id: product.id, name: product.name, brand: product.brand, price: product.price, originalPrice: product.originalPrice, image: images[0] ?? "" },
                  userId
                );
              }} className={`px-4 py-3.5 border-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${isWishlisted(product.id) ? "border-red-500 text-red-500 bg-red-500/10" : "border-border-low text-text-primary hover:border-primary/60"}`}>
                <Heart size={16} className={isWishlisted(product.id) ? "fill-red-500" : ""} />
                {isWishlisted(product.id) ? "Saved" : "Wishlist"}
              </button>
            </div>

            <div className="rounded-2xl border border-border-low overflow-hidden bg-surface-1 px-4">
              {product.description && (
                <Accordion title="Product Details" defaultOpen>
                  <p>{product.description}</p>
                </Accordion>
              )}
              <Accordion title="Delivery & Returns">
                <div className="space-y-2">
                  <p>🚀 Delivers in ~{product.store?.etaMin ?? 45} min from {product.store?.name ?? "store"}.</p>
                  <p>🆓 Free delivery on orders above ₹{(product.store?.freeDeliveryAbove ?? 999).toLocaleString("en-IN")}.</p>
                  <p>🔄 Easy <strong className="text-text-primary">6-hour returns</strong> — unworn, unwashed, original packaging.</p>
                </div>
              </Accordion>
              {product.store && (
                <Accordion title="Store Info">
                  <Link href={`/store/${product.store.slug}`} className="flex items-center gap-3 p-3 rounded-xl bg-background hover:bg-surface-2 transition-colors border border-border-low">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Store size={18} className="text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text-primary">{product.store.name}</p>
                      {product.store.rating > 0 && <p className="text-xs text-text-mute mt-0.5">★ {product.store.rating}</p>}
                    </div>
                    <ChevronDown size={14} className="text-text-mute -rotate-90 shrink-0" />
                  </Link>
                </Accordion>
              )}
            </div>

            {/* Reviews from DB */}
            {product.reviews?.length > 0 && (
              <section className="pb-4">
                <h2 className="font-display font-bold text-xl text-text-primary mb-4">Reviews</h2>
                <div className="flex flex-col gap-3">
                  {product.reviews.map((r: any) => (
                    <div key={r.id} className="bg-surface-1 rounded-2xl p-4 border border-border-low">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-primary/20 text-primary font-black text-sm flex items-center justify-center shrink-0">{r.user?.name?.[0] ?? "U"}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary leading-none">{r.user?.name ?? "User"}</p>
                          <p className="text-[11px] text-text-mute mt-0.5">{new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</p>
                        </div>
                        <StarRow rating={r.rating} size={12} />
                      </div>
                      {r.text && <p className="text-sm text-text-dim leading-relaxed">{r.text}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile sticky add to bag ── */}
      <div className="sm:hidden fixed bottom-16 inset-x-0 z-30 bg-background/97 backdrop-blur-xl border-t border-border-low">
        <div className="flex items-center gap-3 px-4 py-3 max-w-5xl mx-auto">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-text-mute truncate">{product.name}</p>
            <p className="text-base font-black text-primary leading-tight">
              ₹{product.price.toLocaleString("en-IN")}
            </p>
          </div>
          <button
            onClick={handleAddToBag}
            disabled={sizes.length > 0 && !selectedSize}
            className={`shrink-0 px-6 py-3 font-bold text-sm rounded-xl flex items-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
              added
                ? "bg-success text-white"
                : "bg-primary text-on-primary hover:opacity-90 active:scale-[0.97]"
            }`}
          >
            {!selectedSize && sizes.length > 0 ? "Select Size" : added ? <><Check size={15} /> Added</> : <><ShoppingBag size={15} /> Add to Bag</>}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
