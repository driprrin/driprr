"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingBag, BarChart3,
  Tag, Settings, LogOut, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Dashboard"   },
  { href: "/orders",     icon: ShoppingBag,     label: "Orders"       },
  { href: "/products",   icon: Package,         label: "Products"     },
  { href: "/analytics",  icon: BarChart3,       label: "Analytics"    },
  { href: "/promotions", icon: Tag,             label: "Promotions"   },
  { href: "/settings",   icon: Settings,        label: "Store Settings"},
];

export default function Sidebar() {
  const pathname   = usePathname();
  const router     = useRouter();
  const { user, logout } = useAuthStore();
  const { isOpen: storeOpen, setIsOpen } = useDashboardStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted]     = useState(false);

  useEffect(() => setMounted(true), []);

  async function handleLogout() {
    await supabase.auth.signOut();
    logout();
    router.push("/login");
  }

  return (
    <aside
      className={`hidden md:flex flex-col h-screen sticky top-0 bg-surface-1 border-r border-border-low transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2 px-4 py-5 border-b border-border-low ${collapsed ? "justify-center" : ""}`}>
        {!collapsed && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white text-[16px]">storefront</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black tracking-widest uppercase text-primary leading-none">DRIPRR</p>
              <p className="text-[10px] text-text-mute truncate font-medium leading-snug mt-0.5">
                {mounted && user?.storeName ? user.storeName : "Store Dashboard"}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-surface-2 text-text-mute hover:text-text-primary transition-colors shrink-0"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Store open/close toggle */}
      {!collapsed && mounted && (
        <div className="mx-3 mt-3 mb-1 flex items-center justify-between px-3 py-2.5 bg-surface-2 rounded-xl border border-border-low">
          <div className="min-w-0">
            <span className="text-xs font-bold text-text-primary block">Store Status</span>
            {user?.storeName && (
              <span className="text-[10px] text-text-mute truncate block max-w-[110px]">{user.storeName}</span>
            )}
          </div>
          <button
            onClick={async () => {
              const newVal = !storeOpen;
              setIsOpen(newVal);
              if (user?.storeId) {
                try {
                  const { supabase } = await import("@/lib/supabase");
                  const { error } = await supabase
                    .from("Store")
                    .update({ isOpen: newVal })
                    .eq("id", user.storeId);
                  if (error) { setIsOpen(!newVal); } // revert on fail
                } catch { setIsOpen(!newVal); }
              }
            }}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${storeOpen ? "bg-success" : "bg-border-low"}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${storeOpen ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
      )}

      {/* Live dot when open */}
      {!collapsed && mounted && storeOpen && (
        <div className="mx-3 mb-2 flex items-center gap-1.5 px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-[11px] font-semibold text-success">Open & accepting orders</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                active
                  ? "bg-primary/10 text-primary border-l-2 border-primary pl-[10px]"
                  : "text-text-dim hover:text-text-primary hover:bg-surface-2"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className={`border-t border-border-low p-3 space-y-1 ${collapsed ? "flex flex-col items-center" : ""}`}>
        {!collapsed && mounted && user && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-black text-primary">
                {user.name?.[0]?.toUpperCase() ?? "S"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-text-primary truncate">{user.name}</p>
              <p className="text-[10px] text-text-mute truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? "Sign out" : undefined}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors w-full ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut size={15} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
