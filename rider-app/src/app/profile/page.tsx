"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bike, MapPin, Car, LogOut, Star, Package, Bell, ShieldCheck } from "lucide-react";
import { useRiderStore } from "@/store/riderStore";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

export default function ProfilePage() {
  const router    = useRouter();
  const { user, earnings, deliveryHistory, logout, isAuthenticated } = useRiderStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => { if (mounted && !isAuthenticated) router.push("/login"); }, [mounted, isAuthenticated, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    logout();
    router.push("/login");
  }

  if (!mounted || !user) return null;

  const delivered = deliveryHistory.filter((d) => d.status === "DELIVERED").length;
  const rating    = 4.8; // mock — would come from backend

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24">
      <header className="px-5 pt-8 pb-5 flex items-center justify-between">
        <h1 className="font-display font-black text-2xl">My Profile</h1>
        <button onClick={handleLogout}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-1 border border-border-low text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut size={16} />
        </button>
      </header>

      <div className="px-5 space-y-5">
        {/* Rider card */}
        <div className="bg-surface-1 border border-border-low rounded-3xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-black text-primary">
              {user.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-black text-xl truncate">{user.name}</h2>
              <p className="text-text-dim text-xs mt-0.5">{user.phone || user.email}</p>
              <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black text-primary uppercase">
                <Bike size={10} />
                Delivery Partner
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-border-low">
            {[
              { label: "Rating",     value: `${rating}★`,          color: "text-warning" },
              { label: "Delivered",  value: String(delivered),      color: "text-success" },
              { label: "Total Earned", value: `₹${earnings.total}`, color: "text-primary" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-text-mute mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="bg-surface-1 border border-border-low rounded-2xl overflow-hidden">
          {[
            { icon: MapPin,      label: "Zone",         value: user.zone        },
            { icon: Car,         label: "Vehicle",      value: user.vehicleType },
            { icon: Star,        label: "Rating",       value: `${rating} / 5.0` },
            { icon: ShieldCheck, label: "Status",       value: "Verified Rider" },
          ].map(({ icon: Icon, label, value }, i) => (
            <div key={label} className={`flex items-center gap-3 px-5 py-4 ${i < 3 ? "border-b border-border-low" : ""}`}>
              <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-text-mute">{label}</p>
                <p className="text-sm font-semibold text-text-primary capitalize">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="bg-surface-1 border border-border-low rounded-2xl overflow-hidden">
          {[
            { icon: Bell,    label: "Notifications",   href: "#" },
            { icon: Package, label: "Delivery History", href: "/orders" },
          ].map(({ icon: Icon, label, href }, i) => (
            <a key={label} href={href}
              className={`flex items-center gap-3 px-5 py-4 hover:bg-surface-2 transition-colors ${i === 0 ? "border-b border-border-low" : ""}`}>
              <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-primary" />
              </div>
              <span className="flex-1 text-sm font-semibold text-text-primary">{label}</span>
              <span className="material-symbols-outlined text-text-mute text-[16px]">chevron_right</span>
            </a>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
