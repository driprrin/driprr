"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

const navItems = [
  { icon: "home",          label: "Home",    href: "/" },
  { icon: "search",        label: "Search",  href: "/search" },
  { icon: "inventory_2",   label: "Orders",  href: "/orders" },
  { icon: "shopping_cart", label: "Cart",    href: "/cart" },
  { icon: "person",        label: "Profile", href: "/profile", requiresAuth: true },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const totalItems = useCartStore((s) => s.totalItems);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [mounted, setMounted] = useState(false);
  const [shouldBounce, setShouldBounce] = useState(false);

  useEffect(() => setMounted(true), []);

  const cartCount = mounted ? totalItems() : 0;

  useEffect(() => {
    if (cartCount > 0) {
      setShouldBounce(true);
      const timer = setTimeout(() => setShouldBounce(false), 400);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  function handleNavClick(e: React.MouseEvent, item: typeof navItems[0]) {
    if (item.requiresAuth && mounted && !isAuthenticated) {
      e.preventDefault();
      router.push("/login");
    }
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border-low">
      <div className="max-w-5xl mx-auto px-2 py-2.5 flex items-center justify-around">
        {navItems.map((n) => {
          const active = pathname === n.href;
          const isCart = n.label === "Cart";
          return (
            <Link
              key={n.label}
              href={n.href}
              onClick={(e) => handleNavClick(e, n)}
              id={isCart ? "bottom-nav-cart-btn" : undefined}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                active ? "text-primary" : "text-text-mute hover:text-text-primary"
              } ${isCart && shouldBounce ? "animate-bounce-custom text-primary" : ""}`}
            >
              <span className="material-symbols-outlined text-[24px]">{n.icon}</span>
              <span className="text-[10px] font-medium">{n.label}</span>
              {isCart && cartCount > 0 && (
                <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
