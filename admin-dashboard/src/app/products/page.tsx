"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabaseAdmin } from "@/lib/supabase";
import { Search, Trash2, Eye, Loader2, PackageOpen, ExternalLink } from "lucide-react";

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number;
  published: boolean;
  imageUrls: string[];
  storeId: string;
  storeName?: string;
  createdAt: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadProducts() {
    setLoading(true);
    const { data } = await supabaseAdmin
      .from("Product")
      .select("*")
      .order("createdAt", { ascending: false });

    if (data) {
      // Fetch store names
      const storeIds = [...new Set(data.map((p: any) => p.storeId))];
      const { data: stores } = await supabaseAdmin
        .from("Store")
        .select("id, name")
        .in("id", storeIds);
      const storeMap = Object.fromEntries((stores ?? []).map((s: any) => [s.id, s.name]));

      setProducts(data.map((p: any) => ({
        ...p,
        storeName: storeMap[p.storeId] ?? "Unknown",
      })));
    }
    setLoading(false);
  }

  useEffect(() => { loadProducts(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this product? This cannot be undone.")) return;
    setDeleting(id);
    // Delete inventory first, then product
    await supabaseAdmin.from("Inventory").delete().eq("productId", id);
    await supabaseAdmin.from("Product").delete().eq("id", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  }

  const filtered = products.filter((p) =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase()) ||
    p.storeName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Products">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mute" />
          <input
            type="text" placeholder="Search by name, brand, or store..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-surface-1 border border-border-low rounded-xl text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
        <div className="text-sm text-text-mute self-center">
          {products.length} products total
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-mute gap-2">
          <PackageOpen size={32} />
          <p className="text-sm">No products found</p>
        </div>
      ) : (
        <div className="bg-surface-1 border border-border-low rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 border-b border-border-low">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-text-mute uppercase">Image</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-text-mute uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-text-mute uppercase">Store</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-text-mute uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-text-mute uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-text-mute uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-low">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3">
                      {p.imageUrls?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrls[0]} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-surface-2 flex items-center justify-center">
                          <PackageOpen size={16} className="text-text-mute" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-text-primary">{p.name}</p>
                      <p className="text-[10px] text-text-mute">{p.brand} · {p.category}</p>
                    </td>
                    <td className="px-4 py-3 text-text-dim text-xs">{p.storeName}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-primary">₹{p.price}</span>
                      {p.originalPrice > p.price && (
                        <span className="text-[10px] text-text-mute line-through ml-1">₹{p.originalPrice}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.published ? "bg-success/10 text-success" : "bg-surface-2 text-text-mute"
                      }`}>
                        {p.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <a
                          href={`https://driprr.com/product/${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-surface-2 border border-border-low text-text-dim hover:text-primary hover:border-primary/40 transition-colors"
                          title="View product"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deleting === p.id}
                          className="p-1.5 rounded-lg bg-surface-2 border border-border-low text-text-dim hover:text-danger hover:border-danger/40 transition-colors disabled:opacity-50"
                          title="Delete product"
                        >
                          {deleting === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
