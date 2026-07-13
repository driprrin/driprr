"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAddressStore } from "@/store/addressStore";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/layout/BottomNav";

export default function ProfilePage() {
  const router       = useRouter();
  const user         = useAuthStore((s) => s.user);
  const logout       = useAuthStore((s) => s.logout);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const wishlistCount = useWishlistStore((s) => s.totalItems)();
  const addressCount  = useAddressStore((s) => s.addresses.length);

  const [loading, setLoading]         = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [mounted, setMounted]         = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const syncProfile = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        logout();
        router.push("/login");
        return;
      }
      const profile = await fetchProfile();
      if (!profile && !user) {
        router.push("/signup?sync=true");
      }
      setLoading(false);
    };
    syncProfile();
  }, [router, fetchProfile, logout, user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("driprr_orders");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setActiveCount(parsed.filter((o: { status: string }) => o.status !== "Delivered").length);
      setHistoryCount(parsed.filter((o: { status: string }) => o.status === "Delivered").length);
    } catch { /* ignore */ }
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const tiles = [
    {
      href: "/orders",
      icon: "receipt_long",
      count: activeCount,
      label: "Active Orders",
      clickable: true,
    },
    {
      href: "/orders",
      icon: "history",
      count: historyCount,
      label: "Order History",
      clickable: true,
    },
    {
      href: "/profile/addresses",
      icon: "location_on",
      count: mounted ? addressCount : 0,
      label: "Saved Addresses",
      clickable: true,
    },
    {
      href: "/profile/wishlist",
      icon: "favorite",
      count: mounted ? wishlistCount : 0,
      label: "Wishlist",
      clickable: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary relative overflow-hidden pb-24">
      {/* Home button */}
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 w-10 h-10 bg-surface-2 border border-border-low rounded-2xl flex items-center justify-center text-text-dim hover:text-text-primary transition-all"
      >
        <span className="material-symbols-outlined text-[20px]">home</span>
      </Link>

      {/* Background gradients */}
      <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-[160px]" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-[160px]" />

      <main className="max-w-md mx-auto px-4 pt-12 relative z-10 text-left">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-black tracking-tight text-text-primary">MY PROFILE</h1>
          <button
            onClick={handleSignOut}
            className="w-10 h-10 rounded-2xl bg-surface-2 border border-border-low flex items-center justify-center hover:bg-surface-1 text-red-400 hover:text-red-300 transition-colors"
            title="Sign Out"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>

        {/* User Card */}
        <div className="bg-surface-1/40 backdrop-blur-xl border border-border-low rounded-3xl p-6 mb-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border-low flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[36px] text-text-dim">account_circle</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-text-primary leading-tight truncate">{user.name}</h2>
              <p className="text-text-dim text-xs mt-1 truncate">{user.phone || user.email}</p>
              <span className="inline-block px-2.5 py-0.5 mt-2 bg-primary/10 border border-primary/20 rounded-full text-[9px] font-extrabold tracking-wider text-primary uppercase">
                Customer
              </span>
            </div>
          </div>
        </div>

        {/* Activity tiles */}
        <div className="space-y-4">
          <h3 className="text-xs font-black tracking-wider text-text-dim uppercase px-1">My Activities</h3>

          <div className="grid grid-cols-2 gap-4">
            {tiles.map((tile) => (
              <Link
                key={tile.label}
                href={tile.href}
                className="block bg-surface-1 border border-border-low rounded-2xl p-5 flex flex-col justify-between h-32 hover:border-primary/40 transition-colors cursor-pointer group"
              >
                <span className="material-symbols-outlined text-primary text-[28px] group-hover:scale-105 transition-transform">
                  {tile.icon}
                </span>
                <div>
                  <h4 className="text-xl font-black">{tile.count}</h4>
                  <p className="text-text-dim text-[10px] font-bold uppercase tracking-wider mt-0.5 group-hover:text-primary transition-colors">
                    {tile.label}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-6 space-y-2">
          <h3 className="text-xs font-black tracking-wider text-text-dim uppercase px-1 mb-3">Quick Links</h3>
          {[
            { href: "/categories", icon: "category", label: "Browse Categories" },
            { href: "/stores",     icon: "storefront", label: "Nearby Stores" },
            { href: "/search",     icon: "search",    label: "Search Products" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-4 py-3.5 bg-surface-1 border border-border-low rounded-2xl hover:border-primary/40 transition-colors group"
            >
              <span className="material-symbols-outlined text-primary text-[20px]">{link.icon}</span>
              <span className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">{link.label}</span>
              <span className="material-symbols-outlined text-text-mute text-[16px] ml-auto">chevron_right</span>
            </Link>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
