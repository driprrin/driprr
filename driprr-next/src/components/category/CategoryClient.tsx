"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Heart, SlidersHorizontal, X, Check, PackageOpen } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";

// ── Label map ────────────────────────────────────────────────────────────────
const slugLabels: Record<string, string> = {
  "top-wear": "Top Wear",
  "bottom-wear": "Bottom Wear",
  "foot-wear": "Foot Wear",
  "new-drops": "New Drops",
  "stores": "Stores",
};

// ── Product type ──────────────────────────────────────────────────────────────
type ProductType = { id: string; brand: string; name: string; price: number; originalPrice: number; img: any; badge: string | null; category: string; rating: number; isNew: boolean };

// ── Product data ──────────────────────────────────────────────────────────────
const allProducts: ProductType[] = [];

type SortKey = "popularity" | "price-asc" | "price-desc" | "newest" | "discount";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "popularity", label: "Popularity" },
  { key: "price-asc",  label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "newest",     label: "Newest First" },
  { key: "discount",   label: "Highest Discount" },
];

const BRANDS = ["NIGHTHAWK", "VOID CORE", "DRIFT SHOES", "TACTIC"];
const PRICE_RANGES = [
  { label: "Under ₹2,000",         min: 0,    max: 2000  },
  { label: "₹2,000 – ₹4,000",     min: 2000, max: 4000  },
  { label: "₹4,000 – ₹6,000",     min: 4000, max: 6000  },
  { label: "Above ₹6,000",         min: 6000, max: Infinity },
];

// ── Filter Drawer ─────────────────────────────────────────────────────────────
interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  activeSort: SortKey;
  onSortChange: (k: SortKey) => void;
  selectedBrands: string[];
  onBrandToggle: (b: string) => void;
  selectedPriceRange: number | null;
  onPriceRangeSelect: (i: number | null) => void;
  minRating: number | null;
  onRatingSelect: (r: number | null) => void;
  onReset: () => void;
  resultCount: number;
}

function FilterDrawer({
  open, onClose, activeSort, onSortChange,
  selectedBrands, onBrandToggle,
  selectedPriceRange, onPriceRangeSelect,
  minRating, onRatingSelect,
  onReset, resultCount,
}: FilterDrawerProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-surface-1 rounded-t-3xl animate-slide-up max-h-[88vh] overflow-y-auto">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border-low" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-low sticky top-0 bg-surface-1 z-10">
          <h2 className="font-display font-black text-lg">Sort & Filter</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 hover:bg-border-low transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pb-32 space-y-7 pt-5">
          {/* Sort by */}
          <section>
            <p className="text-[11px] font-black tracking-widest text-text-mute uppercase mb-3">Sort By</p>
            <div className="flex flex-col gap-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => onSortChange(opt.key)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold ${
                    activeSort === opt.key
                      ? "border-primary bg-primary/8 text-primary"
                      : "border-border-low bg-surface-2 text-text-primary hover:border-text-mute"
                  }`}
                >
                  <span>{opt.label}</span>
                  {activeSort === opt.key && (
                    <Check size={15} className="text-primary" />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Brand */}
          <section>
            <p className="text-[11px] font-black tracking-widest text-text-mute uppercase mb-3">Brand</p>
            <div className="flex flex-wrap gap-2">
              {BRANDS.map((b) => {
                const active = selectedBrands.includes(b);
                return (
                  <button
                    key={b}
                    onClick={() => onBrandToggle(b)}
                    className={`px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all ${
                      active
                        ? "border-primary bg-primary text-on-primary"
                        : "border-border-low bg-surface-2 text-text-dim hover:border-text-mute"
                    }`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Price Range */}
          <section>
            <p className="text-[11px] font-black tracking-widest text-text-mute uppercase mb-3">Price Range</p>
            <div className="flex flex-col gap-2">
              {PRICE_RANGES.map((range, i) => {
                const active = selectedPriceRange === i;
                return (
                  <button
                    key={i}
                    onClick={() => onPriceRangeSelect(active ? null : i)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold ${
                      active
                        ? "border-primary bg-primary/8 text-primary"
                        : "border-border-low bg-surface-2 text-text-primary hover:border-text-mute"
                    }`}
                  >
                    <span>{range.label}</span>
                    {active && <Check size={15} className="text-primary" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Min Rating */}
          <section>
            <p className="text-[11px] font-black tracking-widest text-text-mute uppercase mb-3">Min Rating</p>
            <div className="flex gap-2">
              {[4, 3, 2].map((r) => {
                const active = minRating === r;
                return (
                  <button
                    key={r}
                    onClick={() => onRatingSelect(active ? null : r)}
                    className={`flex items-center gap-1 px-4 py-2 rounded-full border-2 text-xs font-bold transition-all ${
                      active
                        ? "border-primary bg-primary text-on-primary"
                        : "border-border-low bg-surface-2 text-text-dim hover:border-text-mute"
                    }`}
                  >
                    <span className="text-[#FFC94A]">★</span>
                    {r}+
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Sticky footer */}
        <div className="fixed bottom-0 inset-x-0 z-50 bg-surface-1 border-t border-border-low px-5 py-4 flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 py-3 border-2 border-border-low bg-surface-2 text-text-primary font-bold rounded-2xl text-sm hover:border-text-mute transition-colors"
          >
            Reset All
          </button>
          <button
            onClick={onClose}
            className="flex-[2] py-3 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity"
          >
            Show {resultCount} Products
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CategoryClient({ slug }: { slug: string }) {
  const label = slugLabels[slug] ?? slug.replace(/-/g, " ");
  const city = "Hubli-Dharwad";
  const { addItem } = useCartStore();
  const { toggleItem, isWishlisted } = useWishlistStore();

  // SEO intro copy per category
  const introMap: Record<string, string> = {
    "top-wear": `Shop t-shirts, shirts, hoodies and jackets from local stores across ${city}, delivered to your door in 30-90 minutes. Every item ships from a nearby store — not a warehouse — so what you see is what's actually in stock near you.`,
    "bottom-wear": `Jeans, joggers, trousers and shorts from local stores across ${city} — delivered in 30-90 minutes, no need to visit multiple shops.`,
    "foot-wear": `Sneakers, shoes and sandals from trusted local stores in ${city}, delivered fast — track your rider in real time from store to door.`,
  };
  const introText = introMap[slug] ?? "";

  // Filter state
  const [drawerOpen, setDrawerOpen]         = useState(false);
  const [activeSort, setActiveSort]         = useState<SortKey>("popularity");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [minRating, setMinRating]           = useState<number | null>(null);
  const [apiProducts, setApiProducts]       = useState<typeof allProducts>([]);

  // Track wishlist mounted state to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Category-filtered base — fetch from backend
  const categoryProducts = useMemo(() => {
    if (slug === "new-drops") return allProducts.filter((p) => p.isNew);
    if (slug === "stores") return [];
    return allProducts.filter((p) => p.category === slug);
  }, [slug]);

  // Fetch from Supabase directly on mount
  useEffect(() => {
    async function fetchProducts() {
      const { supabase } = await import("@/lib/supabase");
      let query = supabase.from("Product").select("*").eq("published", true);

      if (slug !== "new-drops" && slug !== "stores") {
        // Map slug to category name: "top-wear" → "Top Wear"
        const categoryName = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        query = query.eq("category", categoryName);
      }

      const { data } = await query.order("createdAt", { ascending: false });

      if (data && data.length > 0) {
        const mapped = data.map((p: any) => ({
          id:            p.id,
          brand:         p.brand ?? "",
          name:          p.name,
          price:         p.price,
          originalPrice: p.originalPrice,
          img:           { src: p.imageUrls?.[0] ?? "" },
          badge:         p.badge ?? null,
          category:      p.category,
          rating:        p.rating ?? 0,
          isNew:         false,
        }));
        setApiProducts(mapped);
      }
    }
    fetchProducts();
  }, [slug]);

  // Apply brand / price / rating filters
  const filtered = useMemo(() => {
    // Use real API data if available, otherwise fall back to static allProducts
    const base = apiProducts.length > 0 ? apiProducts : categoryProducts;
    let list = [...base];

    if (selectedBrands.length > 0) {
      list = list.filter((p) => selectedBrands.includes(p.brand));
    }
    if (selectedPriceRange !== null) {
      const range = PRICE_RANGES[selectedPriceRange];
      list = list.filter((p) => p.price >= range.min && p.price < range.max);
    }
    if (minRating !== null) {
      list = list.filter((p) => p.rating >= minRating);
    }

    // Sort
    switch (activeSort) {
      case "price-asc":  list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "newest":     list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
      case "discount":
        list.sort((a, b) =>
          (b.originalPrice - b.price) / b.originalPrice -
          (a.originalPrice - a.price) / a.originalPrice
        );
        break;
      default: break; // popularity — keep order
    }

    return list;
  }, [apiProducts, categoryProducts, selectedBrands, selectedPriceRange, minRating, activeSort]);

  // Count active filters for badge
  const activeFilterCount =
    selectedBrands.length +
    (selectedPriceRange !== null ? 1 : 0) +
    (minRating !== null ? 1 : 0);

  const handleBrandToggle = useCallback((b: string) => {
    setSelectedBrands((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  }, []);

  const handleReset = useCallback(() => {
    setSelectedBrands([]);
    setSelectedPriceRange(null);
    setMinRating(null);
    setActiveSort("popularity");
  }, []);

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border-low px-4 py-3 flex items-center gap-3">
          <Link href="/categories" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-1 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex-1">
            <p className="text-[11px] text-text-mute">
              Home &rsaquo; Categories &rsaquo; {label}
            </p>
            <h1 className="font-display font-bold text-lg leading-tight">{label}</h1>
          </div>
        </header>

        {/* SEO intro text */}
        {introText && (
          <p className="px-4 pt-4 text-sm text-text-dim leading-relaxed">{introText}</p>
        )}

        {/* Result count + filter button */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <p className="text-sm text-text-mute">
            Showing <span className="text-text-primary font-semibold">{filtered.length}</span> products
          </p>
          <button
            onClick={() => setDrawerOpen(true)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              activeFilterCount > 0
                ? "bg-primary text-on-primary border-primary"
                : "bg-surface-1 border-border-low text-text-dim hover:border-primary/50"
            }`}
          >
            <SlidersHorizontal size={13} />
            Sort & Filter
            {activeFilterCount > 0 && (
              <span className="ml-0.5 bg-on-primary/20 text-on-primary text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Sort chips — horizontal scroll */}
        <div className="flex gap-2 px-4 pb-4 overflow-x-auto no-scrollbar">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setActiveSort(opt.key)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                activeSort === opt.key
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface-1 border-border-low text-text-dim hover:border-text-mute"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Active filter chips */}
        {(selectedBrands.length > 0 || selectedPriceRange !== null || minRating !== null) && (
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
            {selectedBrands.map((b) => (
              <button
                key={b}
                onClick={() => handleBrandToggle(b)}
                className="shrink-0 flex items-center gap-1 px-3 py-1 bg-primary/10 border border-primary/30 text-primary rounded-full text-xs font-bold hover:bg-primary/20 transition-colors"
              >
                {b}
                <X size={11} />
              </button>
            ))}
            {selectedPriceRange !== null && (
              <button
                onClick={() => setSelectedPriceRange(null)}
                className="shrink-0 flex items-center gap-1 px-3 py-1 bg-primary/10 border border-primary/30 text-primary rounded-full text-xs font-bold hover:bg-primary/20 transition-colors"
              >
                {PRICE_RANGES[selectedPriceRange].label}
                <X size={11} />
              </button>
            )}
            {minRating !== null && (
              <button
                onClick={() => setMinRating(null)}
                className="shrink-0 flex items-center gap-1 px-3 py-1 bg-primary/10 border border-primary/30 text-primary rounded-full text-xs font-bold hover:bg-primary/20 transition-colors"
              >
                <span className="text-[#FFC94A]">★</span>{minRating}+ only
                <X size={11} />
              </button>
            )}
            <button
              onClick={handleReset}
              className="shrink-0 px-3 py-1 bg-surface-2 border border-border-low text-text-mute rounded-full text-xs font-medium hover:text-text-primary transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-surface-1 border border-border-low flex items-center justify-center text-text-mute">
              <PackageOpen size={28} />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Coming Soon</h2>
              <p className="text-text-mute text-sm mt-1">
                {activeFilterCount > 0
                  ? "Try adjusting your filters."
                  : `New ${label} drops are landing in ${city} soon. Check back shortly or explore other categories in the meantime.`}
              </p>
            </div>
            {activeFilterCount > 0 ? (
              <button
                onClick={handleReset}
                className="px-5 py-2.5 bg-primary text-on-primary font-bold rounded-2xl text-sm"
              >
                Clear Filters
              </button>
            ) : (
              <div className="flex gap-2">
                {slug !== "top-wear" && <Link href="/category/top-wear" className="px-4 py-2 bg-surface-1 border border-border-low rounded-xl text-xs font-bold">Top Wear</Link>}
                {slug !== "bottom-wear" && <Link href="/category/bottom-wear" className="px-4 py-2 bg-surface-1 border border-border-low rounded-xl text-xs font-bold">Bottom Wear</Link>}
                {slug !== "foot-wear" && <Link href="/category/foot-wear" className="px-4 py-2 bg-surface-1 border border-border-low rounded-xl text-xs font-bold">Foot Wear</Link>}
              </div>
            )}
          </div>
        ) : (
          /* Product grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-border-low">
            {filtered.map((p) => {
              const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
              const wishlisted = mounted && isWishlisted(p.id);
              return (
                <Link key={p.id} href={`/product/${p.id}`}>
                  <article className="bg-background flex flex-col group cursor-pointer">
                    {/* Image */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-surface-1">
                      <Image
                        src={typeof p.img === "string" ? p.img : p.img?.src ?? ""}
                        alt={p.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        unoptimized
                      />
                      {/* Wishlist */}
                      <button
                        aria-label="Wishlist"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleItem({
                            id: p.id,
                            name: p.name,
                            brand: p.brand,
                            price: p.price,
                            originalPrice: p.originalPrice,
                            image: (typeof p.img === "string" ? p.img : p.img?.src ?? ""),
                          });
                        }}
                        className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-full bg-background/70 backdrop-blur-sm hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Heart
                          size={13}
                          className={wishlisted ? "fill-red-500 text-red-500" : ""}
                        />
                      </button>
                      {/* Badge */}
                      {p.badge && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-success text-white text-[10px] font-bold rounded">
                          {p.badge}
                        </span>
                      )}
                      {/* Discount pill */}
                      <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-primary text-on-primary text-[10px] font-bold rounded-lg">
                        {discount}% OFF
                      </span>
                    </div>

                    {/* Info */}
                    <div className="p-3 flex-1 flex flex-col gap-1">
                      <p className="text-[10px] text-text-mute font-semibold tracking-widest uppercase">
                        {p.brand}
                      </p>
                      <p className="text-sm text-text-primary leading-snug line-clamp-2">{p.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[#FFC94A] text-[11px]">★</span>
                        <span className="text-[11px] text-text-mute">{p.rating}</span>
                      </div>
                      <div className="mt-auto pt-1.5 flex items-baseline gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-text-primary">
                          ₹{p.price.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-text-mute line-through">
                          ₹{p.originalPrice.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs font-semibold text-success">{discount}% off</span>
                      </div>
                      {/* Add to bag */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.dispatchEvent(
                            new CustomEvent("add-to-cart-animate", {
                              detail: { x: e.clientX, y: e.clientY, image: (typeof p.img === "string" ? p.img : p.img?.src ?? "") },
                            })
                          );
                          addItem({
                            id: p.id,
                            name: p.name,
                            brand: p.brand,
                            price: p.price,
                            image: (typeof p.img === "string" ? p.img : p.img?.src ?? ""),
                          });
                        }}
                        className="mt-2 w-full py-1.5 rounded-lg bg-surface-1 border border-border-low text-xs font-semibold hover:bg-primary hover:text-on-primary hover:border-primary transition-colors"
                      >
                        Add to bag
                      </button>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Sort & Filter Drawer */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeSort={activeSort}
        onSortChange={(k) => { setActiveSort(k); }}
        selectedBrands={selectedBrands}
        onBrandToggle={handleBrandToggle}
        selectedPriceRange={selectedPriceRange}
        onPriceRangeSelect={setSelectedPriceRange}
        minRating={minRating}
        onRatingSelect={setMinRating}
        onReset={handleReset}
        resultCount={filtered.length}
      />

      <BottomNav />
    </div>
  );
}
