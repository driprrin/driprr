"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plus, Tag, X, Check, Zap, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Coupon {
  id: string;
  code: string;
  type: "percent" | "flat";
  value: number;
  minOrder: number;
  uses: number;
  maxUses: number;
  expires: string;
  active: boolean;
}

// Coupons loaded from Supabase

function CouponModal({ onClose, onSave }: { onClose: () => void; onSave: (c: Omit<Coupon, "id" | "uses">) => void }) {
  const [form, setForm] = useState({ code: "", type: "percent" as "percent" | "flat", value: 10, minOrder: 0, maxUses: 100, expires: "", active: true });

  function generate() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    setForm((f) => ({ ...f, code: Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") }));
  }

  const inputCls = "w-full px-3 py-2.5 bg-surface-2 border border-border-low focus:border-primary/60 rounded-xl text-sm text-text-primary focus:outline-none transition-colors";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-x-4 top-12 bottom-12 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[420px] z-50 bg-surface-1 rounded-3xl border border-border-low shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-low">
          <h2 className="font-display font-black text-lg">Create Coupon</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Code */}
          <div>
            <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Coupon Code</label>
            <div className="flex gap-2">
              <input type="text" placeholder="MYCODE20" value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                className={`${inputCls} flex-1 uppercase tracking-widest font-bold`} />
              <button onClick={generate} className="px-3 py-2.5 bg-surface-2 border border-border-low rounded-xl text-text-dim hover:text-text-primary text-lg transition-colors">🎲</button>
            </div>
          </div>
          {/* Type */}
          <div>
            <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-2">Discount Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(["percent", "flat"] as const).map((t) => (
                <button key={t} onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${form.type === t ? "border-primary bg-primary/8 text-primary" : "border-border-low bg-surface-2 text-text-dim"}`}>
                  {t === "percent" ? "% Percentage" : "₹ Flat Amount"}
                </button>
              ))}
            </div>
          </div>
          {/* Value + Min order */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">
                {form.type === "percent" ? "Discount %" : "Flat Off (₹)"}
              </label>
              <input type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: +e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Min Order (₹)</label>
              <input type="number" value={form.minOrder} onChange={(e) => setForm((f) => ({ ...f, minOrder: +e.target.value }))} className={inputCls} />
            </div>
          </div>
          {/* Usage limit + Expiry */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Usage Limit</label>
              <input type="number" value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: +e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Expires On</label>
              <input type="date" value={form.expires} onChange={(e) => setForm((f) => ({ ...f, expires: e.target.value }))} className={inputCls} />
            </div>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-border-low flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border-2 border-border-low bg-surface-2 font-bold rounded-2xl text-sm">Cancel</button>
          <button onClick={() => { if (form.code) { onSave({ ...form }); onClose(); } }}
            className="flex-[2] py-3 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity">
            Create Coupon
          </button>
        </div>
      </div>
    </>
  );
}

export default function PromotionsPage() {
  const [coupons, setCoupons]       = useState<Coupon[]>([]);
  const [showModal, setShowModal]   = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [flashDiscount, setFlashDiscount] = useState(20);
  const [flashEnds, setFlashEnds]   = useState("");

  // Load coupons from Supabase on mount
  useEffect(() => {
    import("@/lib/supabase").then(({ supabase }) => {
      supabase.from("Coupon").select("*").order("createdAt", { ascending: false })
        .then(({ data }) => {
          if (data) setCoupons(data.map((c: any) => ({
            id: c.id, code: c.code, type: c.type, value: c.value,
            minOrder: c.minOrder, uses: c.uses, maxUses: c.maxUses,
            expires: c.expiresAt ? c.expiresAt.split("T")[0] : "", active: c.active,
          })));
        });
    });
  }, []);

  async function toggleCoupon(id: string) {
    const coupon = coupons.find((c) => c.id === id);
    if (!coupon) return;
    const newActive = !coupon.active;
    setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, active: newActive } : c));
    const { supabase } = await import("@/lib/supabase");
    const { error } = await supabase.from("Coupon").update({ active: newActive }).eq("id", id);
    if (error) {
      // Revert on failure
      setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, active: !newActive } : c));
      console.error("Toggle coupon failed:", error);
    }
  }

  async function deleteCoupon(id: string) {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    const { supabase } = await import("@/lib/supabase");
    const { error } = await supabase.from("Coupon").delete().eq("id", id);
    if (error) console.error("Delete coupon failed:", error);
  }

  function addCoupon(data: Omit<Coupon, "id" | "uses">) {
    import("@/lib/supabase").then(({ supabase }) => {
      supabase.from("Coupon").insert({
        code:      data.code,
        type:      data.type,
        value:     data.value,
        minOrder:  data.minOrder,
        maxUses:   data.maxUses,
        uses:      0,
        active:    data.active,
        expiresAt: data.expires || null,
      }).select().single().then(({ data: row }) => {
        if (row) {
          setCoupons((prev) => [{
            id: row.id, code: row.code, type: row.type, value: row.value,
            minOrder: row.minOrder, uses: row.uses, maxUses: row.maxUses,
            expires: row.expiresAt ? row.expiresAt.split("T")[0] : "", active: row.active,
          }, ...prev]);
        }
      });
    });
  }

  return (
    <DashboardLayout title="Promotions">
      {/* Flash Sale Section */}
      <div className={`mb-6 p-5 rounded-2xl border-2 ${flashActive ? "border-primary/40 bg-primary/5" : "border-border-low bg-surface-1"}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base">Flash Sale</h2>
              <p className="text-xs text-text-mute">Time-limited discount on all products</p>
            </div>
          </div>
          <button onClick={() => setFlashActive(!flashActive)}
            className={`relative w-12 h-6 rounded-full transition-colors ${flashActive ? "bg-primary" : "bg-border-low"}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${flashActive ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
        </div>

        {flashActive && (
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-xl mb-4">
            <Zap size={14} className="text-primary" />
            <span className="text-xs font-bold text-primary">Flash Sale is ACTIVE — customers see {flashDiscount}% OFF banner</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Discount %</label>
            <input type="number" value={flashDiscount} onChange={(e) => setFlashDiscount(+e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-2 border border-border-low focus:border-primary/60 rounded-xl text-sm text-text-primary focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Sale Ends</label>
            <input type="datetime-local" value={flashEnds} onChange={(e) => setFlashEnds(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-2 border border-border-low focus:border-primary/60 rounded-xl text-sm text-text-primary focus:outline-none transition-colors" />
          </div>
        </div>
      </div>

      {/* Coupons */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-lg">Coupons</h2>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary font-bold text-sm rounded-xl hover:opacity-90 transition-opacity">
          <Plus size={15} />
          Create Coupon
        </button>
      </div>

      <div className="space-y-3">
        {coupons.map((c) => (
          <div key={c.id} className={`bg-surface-1 border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${c.active ? "border-border-low" : "border-border-low opacity-60"}`}>
            {/* Code */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Tag size={18} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-text-primary tracking-widest font-mono">{c.code}</p>
                <p className="text-xs text-text-mute">
                  {c.type === "percent" ? `${c.value}% off` : `₹${c.value} flat off`}
                  {c.minOrder > 0 ? ` · min ₹${c.minOrder}` : ""}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-text-mute shrink-0">
              <div className="text-center">
                <p className="font-black text-text-primary text-sm">{c.uses}/{c.maxUses}</p>
                <p>Used</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Clock size={11} />
                  <span>{c.expires}</span>
                </div>
                <p>Expires</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => toggleCoupon(c.id)}
                className={`relative w-10 h-5 rounded-full transition-colors ${c.active ? "bg-success" : "bg-border-low"}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${c.active ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
              <button onClick={() => deleteCoupon(c.id)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-text-mute hover:text-danger hover:bg-danger/10 transition-colors">
                <X size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && <CouponModal onClose={() => setShowModal(false)} onSave={addCoupon} />}
    </DashboardLayout>
  );
}
