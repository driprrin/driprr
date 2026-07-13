"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { Search, MapPin, ToggleLeft, ToggleRight, Loader2, Trash2 } from "lucide-react";

interface Store {
  id: string; name: string; slug: string; city: string;
  isOpen: boolean; status: string; rating: number;
  reviewCount: number; createdAt: string; categories: string[];
}

export default function StoresPage() {
  const [stores,  setStores]  = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabaseAdmin.from("Store").select("*").order("createdAt", { ascending: false })
      .then(({ data }) => { if (data) setStores(data as Store[]); setLoading(false); });
  }, []);

  async function toggleOpen(id: string, current: boolean) {
    await supabaseAdmin.from("Store").update({ isOpen: !current }).eq("id", id);
    setStores((prev) => prev.map((s) => s.id === id ? { ...s, isOpen: !current } : s));
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      // Set store status to 'removed' rather than hard delete (keeps order history)
      await supabaseAdmin.from("Store").update({ status: "removed", isOpen: false }).eq("id", id);
      setStores((prev) => prev.filter((s) => s.id !== id));
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  const filtered = stores.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Stores">
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mute" />
        <input type="text" placeholder="Search stores..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-surface-1 border border-border-low rounded-xl text-sm text-text-primary placeholder-text-mute focus:outline-none focus:border-primary/50 transition-colors" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 size={24} className="animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-text-mute">
          <p className="text-sm font-semibold">No stores found</p>
          <p className="text-xs">Approved applications will create stores here</p>
        </div>
      ) : (
        <div className="bg-surface-1 border border-border-low rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto_auto] gap-4 px-5 py-3 border-b border-border-low text-[11px] font-black uppercase tracking-wider text-text-mute">
            <span>Store</span><span>Location</span><span>Categories</span><span>Rating</span><span>Status</span><span>Open</span><span>Del</span>
          </div>
          <div className="divide-y divide-border-low">
            {filtered.map((s) => (
              <div key={s.id} className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto_auto] gap-3 md:gap-4 px-5 py-4 hover:bg-surface-2 transition-colors">
                <div>
                  <p className="text-sm font-bold text-text-primary">{s.name}</p>
                  <p className="text-[11px] text-text-mute font-mono">{s.slug}</p>
                </div>
                <p className="text-xs text-text-dim self-center flex items-center gap-1">
                  <MapPin size={11} className="text-primary" />{s.city}
                </p>
                <p className="text-xs text-text-mute self-center line-clamp-1">{s.categories.slice(0,2).join(", ") || "—"}</p>
                <p className="text-xs text-text-primary self-center">
                  {s.rating > 0 ? <span className="flex items-center gap-1"><span className="text-[#FFC94A]">★</span>{s.rating}</span> : "—"}
                </p>
                <div className="self-center">
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase ${s.status === "active" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                    {s.status}
                  </span>
                </div>
                <button onClick={() => toggleOpen(s.id, s.isOpen)} className="self-center">
                  {s.isOpen
                    ? <ToggleRight size={22} className="text-success" />
                    : <ToggleLeft size={22} className="text-text-mute" />}
                </button>
                <button onClick={() => setDeleteId(s.id)} className="self-center w-8 h-8 flex items-center justify-center rounded-lg text-text-mute hover:text-danger hover:bg-danger/10 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setDeleteId(null)} />
          <div className="fixed bottom-0 inset-x-0 z-50 bg-surface-1 rounded-t-3xl p-6 animate-slide-up max-w-md mx-auto">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center">
                <Trash2 size={22} className="text-danger" />
              </div>
            </div>
            <h3 className="font-display font-black text-lg text-center">Remove Store?</h3>
            <p className="text-text-mute text-sm text-center mt-2">
              The store will be hidden from customers. Existing orders are preserved.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-3 border-2 border-border-low bg-surface-2 font-bold rounded-2xl text-sm">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)} disabled={deleting}
                className="flex-[1.5] py-3 bg-danger text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Remove Store
              </button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
