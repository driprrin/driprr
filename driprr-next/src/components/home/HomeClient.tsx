"use client";

import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Loader2, Zap, ShieldCheck, Lock, Headphones, Heart } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocation } from "@/hooks/useLocation";
import parachutePants from "@/assets/parachute-pants.jpg";
import boxyHoodie from "@/assets/boxy-hoodie.jpg";
import aeroSneakers from "@/assets/aero-sneakers.jpg";
import utilityVest from "@/assets/utility-vest.jpg";
import storeVogue from "@/assets/store-vogue.jpg";
import storeDrip from "@/assets/store-drip.jpg";
import flashSaleBanner from "@/assets/flash_sale_banner.png";
import DriprrLogo from "@/components/DriprrLogo";
import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";
import { supabase } from "@/lib/supabase";

const categories = [
  { label: "Shirts",      slug: "top-wear",    img: storeVogue },
  { label: "T-Shirts",    slug: "top-wear",    img: boxyHoodie },
  { label: "Jackets",     slug: "top-wear",    img: utilityVest },
  { label: "Jeans",       slug: "bottom-wear", img: parachutePants },
  { label: "Sneakers",    slug: "foot-wear",   img: aeroSneakers },
  { label: "Stores",      slug: "stores",      img: storeDrip },
];

const storeImgFallbacks = [storeVogue, storeDrip];

function ProfileButton() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const href = mounted && isAuthenticated ? "/profile" : "/login";
  const initial = mounted && user?.name ? user.name[0].toUpperCase() : null;
  return (
    <Link href={href}
      className="w-8 h-8 rounded-full bg-surface-2 border border-border-low flex items-center justify-center text-text-dim hover:text-text-primary transition-colors overflow-hidden"
      title={mounted && isAuthenticated ? "My Profile" : "Login"}>
      {initial ? <span className="text-xs font-bold text-primary">{initial}</span>
               : <span className="material-symbols-outlined text-[20px]">person</span>}
    </Link>
  );
}

// 4-day countdown timer for DRIPRR10 coupon
const SALE_END = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000); // 4 days from first load

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    // Use a fixed end date stored in localStorage so it persists
    let endTime: number;
    const stored = localStorage.getItem("driprr10_end");
    if (stored) {
      endTime = parseInt(stored);
    } else {
      endTime = Date.now() + 4 * 24 * 60 * 60 * 1000;
      localStorage.setItem("driprr10_end", String(endTime));
    }

    function calc() {
      const diff = Math.max(0, endTime - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, mins, secs });
    }

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="mt-6 flex items-center gap-2">
      {[
        { val: timeLeft.days, label: "DAYS" },
        { val: timeLeft.hours, label: "HRS" },
        { val: timeLeft.mins, label: "MINS" },
        { val: timeLeft.secs, label: "SECS" },
      ].map((item, i) => (
        <div key={item.label} className="flex items-center gap-2">
          {i > 0 && <span className="text-xl font-bold text-[#FF4D2E] mb-5">:</span>}
          <div className="flex flex-col items-center">
            <div className="w-12 h-11 border border-[#FF4D2E]/30 rounded-xl flex items-center justify-center text-lg font-black text-[#FF4D2E] bg-black/40 backdrop-blur-sm transition-all">
              {pad(item.val)}
            </div>
            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1">{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomeClient() {
  const { activeCategory, setActiveCategory } = useUIStore();
  const { addItem } = useCartStore();
  const catScrollRef = useRef<HTMLDivElement>(null);
  const { location, detect } = useLocation();

  // Dynamic category images from DB
  const [catImages, setCatImages] = useState<Record<string, string>>({});

  // Real data from backend
  const [stores,   setStores]   = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingStores,   setLoadingStores]   = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => { detect(); }, [detect]);

  // Fetch category images from DB
  useEffect(() => {
    supabase.from("CategoryImage").select("label, imageUrl").then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((c: any) => { if (c.imageUrl) map[c.label] = c.imageUrl; });
        setCatImages(map);
      }
    });
  }, []);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

    // Fetch stores
    fetch(`${apiBase}/stores`, { signal: AbortSignal.timeout(3000) })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setStores(data))
      .catch(async () => {
        // Fallback to Supabase
        const { data } = await supabase.from("Store").select("*").eq("status", "active").eq("isOpen", true).order("rating", { ascending: false });
        setStores(data ?? []);
      })
      .finally(() => setLoadingStores(false));

    // Fetch products
    fetch(`${apiBase}/products`, { signal: AbortSignal.timeout(3000) })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setProducts(data))
      .catch(async () => {
        // Fallback to Supabase
        const { data } = await supabase.from("Product").select("*").eq("published", true).order("createdAt", { ascending: false }).limit(8);
        setProducts(data ?? []);
      })
      .finally(() => setLoadingProducts(false));
  }, []);

  function scrollCats(dir: "left" | "right") {
    const el = catScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 220 : -220, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24">
      {/* Centered max-width wrapper for PC */}
      <div className="max-w-6xl mx-auto">
      
      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center justify-between border-b border-border-low bg-surface-1/40 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center">
            <DriprrLogo height={32} />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-text-dim">
            <Link href="/" className="text-text-primary hover:text-primary transition-colors border-b-2 border-primary pb-1">Home</Link>
            <Link href="/stores" className="hover:text-primary transition-colors pb-1">Stores</Link>
            <Link href="/categories" className="hover:text-primary transition-colors pb-1">Categories</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={detect}
            disabled={location.status === "loading"}
            title={location.status === "error" ? location.message : "Detect my location"}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-1 border border-border-low rounded-full text-xs font-medium transition-all hover:border-primary/50 disabled:opacity-70 max-w-[200px]"
          >
            {location.status === "loading" ? (
              <>
                <Loader2 size={14} className="text-primary animate-spin shrink-0" />
                <span className="text-text-dim">Detecting…</span>
              </>
            ) : location.status === "error" ? (
              <>
                <MapPin size={14} className="text-red-400 shrink-0" />
                <span className="text-red-400 truncate">Retry location</span>
              </>
            ) : location.status === "success" ? (
              <>
                <MapPin size={14} className="text-primary shrink-0" />
                <span className="truncate">{location.display}</span>
              </>
            ) : (
              <>
                <MapPin size={14} className="text-primary shrink-0" />
                <span className="text-text-dim">Hubli, Karnataka</span>
                <span className="material-symbols-outlined text-[14px] text-text-dim ml-0.5">expand_more</span>
              </>
            )}
          </button>
          
          <ThemeToggle />

          <ProfileButton />
        </div>
      </header>

      {/* Categories — Grid layout */}
      <div className="px-5 pt-6">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {categories.map((c) => (
            <Link
              key={c.label}
              href={c.slug === "stores" ? "/stores" : `/category/${c.slug}`}
              onClick={() => setActiveCategory(c.label)}
              className="flex flex-col group"
            >
              <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-2 group-hover:text-text-primary transition-colors">
                {c.label}
              </p>
              <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-1 border border-border-low group-hover:border-primary/40 transition-all">
                {catImages[c.label] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={catImages[c.label]} alt={c.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <Image
                    src={c.img}
                    alt={c.label}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
                  />
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Flash sale banner - DRIPRR10 */}
      <div className="px-5 pt-5">
        <div className="relative bg-black rounded-3xl overflow-hidden min-h-[340px] md:min-h-[400px] flex items-center shadow-xl border border-neutral-900">
          {/* Background image */}
          <div className="absolute inset-0 z-0">
            <Image
              src={flashSaleBanner}
              alt="DRIPRR10 - 10% Off"
              fill
              className="object-cover object-right md:object-center opacity-90"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
          </div>

          {/* Left Content */}
          <div className="relative z-10 max-w-md px-8 md:px-12 py-8 flex flex-col justify-center text-left">
            <div>
              <span className="inline-block px-3 py-1 bg-transparent border border-[#FF4D2E] text-[#FF4D2E] rounded-full text-[10px] font-extrabold tracking-wider uppercase animate-pulse">
                LIMITED TIME OFFER
              </span>
            </div>
            <h2 className="mt-4 font-display font-black text-white text-3xl md:text-4xl leading-tight">
              USE CODE
              <br />
              <span className="text-[#FF4D2E] text-4xl md:text-5xl">DRIPRR10</span>
            </h2>
            <p className="mt-2 text-sm text-neutral-400">Get <span className="text-white font-bold">10% OFF</span> on your first order. Limited time only!</p>
            
            {/* Real countdown timer */}
            <CountdownTimer />

            <Link href="/stores" className="mt-6 self-start px-6 py-3 bg-white text-black font-bold text-xs uppercase rounded-xl flex items-center gap-2 hover:bg-neutral-100 active:scale-[0.98] transition-all shadow-lg">
              <span>SHOP NOW</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          {/* Dots Indicator */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            <span className="h-1.5 w-6 rounded-full bg-[#FF4D2E] transition-all" />
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-600" />
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-600" />
          </div>
        </div>
      </div>

      {/* Nearby stores */}
      <section className="pt-8">
        <div className="px-5 flex items-baseline justify-between">
          <h2 className="font-display font-black text-xl flex items-center gap-2">
            Nearby stores{" "}
            <span className="flex items-center gap-1.5 text-success font-bold text-sm">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              open now
            </span>
          </h2>
          <Link href="/stores" className="text-[#FF4D2E] text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:underline">
            VIEW ALL
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 px-5">
          {loadingStores ? (
            <div className="col-span-5 flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : stores.length === 0 ? (
            <div className="col-span-5 text-center py-8 text-text-mute text-sm">No stores open nearby yet.</div>
          ) : stores.map((s, idx) => (
            <Link
              key={s.id}
              href={`/store/${s.slug}`}
              className="bg-surface-1 border border-border-low rounded-2xl overflow-hidden cursor-pointer group hover:scale-[1.02] transition-all duration-200 shadow-sm"
            >
              <div className="relative h-44 overflow-hidden">
                <Image
                  src={s.coverUrl || storeImgFallbacks[idx % storeImgFallbacks.length]}
                  alt={s.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  unoptimized={!!s.coverUrl}
                />
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  className="absolute top-2.5 right-2.5 w-7 h-7 bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors">
                  <Heart size={14} className="stroke-[2.5]" />
                </button>
                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2.5 py-1 bg-white text-black text-[9px] font-black uppercase rounded-lg shadow-sm">
                    {s.deliveryFee === 0 ? "Free Delivery" : `₹${s.deliveryFee} delivery`}
                  </span>
                </div>
                {s.rating > 0 && (
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 text-white">
                    <span className="text-[#FFC94A] text-[10px]">★</span>
                    <span className="text-[10px] font-bold">{s.rating}</span>
                    <span className="text-[9px] text-neutral-300">({s.reviewCount})</span>
                  </div>
                )}
              </div>
              <div className="px-3 py-3 text-left">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="font-display font-bold text-sm leading-snug truncate">{s.name}</h3>
                  <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider ${s.isOpen ? "text-success" : "text-text-mute"}`}>
                    {s.isOpen ? "Open" : "Closed"}
                  </span>
                </div>
                <p className="text-[10px] text-text-mute mt-0.5">{s.city}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Products */}
      <section className="pt-8 px-5">
        <h2 className="font-display font-bold text-2xl">Trending near you</h2>
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {loadingProducts ? (
            <div className="col-span-4 flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-4 text-center py-8 text-text-mute text-sm">No products available yet.</div>
          ) : products.map((p) => {
            const discount = p.originalPrice > p.price
              ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
              : 0;
            return (
            <Link key={p.id} href={`/product/${p.id}`}>
            <article className="bg-surface-1 rounded-2xl overflow-hidden cursor-pointer group hover:scale-[1.02] transition-transform duration-200">
              <div className="relative aspect-[4/3] bg-surface-2">
                {p.imageUrls?.[0] && (
                  <Image src={p.imageUrls[0]} alt={p.name} fill className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" unoptimized />
                )}
                {discount > 0 && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/65 to-transparent px-3 pt-2.5 pb-6">
                    <span className="text-white text-[11px] font-bold leading-tight drop-shadow">{discount}% OFF</span>
                  </div>
                )}
              </div>
              <div className="px-3 py-3 text-left">
                <p className="text-[10px] tracking-[0.12em] text-text-mute font-semibold uppercase">{p.brand}</p>
                <h3 className="text-sm font-medium leading-snug mt-0.5 line-clamp-1">{p.name}</h3>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-primary font-bold text-sm">₹{p.price.toLocaleString("en-IN")}</span>
                  {p.originalPrice > p.price && (
                    <span className="text-text-mute text-xs line-through">₹{p.originalPrice.toLocaleString("en-IN")}</span>
                  )}
                  {discount > 0 && (
                    <span className="text-success text-[10px] font-semibold ml-auto">{discount}% OFF</span>
                  )}
                </div>
              </div>
            </article>
            </Link>
            );
          })}
        </div>
      </section>

      {/* Trust USP Bar */}
      <section className="mt-12 mb-6 border-t border-border-low pt-8 pb-4">
        <div className="px-5 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            {
              icon: Zap,
              title: "30–60 Min Delivery",
              desc: "Lightning fast delivery from nearby stores.",
            },
            {
              icon: ShieldCheck,
              title: "100% Authentic",
              desc: "Original products from trusted local stores.",
            },
            {
              icon: Lock,
              title: "Secure Payments",
              desc: "Multiple secure payment options available.",
            },
            {
              icon: Headphones,
              title: "24/7 Support",
              desc: "We're here to help you anytime.",
            },
          ].map((usp, i) => (
            <div key={i} className="flex flex-col items-center md:items-start text-center md:text-left gap-2 max-w-[200px] mx-auto md:mx-0">
              <div className="w-10 h-10 rounded-2xl bg-surface-2 border border-border-low flex items-center justify-center text-primary">
                <usp.icon size={18} className="stroke-[2.5]" />
              </div>
              <h4 className="text-xs font-black uppercase tracking-wider mt-1">{usp.title}</h4>
              <p className="text-[10px] text-text-mute leading-relaxed">{usp.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <BottomNav />
      </div>
    </div>
  );
}
