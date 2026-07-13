"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Package, BarChart3, Settings } from "lucide-react";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home"     },
  { href: "/orders",    icon: ShoppingBag,     label: "Orders"   },
  { href: "/products",  icon: Package,         label: "Products" },
  { href: "/analytics", icon: BarChart3,       label: "Analytics"},
  { href: "/settings",  icon: Settings,        label: "Settings" },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-1/95 backdrop-blur-xl border-t border-border-low">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                active ? "text-primary" : "text-text-mute hover:text-text-primary"
              }`}
            >
              <Icon size={22} />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
