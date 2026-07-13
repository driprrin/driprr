"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Trash2, ShoppingBag, Tag } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import BottomNav from "@/components/layout/BottomNav";
import { useEffect, useState } from "react";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [mounted, setMounted] = useState(false);
  const [storeDeliveryFee, setStoreDeliveryFee] = useState(0);
  const [storeFreeAbove, setStoreFreeAbove] = useState(0);

  useEffect(() => setMounted(true), []);

  // Fetch store delivery settings
  useEffect(() => {
    if (!mounted || items.length === 0) return;
    const storeId = items[0]?.storeId;
    if (!storeId) return;

    import("@/lib/supabase").then(({ supabase }) => {
      supabase
        .from("Store")
        .select("deliveryFee, freeDeliveryAbove")
        .eq("id", storeId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setStoreDeliveryFee(data.deliveryFee ?? 0);
            setStoreFreeAbove(data.freeDeliveryAbove ?? 0);
          }
        });
    });
  }, [mounted, items]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const subtotal = totalPrice();
  const deliveryFee = storeDeliveryFee === 0 ? 0 : (storeFreeAbove > 0 && subtotal >= storeFreeAbove ? 0 : storeDeliveryFee);
  const total = subtotal + deliveryFee;
  const savings = subtotal > 0 ? Math.round(subtotal * 0.1) : 0; // mock savings

  function handleCheckout() {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    router.push("/checkout");
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background text-text-primary pb-24">
        <div className="max-w-5xl mx-auto">
          <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border-low px-4 py-3 flex items-center gap-3">
            <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-1 transition-colors">
              <ChevronLeft size={20} />
            </Link>
            <h1 className="font-display font-bold text-lg">My Bag</h1>
          </header>

          <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-5">
            <div className="w-24 h-24 rounded-full bg-surface-1 flex items-center justify-center">
              <ShoppingBag size={40} className="text-text-mute" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-text-primary">Your bag is empty</h2>
              <p className="text-text-mute text-sm mt-1">Add items to get started</p>
            </div>
            <Link
              href="/"
              className="px-6 py-3 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity"
            >
              Browse Products
            </Link>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary pb-40">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border-low px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-1 transition-colors">
              <ChevronLeft size={20} />
            </Link>
            <h1 className="font-display font-bold text-lg">My Bag</h1>
            <span className="text-xs text-text-mute">({items.length} {items.length === 1 ? "item" : "items"})</span>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
          >
            Clear all
          </button>
        </header>

        {/* Free delivery progress */}
        {storeDeliveryFee > 0 && storeFreeAbove > 0 && subtotal < storeFreeAbove && (
          <div className="mx-4 mt-4 p-3 bg-surface-1 rounded-2xl border border-border-low">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-dim">
                Add <span className="text-primary font-bold">₹{(storeFreeAbove - subtotal).toLocaleString("en-IN")}</span> more for free delivery
              </span>
              <span className="text-xs text-text-mute">₹{storeFreeAbove}</span>
            </div>
            <div className="h-1.5 bg-border-low rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min((subtotal / storeFreeAbove) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {((storeDeliveryFee === 0) || (storeFreeAbove > 0 && subtotal >= storeFreeAbove)) && subtotal > 0 && (
          <div className="mx-4 mt-4 p-3 bg-success/10 border border-success/30 rounded-2xl flex items-center gap-2">
            <Tag size={14} className="text-success" />
            <span className="text-xs text-success font-semibold">Free delivery on this order!</span>
          </div>
        )}

        {/* Cart items */}
        <div className="px-4 mt-4 flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="bg-surface-1 rounded-2xl border border-border-low overflow-hidden">
              <div className="flex gap-3 p-3">
                {/* Image */}
                <div className="relative w-24 h-28 rounded-xl overflow-hidden bg-surface-2 shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-text-mute uppercase">{item.brand}</p>
                    <h3 className="text-sm font-semibold text-text-primary mt-0.5 line-clamp-2 leading-snug">{item.name}</h3>
                    {item.size && (
                      <p className="text-xs text-text-dim mt-0.5">Size: <span className="font-bold text-text-primary">{item.size}</span></p>
                    )}
                    <p className="text-base font-black text-primary mt-1">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-[11px] text-text-mute">₹{item.price.toLocaleString("en-IN")} each</p>
                    )}
                  </div>

                  {/* Qty + remove */}
                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity controls */}
                    <div className="flex items-center bg-surface-2 border border-border-low rounded-xl overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-text-primary hover:bg-surface-1 transition-colors text-lg font-bold"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-text-primary select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= 10}
                        className="w-8 h-8 flex items-center justify-center text-text-primary hover:bg-surface-1 transition-colors text-lg font-bold disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label="Remove item"
                      className="w-8 h-8 flex items-center justify-center text-text-mute hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="mx-4 mt-4 bg-surface-1 rounded-2xl border border-border-low p-4 space-y-3">
          <h2 className="font-display font-bold text-base">Order Summary</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-text-dim">
              <span>Subtotal ({items.length} items)</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-text-dim">
              <span>Delivery</span>
              <span className={deliveryFee === 0 ? "text-success font-semibold" : ""}>
                {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
              </span>
            </div>
            {savings > 0 && (
              <div className="flex justify-between text-success text-xs">
                <span>You save</span>
                <span>−₹{savings.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="border-t border-border-low pt-2 flex justify-between font-bold text-base text-text-primary">
              <span>Total</span>
              <span>₹{total.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Spacer for sticky bar */}
        <div className="h-4" />
      </div>

      {/* Sticky checkout bar */}
      <div className="fixed bottom-16 inset-x-0 z-30 bg-background/97 backdrop-blur-xl border-t border-border-low">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-text-mute">{items.length} items · {deliveryFee === 0 ? "Free delivery" : `+₹${deliveryFee} delivery`}</p>
            <p className="text-base font-black text-primary">₹{total.toLocaleString("en-IN")}</p>
          </div>
          <button
            onClick={handleCheckout}
            className="shrink-0 px-6 py-3 bg-primary text-on-primary font-bold text-sm rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <ShoppingBag size={16} />
            Checkout
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
