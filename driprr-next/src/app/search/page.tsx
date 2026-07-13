"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search as SearchIcon, ArrowLeft, Store, SlidersHorizontal,
  MapPin, Sparkles, X, Check, PackageOpen, Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const CATEGORIES = ["Top Wear", "Bottom Wear", "Foot Wear"];
const BRANDS     = ["NIGHTHAWK", "VOID CORE", "DRIFT SHOES", "TACTIC"];
const PRICE_RANGES = [
  { label: "Under ₹2,000",     min: 0,    max: 2000     },
  { label: "₹2,000 – ₹4,000", min: 2000, max: 4000     },
  { label: "₹4,000 – ₹6,000", min: 4000, max: 6000     },
  { label: "Above ₹6,000",    min: 6000, max: Infinity  },
];

// ── Filter Drawer ─────────────────────────────────────────────────────────────
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  // product filters
  selectedCategories: string[];
  onCategoryToggle: (c: string) => void;
  selectedBrands: string[];
  onBrandToggle: (b: string) => void;
  selectedPriceRange: number | null;
  onPriceRangeSelect: (i: number | null) => void;
  minRating: number | null;
  onRatingSelect: (r: number | null) => void;
  // show stores toggle
  showStores: boolean;
  onShowStoresToggle: () => void;
  showProducts: boolean;
  onShowProductsToggle: () => void;
  onReset: () => void;
  resultCount: number;
}

function FilterDrawer({
  open, onClose,
  selectedCategories, onCategoryToggle,
  selectedBrands, onBrandToggle,
  selectedPriceRange, onPriceRangeSelect,
  minRating, onRatingSelect,
  showStores, onShowStoresToggle,
  showProducts, onShowProductsToggle,
  onReset, resultCount,
}: DrawerProps) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in" onClick={onClose} />
      <div className="fixed bottom-0 inset-x-0 z-50 bg-surface-1 rounded-t-3xl animate-slide-up max-h-[90vh] flex flex-col">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">run
          <div className="w-10 h-1 rounded-full bg-border-low" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-low shrink-0">
          <h2 className="font-display font-black text-lg">Filters</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 hover:bg-border-low transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-7">

          {/* Show types */}
          <section>
            <p className="text-[11px] font-black tracking-widest text-text-mute uppercase mb-3">Show Results</p>
            <div className="flex gap-3">
              <button
                onClick={onShowProductsToggle}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                  showProducts ? "border-primary bg-primary/8 text-primary" : "border-border-low bg-surface-2 text-text-dim"
                }`}
              >
                <Sparkles size={14} />
                Products
                {showProducts && <Check size={13} />}
              </button>
              <button
                onClick={onShowStoresToggle}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                  showStores ? "border-primary bg-primary/8 text-primary" : "border-border-low bg-surface-2 text-text-dim"
                }`}
              >
                <Store size={14} />
                Stores
                {showStores && <Check size={13} />}
              </button>
            </div>
          </section>

          {/* Category */}
          {showProducts && (
            <section>
              <p className="text-[11px] font-black tracking-widest text-text-mute uppercase mb-3">Category</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const active = selectedCategories.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => onCategoryToggle(c)}
                      className={`px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all ${
                        active
                          ? "border-primary bg-primary text-on-primary"
                          : "border-border-low bg-surface-2 text-text-dim hover:border-text-mute"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Brand */}
          {showProducts && (
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
          )}

          {/* Price Range */}
          {showProducts && (
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
                      {active && <Check size={14} className="text-primary" />}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Rating */}
          {showProducts && (
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
                      <span className="text-[#FFC94A]">★</span>{r}+
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border-low px-5 py-4 flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 py-3 border-2 border-border-low bg-surface-2 text-text-primary font-bold rounded-2xl text-sm hover:border-text-mute transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="flex-[2] py-3 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity"
          >
            Show {resultCount} Results
          </button>
        </div>
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const [query, setQuery]               = useState("");
  const [drawerOpen, setDrawerOpen]     = useState(false);

  // Real data from Supabase
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allStores,   setAllStores]   = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [prodRes, storeRes] = await Promise.all([
        supabase.from("Product").select("*").eq("published", true).order("createdAt", { ascending: false }),
        supabase.from("Store").select("*").eq("status", "active").order("rating", { ascending: false }),
      ]);
      setAllProducts((prodRes.data ?? []).map((p: any) => ({
        id: p.id, brand: p.brand ?? "", name: p.name, price: p.price,
        originalPrice: p.originalPrice, img: p.imageUrls?.[0] ?? "", category: p.category, rating: p.rating ?? 0,
      })));
      setAllStores((storeRes.data ?? []).map((s: any) => ({
        name: s.name, slug: s.slug, location: s.city ?? s.location ?? "", rating: s.rating ?? 0, img: s.coverUrl ?? "",
      })));
      setLoadingData(false);
    }
    fetchData();
  }, []);

  // filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands]         = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [minRating, setMinRating]                   = useState<number | null>(null);
  const [showStores, setShowStores]                 = useState(true);
  const [showProducts, setShowProducts]             = useState(true);

  // text search
  const textFiltered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const products = q
      ? allProducts.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        )
      : allProducts;

    const stores = q
      ? allStores.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.location.toLowerCase().includes(q)
        )
      : allStores;

    return { products, stores };
  }, [query, allProducts, allStores]);

  // apply drawer filters on top
  const filteredProducts = useMemo(() => {
    if (!showProducts) return [];
    let list = textFiltered.products;
    if (selectedCategories.length > 0) {
      list = list.filter((p) => selectedCategories.includes(p.category));
    }
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
    return list;
  }, [textFiltered.products, showProducts, selectedCategories, selectedBrands, selectedPriceRange, minRating]);

  const filteredStores = useMemo(
    () => (showStores ? textFiltered.stores : []),
    [textFiltered.stores, showStores]
  );

  const activeFilterCount =
    selectedCategories.length +
    selectedBrands.length +
    (selectedPriceRange !== null ? 1 : 0) +
    (minRating !== null ? 1 : 0) +
    (!showStores ? 1 : 0) +
    (!showProducts ? 1 : 0);

  const totalResults = filteredProducts.length + filteredStores.length;

  function handleReset() {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedPriceRange(null);
    setMinRating(null);
    setShowStores(true);
    setShowProducts(true);
  }

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Top Search Header */}
      <header className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-border-low bg-surface-1/40 backdrop-blur-md sticky top-0 z-30">
        <Link
          href="/"
          className="w-10 h-10 bg-surface-2 border border-border-low rounded-2xl flex items-center justify-center text-text-dim hover:text-text-primary transition-all shrink-0"
        >
          <ArrowLeft size={18} />
        </Link>

        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim">
            <SearchIcon size={18} />
          </span>
          <input
            type="text"
            placeholder="Search stores, brands, garments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-surface-2 border border-border-low rounded-2xl text-sm text-text-primary placeholder-text-mute focus:outline-none focus:border-primary/50 transition-colors"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-mute hover:text-text-primary"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={`relative w-10 h-10 border rounded-2xl flex items-center justify-center transition-all shrink-0 ${
            activeFilterCount > 0
              ? "bg-primary border-primary text-on-primary"
              : "bg-surface-2 border-border-low text-text-dim hover:text-text-primary"
          }`}
        >
          <SlidersHorizontal size={18} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary border-2 border-background rounded-full text-[9px] font-black text-on-primary flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </header>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex gap-2 px-4 py-2.5 overflow-x-auto no-scrollbar border-b border-border-low bg-background">
          {selectedCategories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategories((prev) => prev.filter((x) => x !== c))}
              className="shrink-0 flex items-center gap-1 px-3 py-1 bg-primary/10 border border-primary/30 text-primary rounded-full text-xs font-bold"
            >
              {c} <X size={11} />
            </button>
          ))}
          {selectedBrands.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBrands((prev) => prev.filter((x) => x !== b))}
              className="shrink-0 flex items-center gap-1 px-3 py-1 bg-primary/10 border border-primary/30 text-primary rounded-full text-xs font-bold"
            >
              {b} <X size={11} />
            </button>
          ))}
          {selectedPriceRange !== null && (
            <button
              onClick={() => setSelectedPriceRange(null)}
              className="shrink-0 flex items-center gap-1 px-3 py-1 bg-primary/10 border border-primary/30 text-primary rounded-full text-xs font-bold"
            >
              {PRICE_RANGES[selectedPriceRange].label} <X size={11} />
            </button>
          )}
          {minRating !== null && (
            <button
              onClick={() => setMinRating(null)}
              className="shrink-0 flex items-center gap-1 px-3 py-1 bg-primary/10 border border-primary/30 text-primary rounded-full text-xs font-bold"
            >
              <span className="text-[#FFC94A]">★</span>{minRating}+ <X size={11} />
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

      <main className="max-w-4xl mx-auto px-4 pt-6 relative z-10">
        {/* No results */}
        {totalResults === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center max-w-sm mx-auto gap-4">
            <div className="w-16 h-16 rounded-3xl bg-surface-2 border border-border-low flex items-center justify-center text-text-dim">
              <PackageOpen size={28} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase">No results found</h2>
              <p className="text-text-dim text-xs mt-1.5 leading-relaxed">
                {query
                  ? `No results for "${query}". Try a different search.`
                  : "Try adjusting your filters."}
              </p>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={handleReset}
                className="px-5 py-2.5 bg-primary text-on-primary font-bold rounded-2xl text-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {/* Stores */}
            {filteredStores.length > 0 && (
              <section>
                <h2 className="font-display font-black text-sm uppercase tracking-wider text-text-dim mb-4 flex items-center gap-1.5">
                  <Store size={14} className="text-primary" />
                  Stores ({filteredStores.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredStores.map((s, idx) => {
                    return (
                      <Link
                        key={s.name}
                        href={`/store/${s.slug}`}
                        className="bg-surface-1 border border-border-low rounded-2xl p-4 flex items-center gap-4 hover:border-primary/40 transition-colors shadow-sm"
                      >
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-surface-2">
                          {s.img && <Image src={s.img} alt={s.name} fill className="object-cover" unoptimized />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-sm truncate">{s.name}</h3>
                          <p className="text-text-dim text-xs mt-0.5 flex items-center gap-1 truncate">
                            <MapPin size={10} className="text-primary shrink-0" />
                            {s.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0 bg-surface-2 px-2 py-0.5 rounded-lg text-xs font-bold">
                          <span className="text-[#FFC94A]">★</span>
                          <span>{s.rating}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Products */}
            {filteredProducts.length > 0 && (
              <section>
                <h2 className="font-display font-black text-sm uppercase tracking-wider text-text-dim mb-4 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-primary" />
                  Products ({filteredProducts.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredProducts.map((p) => {
                    const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
                    return (
                      <Link
                        key={p.id}
                        href={`/product/${p.id}`}
                        className="bg-surface-1 border border-border-low rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform shadow-sm flex flex-col"
                      >
                        <div className="relative aspect-[4/3] w-full bg-surface-2">
                          {p.img && <Image src={p.img} alt={p.name} fill className="object-cover" unoptimized />}
                          <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-primary text-on-primary text-[10px] font-bold rounded-lg">
                            {discount}% OFF
                          </span>
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <p className="text-[9px] tracking-[0.1em] text-text-mute font-semibold uppercase">{p.brand}</p>
                            <h3 className="text-xs font-medium leading-snug mt-0.5 line-clamp-2">{p.name}</h3>
                            <p className="text-[10px] text-text-mute mt-0.5">{p.category}</p>
                          </div>
                          <div className="mt-2 pt-2 border-t border-border-low flex items-center justify-between">
                            <div>
                              <span className="text-primary font-bold text-xs">₹{p.price.toLocaleString("en-IN")}</span>
                              <span className="text-text-mute text-[10px] line-through ml-1">₹{p.originalPrice.toLocaleString("en-IN")}</span>
                            </div>
                            <span className="text-[10px] text-text-dim flex items-center gap-0.5">
                              <span className="text-[#FFC94A]">★</span>{p.rating}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Filter Drawer */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedCategories={selectedCategories}
        onCategoryToggle={(c) =>
          setSelectedCategories((prev) =>
            prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
          )
        }
        selectedBrands={selectedBrands}
        onBrandToggle={(b) =>
          setSelectedBrands((prev) =>
            prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
          )
        }
        selectedPriceRange={selectedPriceRange}
        onPriceRangeSelect={setSelectedPriceRange}
        minRating={minRating}
        onRatingSelect={setMinRating}
        showStores={showStores}
        onShowStoresToggle={() => setShowStores((v) => !v)}
        showProducts={showProducts}
        onShowProductsToggle={() => setShowProducts((v) => !v)}
        onReset={handleReset}
        resultCount={totalResults}
      />
    </div>
  );
}
