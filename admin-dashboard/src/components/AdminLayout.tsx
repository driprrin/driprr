"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard, FileText, Store, Users, BarChart3, LogOut, ShieldCheck, Bike, ShoppingBag, Package,
} from "lucide-react";

const NAV = [
  { href: "/applications", icon: FileText,       label: "Applications" },
  { href: "/riders",       icon: Bike,           label: "Riders"       },
  { href: "/stores",       icon: Store,          label: "Stores"       },
  { href: "/products",     icon: Package,        label: "Products"     },
  { href: "/orders",       icon: ShoppingBag,    label: "Orders"       },
  { href: "/users",        icon: Users,          label: "Users"        },
  { href: "/analytics",    icon: BarChart3,      label: "Analytics"    },
];

export default function AdminLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const router    = useRouter();
  const pathname  = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { logout(); router.push("/login"); return; }
      const role = data.session.user.user_metadata?.role;
      if (role !== "ADMIN") { logout(); router.push("/login"); return; }
      setChecking(false);
    });
  }, [router, logout]);

  async function handleLogout() {
    await supabase.auth.signOut();
    logout();
    router.push("/login");
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-surface-1 border-r border-border-low h-screen sticky top-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border-low">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck size={16} className="text-on-primary" />
          </div>
          <div>
            <p className="text-xs font-black tracking-widest uppercase text-primary leading-none">DRIPRR</p>
            <p className="text-[10px] text-text-mute font-medium">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "bg-primary/10 text-primary border-l-2 border-primary pl-[10px]"
                    : "text-text-dim hover:text-text-primary hover:bg-surface-2"
                }`}>
                <Icon size={17} className="shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-border-low p-3 space-y-1">
          {mounted && user && (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-black text-primary">{user.name[0]}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-text-primary truncate">{user.name}</p>
                <p className="text-[10px] text-text-mute">Admin</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors w-full">
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 px-6 flex items-center justify-between border-b border-border-low bg-surface-1/80 backdrop-blur-md sticky top-0 z-20">
          <h1 className="font-display font-black text-lg text-text-primary">{title}</h1>
          <span className="text-xs font-bold text-text-mute px-2.5 py-1 bg-danger/10 text-danger border border-danger/20 rounded-full">
            Admin Only
          </span>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
