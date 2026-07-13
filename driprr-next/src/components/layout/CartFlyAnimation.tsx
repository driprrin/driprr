"use client";

import { useEffect, useState } from "react";

interface FlyingItem {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  image?: string;
}

export default function CartFlyAnimation() {
  const [items, setItems] = useState<FlyingItem[]>([]);

  useEffect(() => {
    const handleAnimate = (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number; y: number; image?: string }>;
      const { x, y, image } = customEvent.detail;

      // Find the cart button inside bottom nav
      const cartBtn = document.getElementById("bottom-nav-cart-btn");
      if (!cartBtn) return;

      const rect = cartBtn.getBoundingClientRect();
      const endX = rect.left + rect.width / 2;
      const endY = rect.top + rect.height / 2;

      const id = Date.now() + Math.random();
      const newItem: FlyingItem = {
        id,
        startX: x,
        startY: y,
        endX,
        endY,
        image,
      };

      setItems((prev) => [...prev, newItem]);

      // Remove after animation finishes (800ms)
      setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }, 800);
    };

    window.addEventListener("add-to-cart-animate", handleAnimate);
    return () => window.removeEventListener("add-to-cart-animate", handleAnimate);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {items.map((item) => (
        <div
          key={item.id}
          className="flying-particle"
          style={
            {
              "--start-x": `${item.startX - 22}px`,
              "--start-y": `${item.startY - 22}px`,
              "--end-x": `${item.endX - 22}px`,
              "--end-y": `${item.endY - 22}px`,
              backgroundImage: item.image ? `url(${item.image})` : "none",
              backgroundColor: item.image ? "transparent" : "var(--primary)",
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
