"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, BarChart3, User } from "lucide-react";

const NAV = [
  { href: "/home",     icon: Home,     label: "Home"     },
  { href: "/orders",   icon: Package,  label: "Orders"   },
  { href: "/earnings", icon: BarChart3, label: "Earnings" },
  { href: "/profile",  icon: User,     label: "Profile"  },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-surface-1/95 backdrop-blur-xl border-t border-border-low max-w-md mx-auto">
      <div className="flex items-center justify-around px-2 py-3">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-1 px-4 py-1 transition-colors ${active ? "text-primary" : "text-text-mute hover:text-text-dim"}`}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
