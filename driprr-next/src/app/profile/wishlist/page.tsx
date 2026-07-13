"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCartStore } from "@/store/cartStore";
import BottomNav from "@/components/layout/BottomNav";

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore();
  const { addItem }           = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center gap-3 border-b border-border-low bg-surface-1/40 backdrop-blur-md sticky top-0 z-30">
        <Link
          href="/profile"
          className="w-10 h-10 bg-surface-2 border border-border-low rounded-2xl flex items-center justify-center text-text-dim hover:text-text-primary transition-all"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-black tracking-widest uppercase">Wishlist</h1>
        </div>
        {items.length > 0 && (
          <span className="text-xs text-text-mute font-semibold">{items.length} item{items.length !== 1 ? "s" : ""}</span>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 relative z-10">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[55vh] gap-5 text-center">
            <div className="w-20 h-20 rounded-3xl bg-surface-1 border border-border-low flex items-center justify-center text-text-mute">
              <Heart size={32} />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl">Your wishlist is empty</h2>
              <p className="text-text-mute text-sm mt-1.5">Save items you love to buy them later.</p>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity"
            >
              <ShoppingBag size={16} />
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const discount = Math.round(
                ((item.originalPrice - item.price) / item.originalPrice) * 100
              );
              return (
                <div
                  key={item.id}
                  className="bg-surface-1 border border-border-low rounded-2xl overflow-hidden flex gap-3 p-3 group"
                >
                  {/* Image */}
                  <Link href={`/product/${item.id}`} className="shrink-0">
                    <div className="relative w-24 h-28 rounded-xl overflow-hidden bg-surface-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-text-mute uppercase">{item.brand}</p>
                      <Link href={`/product/${item.id}`}>
                        <h3 className="text-sm font-semibold text-text-primary mt-0.5 line-clamp-2 leading-snug hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                      </Link>
                      <div className="flex items-baseline gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-base font-black text-primary">
                          ₹{item.price.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-text-mute line-through">
                          ₹{item.originalPrice.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs font-semibold text-success">{discount}% off</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => {
                          addItem({
                            id: item.id,
                            name: item.name,
                            brand: item.brand,
                            price: item.price,
                            image: item.image,
                          });
                          removeItem(item.id);
                        }}
                        className="flex-1 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                      >
                        <ShoppingBag size={13} />
                        Move to Bag
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label="Remove from wishlist"
                        className="w-8 h-8 flex items-center justify-center text-text-mute hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Move all to bag */}
            {items.length > 1 && (
              <button
                onClick={() => {
                  items.forEach((item) => {
                    addItem({
                      id: item.id,
                      name: item.name,
                      brand: item.brand,
                      price: item.price,
                      image: item.image,
                    });
                    removeItem(item.id);
                  });
                }}
                className="w-full py-3.5 border-2 border-primary text-primary font-bold rounded-2xl text-sm hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag size={16} />
                Move All to Bag ({items.length} items)
              </button>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
