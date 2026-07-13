"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDashboardStore, Product } from "@/store/dashboardStore";
import { useAuthStore } from "@/store/authStore";
import { Plus, Search, Edit2, Trash2, X, Check, PackageOpen, Upload, Loader2, ImagePlus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const CATEGORIES = ["Top Wear", "Bottom Wear", "Foot Wear"];

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const NUMERIC_SIZES  = ["28", "30", "32", "34", "36", "38", "40", "42"];

interface SizeStock { size: string; stock: number; }

const CLOUDINARY_CLOUD  = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME  ?? "hunu2oxf";
const CLOUDINARY_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "d1qib0aj";

async function uploadToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file",        file);
  fd.append("upload_preset", CLOUDINARY_PRESET);
  fd.append("folder",      "driprr/products");
  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: "POST", body: fd });
  const data = await res.json();
  if (!data.secure_url) throw new Error("Upload failed");
  return data.secure_url;
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)  return <span className="px-2 py-0.5 bg-danger/10 text-danger text-[10px] font-black rounded-full">Out of stock</span>;
  if (stock <= 3)   return <span className="px-2 py-0.5 bg-warning/10 text-warning text-[10px] font-black rounded-full">Low — {stock} left</span>;
  return <span className="px-2 py-0.5 bg-success/10 text-success text-[10px] font-black rounded-full">{stock} in stock</span>;
}

// ── Add/Edit Modal ────────────────────────────────────────────────────────────
function ProductModal({
  product, onClose, onSave,
}: {
  product?: Product;
  onClose: () => void;
  onSave: (p: Partial<Product> & { inventory?: SizeStock[]; imageUrls?: string[] }) => void;
}) {
  const [form, setForm] = useState({
    name:          product?.name          ?? "",
    brand:         product?.brand         ?? "",
    category:      product?.category      ?? "Top Wear",
    price:         product?.price         ?? 0,
    originalPrice: product?.originalPrice ?? 0,
    badge:         product?.badge         ?? "",
    published:     product?.published     ?? true,
  });

  // Images
  const [images,     setImages]     = useState<string[]>([]);
  const [uploading,  setUploading]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Size + stock
  const [sizeType,  setSizeType]  = useState<"clothing" | "numeric">("clothing");
  const [inventory, setInventory] = useState<SizeStock[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(false);

  const inputCls = "w-full px-3 py-2.5 bg-surface-2 border border-border-low focus:border-primary/60 rounded-xl text-sm text-text-primary placeholder-text-mute focus:outline-none transition-colors";

  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  // Load existing product details (images + inventory) when editing
  useEffect(() => {
    if (!product) return;
    setLoadingProduct(true);
    import("@/lib/axios").then(({ default: api }) => {
      api.get(`/products/${product.id}`)
        .then((r) => {
          const p = r.data;
          // Load images
          if (p.imageUrls?.length) setImages(p.imageUrls);
          // Load inventory
          if (p.inventory?.length) {
            const inv: SizeStock[] = p.inventory.map((i: any) => ({ size: i.size, stock: i.stock }));
            setInventory(inv);
            // Detect size type
            const firstSize = inv[0]?.size;
            if (firstSize && /^\d+$/.test(firstSize)) {
              setSizeType("numeric");
            } else {
              setSizeType("clothing");
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoadingProduct(false));
    });
  }, [product]);

  const sizes = sizeType === "clothing" ? CLOTHING_SIZES : NUMERIC_SIZES;

  function toggleSize(size: string) {
    setInventory((prev) => {
      const exists = prev.find((s) => s.size === size);
      if (exists) return prev.filter((s) => s.size !== size);
      return [...prev, { size, stock: 0 }];
    });
  }

  function setStock(size: string, stock: number) {
    setInventory((prev) => prev.map((s) => s.size === size ? { ...s, stock } : s));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(uploadToCloudinary));
      setImages((prev) => [...prev, ...urls].slice(0, 5)); // max 5 images
    } catch { alert("Upload failed. Try again."); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-x-4 top-6 bottom-6 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[520px] z-50 bg-surface-1 rounded-3xl border border-border-low shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-low shrink-0">
          <h2 className="font-display font-black text-lg">{product ? "Edit Product" : "Add Product"}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {loadingProduct && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary" />
              <span className="ml-2 text-sm text-text-mute">Loading product details...</span>
            </div>
          )}

          {/* ── Images ── */}
          <div>
            <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-2">
              Product Images <span className="normal-case font-normal">(up to 5)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {images.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border-low group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`img ${i+1}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <X size={16} className="text-white" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-black bg-primary text-on-primary py-0.5">COVER</span>
                  )}
                </div>
              ))}
              {images.length < 5 && (
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-border-low flex flex-col items-center justify-center gap-1 text-text-mute hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50">
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                  <span className="text-[9px] font-bold">Add Photo</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
            <p className="text-[10px] text-text-mute mt-1">First image is the cover. Tap image to remove.</p>
          </div>

          {/* ── Basic Info ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Product Name</label>
              <input type="text" placeholder="e.g. Oversized Hoodie"
                value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Brand</label>
              <input type="text" placeholder="BRAND NAME"
                value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className={inputCls}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Sale Price (₹)</label>
              <input type="number" placeholder="0" value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: +e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Original Price (₹)</label>
              <input type="number" placeholder="0" value={form.originalPrice}
                onChange={(e) => setForm((p) => ({ ...p, originalPrice: +e.target.value }))} className={inputCls} />
            </div>
            {form.price > 0 && form.originalPrice > form.price && (
              <div className="col-span-2 px-3 py-2 bg-success/10 border border-success/20 rounded-xl text-xs font-bold text-success">
                {Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100)}% off — saves {formatCurrency(form.originalPrice - form.price)}
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Badge (optional)</label>
              <input type="text" placeholder="e.g. Bestseller"
                value={form.badge} onChange={(e) => setForm((p) => ({ ...p, badge: e.target.value }))}
                className={inputCls} />
            </div>
          </div>

          {/* ── Sizes & Stock ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider">Sizes & Stock</label>
              <div className="flex gap-1">
                {(["clothing", "numeric"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => { setSizeType(t); setInventory([]); }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${
                      sizeType === t ? "border-primary bg-primary text-on-primary" : "border-border-low bg-surface-2 text-text-dim"
                    }`}>
                    {t === "clothing" ? "S/M/L" : "28–42"}
                  </button>
                ))}
              </div>
            </div>

            {/* Size toggle chips */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {sizes.map((size) => {
                const active = inventory.some((s) => s.size === size);
                return (
                  <button key={size} type="button" onClick={() => toggleSize(size)}
                    className={`min-w-[40px] px-2.5 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${
                      active ? "border-primary bg-primary text-on-primary" : "border-border-low bg-surface-2 text-text-dim hover:border-text-mute"
                    }`}>
                    {size}
                  </button>
                );
              })}
            </div>

            {/* Stock input per selected size */}
            {inventory.length > 0 && (
              <div className="bg-surface-2 rounded-xl p-3 space-y-2">
                <p className="text-[10px] font-bold text-text-mute uppercase tracking-wider mb-2">Stock per size</p>
                <div className="grid grid-cols-2 gap-2">
                  {inventory.map((inv) => (
                    <div key={inv.size} className="flex items-center gap-2">
                      <span className="w-10 text-xs font-black text-text-primary text-center bg-primary/10 py-1.5 rounded-lg">{inv.size}</span>
                      <input
                        type="number" min="0" value={inv.stock}
                        onChange={(e) => setStock(inv.size, +e.target.value)}
                        className="flex-1 px-2 py-1.5 bg-surface-1 border border-border-low rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary/50 text-center"
                        placeholder="0"
                      />
                      <span className="text-[10px] text-text-mute">pcs</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-text-mute pt-1">
                  Total: <span className="font-bold text-text-primary">{inventory.reduce((s, i) => s + i.stock, 0)} pcs</span>
                </p>
              </div>
            )}
            {inventory.length === 0 && (
              <p className="text-[11px] text-text-mute">Select at least one size above</p>
            )}
          </div>

          {/* Published toggle */}
          <div className="flex items-center justify-between px-3 py-3 bg-surface-2 rounded-xl border border-border-low">
            <div>
              <p className="text-sm font-bold text-text-primary">Published</p>
              <p className="text-xs text-text-mute">Visible to customers on driprr.com</p>
            </div>
            <button onClick={() => setForm((p) => ({ ...p, published: !p.published }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.published ? "bg-success" : "bg-border-low"}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.published ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border-low flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-3 border-2 border-border-low bg-surface-2 text-text-primary font-bold rounded-2xl text-sm">Cancel</button>
          <button
            disabled={uploading || !form.name.trim() || !form.brand.trim()}
            onClick={() => {
              onSave({
                ...form,
                stock:     inventory.reduce((s, i) => s + i.stock, 0),
                imageUrl:  images[0] ?? "",
                imageUrls: images,
                inventory,
              });
              onClose();
            }}
            className="flex-[2] py-3 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2">
            {uploading ? <><Loader2 size={15} className="animate-spin" /> Uploading…</> : (product ? "Save Changes" : "Add Product")}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const { products, setProducts } = useDashboardStore();
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [modal, setModal]         = useState<"add" | "edit" | null>(null);
  const [editing, setEditing]     = useState<Product | null>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);

  const { token, user } = useAuthStore();

  useEffect(() => {
    if (!token || !user?.storeId) { setLoading(false); return; }
    setLoading(true);
    import("@/lib/axios").then(({ default: api }) => {
      // published=false means fetch all (published + drafts) for store owner
      api.get(`/stores/${user.storeId}/products`)
        .then((r) => {
          if (r.data?.length > 0) {
            const mapped = r.data.map((p: any) => ({
              id:            p.id,
              name:          p.name,
              brand:         p.brand,
              category:      p.category,
              price:         p.price,
              originalPrice: p.originalPrice,
              stock:         (p.inventory ?? []).reduce((sum: number, inv: any) => sum + inv.stock, 0),
              imageUrl:      p.imageUrls?.[0] ?? "",
              badge:         p.badge ?? undefined,
              published:     p.published,
            }));
            setProducts(mapped);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, [token, user?.storeId, setProducts]);

  const filtered = products.filter((p) => {
    const matchCat    = catFilter === "All" || p.category === catFilter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function handleSave(data: Partial<Product> & { inventory?: SizeStock[]; imageUrls?: string[] }) {
    const { token, user } = useAuthStore.getState();
    // removed - already using hook above
    if (!token || !user?.storeId) {
      if (editing) {
        setProducts(products.map((p) => p.id === editing.id ? { ...p, ...data } : p));
      } else {
        setProducts([{ id: `p${Date.now()}`, imageUrl: data.imageUrls?.[0] ?? "", ...data } as Product, ...products]);
      }
      setEditing(null);
      return;
    }

    import("@/lib/axios").then(({ default: api }) => {
      if (editing) {
        api.patch(`/products/${editing.id}`, {
          name:          data.name,
          brand:         data.brand,
          category:      data.category,
          price:         data.price,
          originalPrice: data.originalPrice,
          badge:         data.badge || undefined,
          published:     data.published,
          imageUrls:     data.imageUrls ?? [],
          inventory:     data.inventory ?? [],
        })
          .then((r) => {
            setProducts(products.map((p) => p.id === editing.id ? {
              ...p, ...data,
              imageUrl: data.imageUrls?.[0] ?? p.imageUrl,
              stock: (r.data.inventory ?? []).reduce((s: number, inv: any) => s + inv.stock, 0),
            } : p));
          })
          .catch(() => {
            setProducts(products.map((p) => p.id === editing.id ? { ...p, ...data } : p));
          });
      } else {
        api.post("/products", {
          storeId:       user.storeId,
          name:          data.name,
          brand:         data.brand,
          category:      data.category,
          price:         data.price,
          originalPrice: data.originalPrice,
          badge:         data.badge || undefined,
          published:     data.published ?? false,
          imageUrls:     data.imageUrls ?? [],
          inventory:     data.inventory ?? [],
        })
          .then((r) => {
            setProducts([{
              id:            r.data.id,
              name:          r.data.name,
              brand:         r.data.brand,
              category:      r.data.category,
              price:         r.data.price,
              originalPrice: r.data.originalPrice,
              stock:         (r.data.inventory ?? []).reduce((s: number, inv: any) => s + inv.stock, 0),
              imageUrl:      r.data.imageUrls?.[0] ?? "",
              badge:         r.data.badge,
              published:     r.data.published,
            }, ...products]);
          })
          .catch(() => {
            setProducts([{ id: `p${Date.now()}`, imageUrl: data.imageUrls?.[0] ?? "", ...data } as Product, ...products]);
          });
      }
      setEditing(null);
    });
  }

  function handleDelete(id: string) {
    setProducts(products.filter((p) => p.id !== id));
    setDeleteId(null);
    // Also delete from backend
    import("@/lib/axios").then(({ default: api }) => {
      api.delete(`/products/${id}`).catch(() => {});
    });
  }

  function togglePublish(id: string) {
    setProducts(products.map((p) => p.id === id ? { ...p, published: !p.published } : p));
    // Also update backend
    import("@/lib/axios").then(({ default: api }) => {
      api.patch(`/products/${id}/publish`).catch(() => {
        // Revert on failure
        setProducts((prev) => prev.map((p) => p.id === id ? { ...p, published: !p.published } : p));
      });
    });
  }

  return (
    <DashboardLayout title="Products">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mute" />
          <input
            type="text" placeholder="Search products..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-surface-1 border border-border-low rounded-xl text-sm text-text-primary placeholder-text-mute focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {["All", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`shrink-0 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${catFilter === c ? "bg-primary text-on-primary border-primary" : "bg-surface-1 border-border-low text-text-dim hover:border-text-mute"}`}>
              {c}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setEditing(null); setModal("add"); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary font-bold text-sm rounded-xl hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total",      value: products.length,                              color: "text-text-primary" },
          { label: "Published",  value: products.filter((p) => p.published).length,   color: "text-success"      },
          { label: "Out of stock",value: products.filter((p) => p.stock === 0).length, color: "text-danger"      },
        ].map((s) => (
          <div key={s.label} className="bg-surface-1 border border-border-low rounded-xl p-3 text-center">
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-bold text-text-mute uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-text-mute">
          <PackageOpen size={32} />
          <p className="text-sm">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((p) => {
            return (
              <div key={p.id} className={`bg-surface-1 border rounded-2xl overflow-hidden flex flex-col ${!p.published ? "opacity-60" : "border-border-low"}`}>
                {/* Image */}
                <div className="aspect-square bg-surface-2 flex items-center justify-center relative overflow-hidden">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <PackageOpen size={24} className="text-text-mute" />
                  )}
                  {p.badge && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-success text-white text-[9px] font-black rounded">{p.badge}</span>
                  )}
                  {!p.published && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-surface-2 border border-border-low text-text-mute text-[9px] font-black rounded">Draft</span>
                  )}
                  {p.originalPrice > p.price && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-primary text-on-primary text-[9px] font-black rounded-lg">{Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}% OFF</span>
                  )}
                </div>

                <div className="p-3 flex-1 flex flex-col gap-1">
                  <p className="text-[9px] font-bold tracking-widest text-text-mute uppercase">{p.brand}</p>
                  <p className="text-xs font-semibold text-text-primary line-clamp-2 leading-snug">{p.name}</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-sm font-black text-primary">{formatCurrency(p.price)}</span>
                    <span className="text-[10px] text-text-mute line-through">{formatCurrency(p.originalPrice)}</span>
                  </div>
                  <StockBadge stock={p.stock} />

                  {/* Actions */}
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => togglePublish(p.id)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1 ${
                        p.published ? "bg-success/10 text-success hover:bg-success/20" : "bg-surface-2 border border-border-low text-text-dim hover:border-text-mute"
                      }`}
                    >
                      {p.published ? <><Check size={10} /> Live</> : "Publish"}
                    </button>
                    <button onClick={() => { setEditing(p); setModal("edit"); }}
                      className="p-1.5 rounded-lg bg-surface-2 border border-border-low text-text-dim hover:text-primary hover:border-primary/40 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setDeleteId(p.id)}
                      className="p-1.5 rounded-lg bg-surface-2 border border-border-low text-text-dim hover:text-danger hover:border-danger/40 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit modal */}
      {(modal === "add" || modal === "edit") && (
        <ProductModal product={editing ?? undefined} onClose={() => { setModal(null); setEditing(null); }} onSave={handleSave} />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setDeleteId(null)} />
          <div className="fixed bottom-0 inset-x-0 z-50 bg-surface-1 rounded-t-3xl p-6 animate-slide-up">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center">
                <Trash2 size={22} className="text-danger" />
              </div>
            </div>
            <h3 className="font-display font-black text-lg text-center">Delete Product?</h3>
            <p className="text-text-mute text-sm text-center mt-1">This will permanently remove the product.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 border-2 border-border-low bg-surface-2 font-bold rounded-2xl text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-[1.5] py-3 bg-danger text-white font-bold rounded-2xl text-sm">Delete</button>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
