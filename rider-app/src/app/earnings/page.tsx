"use client";

import { useRiderStore } from "@/store/riderStore";
import { IndianRupee, TrendingUp, Package, Star } from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function EarningsPage() {
  const { earnings, deliveryHistory } = useRiderStore();

  const delivered  = deliveryHistory.filter((d) => d.status === "DELIVERED").length;
  const avgPerDrop = delivered > 0 ? Math.round(earnings.total / delivered) : 0;

  const stats = [
    { label: "Today",        value: `₹${earnings.today.toLocaleString("en-IN")}`,  icon: IndianRupee, color: "text-success" },
    { label: "This Week",    value: `₹${earnings.week.toLocaleString("en-IN")}`,   icon: TrendingUp,  color: "text-primary" },
    { label: "Total",        value: `₹${earnings.total.toLocaleString("en-IN")}`,  icon: Star,        color: "text-warning" },
    { label: "Avg per Drop", value: `₹${avgPerDrop}`,                              icon: Package,     color: "text-info"    },
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24">
      <header className="px-5 pt-8 pb-5">
        <h1 className="font-display font-black text-2xl">Earnings</h1>
        <p className="text-text-mute text-sm mt-0.5">{delivered} deliveries completed</p>
      </header>

      {/* Stats grid */}
      <div className="px-5 grid grid-cols-2 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface-1 border border-border-low rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <p className="text-2xl font-black text-text-primary leading-none">{s.value}</p>
            <p className="text-[11px] font-bold text-text-mute uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Commission info */}
      <div className="mx-5 p-4 bg-surface-1 border border-border-low rounded-2xl space-y-3">
        <p className="text-[11px] font-black text-text-mute uppercase tracking-wider">How You Earn</p>
        {[
          { label: "Commission per delivery", value: "10% of order value" },
          { label: "Minimum per drop",         value: "₹30"               },
          { label: "Bonus for 10+ drops/day",  value: "+₹100 bonus"       },
          { label: "Payment cycle",            value: "Weekly (every Mon)" },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-text-dim">{row.label}</span>
            <span className="font-bold text-text-primary">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Recent deliveries */}
      {deliveryHistory.length > 0 && (
        <div className="px-5 mt-6">
          <p className="text-[11px] font-black text-text-mute uppercase tracking-wider mb-3">Recent</p>
          <div className="space-y-2">
            {deliveryHistory.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between bg-surface-1 border border-border-low rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{d.storeName} → {d.customerName}</p>
                  <p className="text-xs text-text-mute">{new Date(d.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                </div>
                <span className="font-black text-success text-sm">+₹{Math.round(d.total * 0.1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
