"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, MapPin, Clock, ShoppingBag, ChevronDown, ChevronUp, Check, Tag, X } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import BottomNav from "@/components/layout/BottomNav";

// Defaults — will be overridden by store settings
const DEFAULT_DELIVERY_FEE = 49;
const DEFAULT_FREE_DELIVERY_ABOVE = 999;

// Coupons validated from Supabase Coupon table

const deliverySlots = [
  { id: "s2", label: "Standard", time: "60–90 min", extra: 0 },
  { id: "s3", label: "Scheduled", time: "Choose time", extra: 0 },
];

interface DateOption {
  dateStr: string;
  dayLabel: string;
  dateNum: string;
  monthLabel: string;
  isToday: boolean;
}

const TIME_SLOTS = [
  { label: "11:00 AM - 12:00 PM", startHour: 11 },
  { label: "12:00 PM - 01:00 PM", startHour: 12 },
  { label: "01:00 PM - 02:00 PM", startHour: 13 },
  { label: "02:00 PM - 03:00 PM", startHour: 14 },
  { label: "03:00 PM - 04:00 PM", startHour: 15 },
  { label: "04:00 PM - 05:00 PM", startHour: 16 },
  { label: "05:00 PM - 06:00 PM", startHour: 17 },
  { label: "06:00 PM - 07:00 PM", startHour: 18 },
];

const getAvailableDates = (): DateOption[] => {
  const dates: DateOption[] = [];
  const today = new Date();
  const currentHour = today.getHours();
  // With 1 hour buffer, if currentHour >= 17 (5:00 PM), Today is unavailable because the last slot starts at 18:00.
  const startDayOffset = currentHour >= 17 ? 1 : 0;
  
  for (let i = startDayOffset; i < startDayOffset + 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    
    const isToday = i === 0;
    const isTomorrow = i === 1;
    
    let dayLabel = "";
    if (isToday) dayLabel = "Today";
    else if (isTomorrow) dayLabel = "Tomorrow";
    else {
      dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
    }
    
    const dateNum = d.toLocaleDateString("en-US", { day: "numeric" });
    const monthLabel = d.toLocaleDateString("en-US", { month: "short" });
    const dateStr = d.toISOString().split("T")[0];
    
    dates.push({
      dateStr,
      dayLabel,
      dateNum,
      monthLabel,
      isToday
    });
  }
  return dates;
};

const getAvailableTimeSlots = (selectedDateStr: string) => {
  const todayStr = new Date().toISOString().split("T")[0];
  if (selectedDateStr !== todayStr) {
    return TIME_SLOTS;
  }
  
  const currentHour = new Date().getHours();
  // Filter slots where startHour is at least 1 hour in the future (buffer)
  return TIME_SLOTS.filter((slot) => slot.startHour > currentHour + 1);
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const [mounted, setMounted] = useState(false);

  // Address form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");

  // Order options
  const [selectedSlot, setSelectedSlot] = useState("s2");
  const [showItems, setShowItems] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Scheduled delivery states
  const [availableDates, setAvailableDates] = useState<DateOption[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  // Coupon
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<null | { code: string; type: "percent" | "flat"; value: number; desc: string }>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");

  // Store delivery settings (fetched from DB)
  const [storeDeliveryFee, setStoreDeliveryFee] = useState(DEFAULT_DELIVERY_FEE);
  const [storeFreeAbove, setStoreFreeAbove] = useState(DEFAULT_FREE_DELIVERY_ABOVE);

  useEffect(() => {
    setMounted(true);
    // Pre-fill name if logged in
    if (user?.name) setName(user.name);
  }, [user]);

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
            setStoreDeliveryFee(data.deliveryFee ?? DEFAULT_DELIVERY_FEE);
            setStoreFreeAbove(data.freeDeliveryAbove ?? DEFAULT_FREE_DELIVERY_ABOVE);
          }
        });
    });
  }, [mounted, items]);

  useEffect(() => {
    if (mounted) {
      const dates = getAvailableDates();
      setAvailableDates(dates);
      if (dates.length > 0) {
        setSelectedDate(dates[0].dateStr);
        const slots = getAvailableTimeSlots(dates[0].dateStr);
        if (slots.length > 0) {
          setSelectedTime(slots[0].label);
        }
      }
    }
  }, [mounted]);

  useEffect(() => {
    if (selectedDate) {
      const slots = getAvailableTimeSlots(selectedDate);
      if (slots.length > 0) {
        if (!slots.some(s => s.label === selectedTime)) {
          setSelectedTime(slots[0].label);
        }
      } else {
        setSelectedTime("");
      }
    }
  }, [selectedDate, selectedTime]);

  // Redirect if not authenticated
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, isAuthenticated, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (mounted && items.length === 0) {
      router.push("/cart");
    }
  }, [mounted, items, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const subtotal = totalPrice();
  const deliveryFee = storeDeliveryFee === 0 ? 0 : (subtotal >= storeFreeAbove ? 0 : storeDeliveryFee);
  const discount = appliedCoupon
    ? appliedCoupon.type === "percent"
      ? Math.round(subtotal * appliedCoupon.value / 100)
      : appliedCoupon.value
    : 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  function applyCoupon() {
    setCouponError("");
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponError("Please enter a coupon code."); return; }
    setCouponLoading(true);

    import("@/lib/supabase").then(({ supabase }) => {
      supabase
        .from("Coupon")
        .select("*")
        .eq("code", code)
        .eq("active", true)
        .maybeSingle()
        .then(({ data: coupon, error }) => {
          if (error || !coupon) {
            setCouponError("Invalid coupon code.");
            setCouponLoading(false);
            return;
          }

          // Check min order
          if (coupon.minOrder > 0 && subtotal < coupon.minOrder) {
            setCouponError(`Minimum order of ₹${coupon.minOrder} required for this coupon.`);
            setCouponLoading(false);
            return;
          }

          // Check expiry
          if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            setCouponError("This coupon has expired.");
            setCouponLoading(false);
            return;
          }

          // Check usage limit
          if (coupon.uses >= coupon.maxUses) {
            setCouponError("This coupon has been fully redeemed.");
            setCouponLoading(false);
            return;
          }

          const desc = coupon.type === "percent"
            ? `${coupon.value}% off on your order`
            : `₹${coupon.value} flat off`;

          setAppliedCoupon({ code: coupon.code, type: coupon.type, value: coupon.value, desc });
          setCouponInput("");
          setCouponLoading(false);
        });
    });
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponError("");
  }

  async function handlePlaceOrder() {
    setError("");

    if (!name.trim())                        { setError("Please enter your name."); return; }
    if (!phone.trim() || phone.length < 10)  { setError("Please enter a valid phone number."); return; }
    if (!address.trim())                     { setError("Please enter your delivery address."); return; }
    if (!pincode.trim() || pincode.length < 6) { setError("Please enter a valid 6-digit pincode."); return; }
    if (selectedSlot === "s3") {
      if (!selectedDate) { setError("Please select a date for scheduled delivery."); return; }
      if (!selectedTime) { setError("Please select a time slot for scheduled delivery."); return; }
    }

    setLoading(true);

    try {
      let slotInfo = "Standard Delivery (60-90 min)";
      if (selectedSlot === "s3") {
        const dateObj    = new Date(selectedDate);
        const formatted  = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        slotInfo = `Scheduled for ${formatted}, ${selectedTime}`;
      }

      // Derive storeId — use the first item's storeId if available,
      // otherwise fall back to fetching from the product (best-effort)
      const firstItem = items[0];
      let storeId = firstItem?.storeId ?? "";

      if (!storeId && firstItem) {
        try {
          const { default: api } = await import("@/lib/axios");
          const prod = await api.get(`/products/${firstItem.id}`);
          storeId = prod.data?.storeId ?? "";
        } catch { /* leave storeId empty — backend will validate */ }
      }

      const { default: api } = await import("@/lib/axios");

      const payload = {
        userId:          user!.id,
        storeId,
        paymentMethod:   paymentMethod.toUpperCase() as "RAZORPAY" | "COD",
        subtotal,
        deliveryFee,
        discount,
        total,
        // Delivery address snapshot
        deliveryName:    name.trim(),
        deliveryPhone:   phone.trim(),
        deliveryAddress: address.trim(),
        deliveryLandmark: landmark.trim() || undefined,
        deliveryPincode: pincode.trim(),
        deliverySlot:    slotInfo,
        couponCode:      appliedCoupon?.code || undefined,
        items: items.map((item) => ({
          productId: item.id,
          name:      item.name,
          brand:     item.brand,
          size:      item.size || "Free Size",
          price:     item.price,
          qty:       item.quantity,
          imageUrl:  item.image || undefined,
        })),
      };

      // ── COD flow ──
      if (paymentMethod === "cod") {
        const res = await api.post("/orders", payload);
        const orderId = res.data.id;
        clearCart();
        router.push(`/order-confirmation?id=${orderId}&total=${total}&slot=${encodeURIComponent(slotInfo)}`);
        return;
      }

      // ── Razorpay flow ──
      // Step 1: Create a Razorpay order first (no DB order yet)
      const rzpRes = await api.post("/payments/create-order", {
        amount: total,
        receipt: `temp_${Date.now()}`,
      });
      const { razorpayOrderId, keyId } = rzpRes.data;

      // Step 3: Load Razorpay script if not already loaded
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
          document.body.appendChild(script);
        });
      }

      // Step 4: Open Razorpay checkout popup
      const razorpayKeyId = keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

      const options = {
        key: razorpayKeyId,
        amount: Math.round(total * 100), // paise
        currency: "INR",
        name: "DRIPRR",
        description: `Order on Driprr`,
        order_id: razorpayOrderId,
        prefill: {
          name: name.trim(),
          contact: phone.trim(),
          email: user?.email || "",
        },
        theme: {
          color: "#6C5CE7",
        },
        handler: async function (response: any) {
          // Payment succeeded — NOW create the order in our backend
          try {
            const orderRes = await api.post("/orders", payload);
            const orderId = orderRes.data.id;
            
            // Verify payment (non-blocking)
            try {
              await api.post("/payments/verify", {
                orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
            } catch {
              console.warn("Payment verification failed, but payment was successful");
            }
            
            clearCart();
            router.push(`/order-confirmation?id=${orderId}&total=${total}&slot=${encodeURIComponent(slotInfo)}`);
          } catch (err: any) {
            setError("Payment successful but order creation failed. Please contact support with your payment ID: " + response.razorpay_payment_id);
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setError("Payment was cancelled. Please try again.");
            setLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError(`Payment failed: ${response.error.description || "Unknown error"}. Please try again.`);
        setLoading(false);
      });
      rzp.open();

    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Failed to place order.";
      setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-text-primary pb-40">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border-low px-4 py-3 flex items-center gap-3">
          <Link href="/cart" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-1 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="font-display font-bold text-lg">Checkout</h1>
        </header>

        <div className="sm:grid sm:grid-cols-2 sm:gap-6 sm:p-6">

          {/* Left — Delivery details */}
          <div className="space-y-4 px-4 pt-4 sm:px-0 sm:pt-0">

            {/* Delivery address */}
            <section className="bg-surface-1 rounded-2xl border border-border-low p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  <h2 className="font-display font-bold text-base">Delivery Address</h2>
                </div>
                <button
                  type="button"
                  disabled={detectingLocation}
                  onClick={async () => {
                    if (!navigator.geolocation) { setError("Geolocation not supported"); return; }
                    setDetectingLocation(true);
                    navigator.geolocation.getCurrentPosition(
                      async (pos) => {
                        try {
                          const res = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`,
                            { headers: { "Accept-Language": "en" } }
                          );
                          const data = await res.json();
                          const addr = data.address ?? {};
                          const fullAddr = data.display_name?.split(",").slice(0, 3).join(",") ?? "";
                          setAddress(fullAddr);
                          setPincode(addr.postcode ?? "");
                          setLandmark(addr.suburb || addr.neighbourhood || "");
                        } catch { setError("Could not fetch address from location"); }
                        setDetectingLocation(false);
                      },
                      () => { setError("Location permission denied"); setDetectingLocation(false); },
                      { timeout: 10000 }
                    );
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  {detectingLocation ? (
                    <><span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Detecting...</>
                  ) : (
                    <><MapPin size={12} /> Use Current Location</>
                  )}
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-red-400 text-xs">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {/* Name + Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Name</label>
                    <input
                      type="text"
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-surface-2 border border-border-low focus:border-primary/60 rounded-xl text-sm text-text-primary placeholder-text-mute focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Phone</label>
                    <input
                      type="tel"
                      placeholder="10-digit number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="w-full px-3 py-2.5 bg-surface-2 border border-border-low focus:border-primary/60 rounded-xl text-sm text-text-primary placeholder-text-mute focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Address</label>
                  <textarea
                    placeholder="House no., street, area"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2.5 bg-surface-2 border border-border-low focus:border-primary/60 rounded-xl text-sm text-text-primary placeholder-text-mute focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Landmark + Pincode */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Landmark <span className="normal-case font-normal">(optional)</span></label>
                    <input
                      type="text"
                      placeholder="Near..."
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full px-3 py-2.5 bg-surface-2 border border-border-low focus:border-primary/60 rounded-xl text-sm text-text-primary placeholder-text-mute focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Pincode</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="6 digits"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full px-3 py-2.5 bg-surface-2 border border-border-low focus:border-primary/60 rounded-xl text-sm text-text-primary placeholder-text-mute focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Delivery slot */}
            <section className="bg-surface-1 rounded-2xl border border-border-low p-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-primary" />
                <h2 className="font-display font-bold text-base">Delivery Slot</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {deliverySlots.map((slot) => {
                  const active = selectedSlot === slot.id;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`flex flex-col items-center gap-0.5 p-3 rounded-xl border-2 transition-all text-center ${
                        active
                          ? "bg-primary/10 border-primary"
                          : "bg-surface-2 border-border-low hover:border-text-mute"
                      }`}
                    >
                      <span className={`text-xs font-bold ${active ? "text-primary" : "text-text-primary"}`}>
                        {slot.label}
                      </span>
                      <span className="text-[10px] text-text-mute">{slot.time}</span>
                    </button>
                  );
                })}
              </div>

              {/* Date & Time selection if Scheduled is selected */}
              {selectedSlot === "s3" && (
                <div className="mt-4 pt-4 border-t border-border-low space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-2">
                      Select Date
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                      {availableDates.map((dateOpt) => {
                        const active = selectedDate === dateOpt.dateStr;
                        return (
                          <button
                            key={dateOpt.dateStr}
                            type="button"
                            onClick={() => setSelectedDate(dateOpt.dateStr)}
                            className={`flex flex-col items-center min-w-[70px] p-2.5 rounded-xl border-2 transition-all text-center ${
                              active
                                ? "bg-primary/10 border-primary"
                                : "bg-surface-2 border-border-low hover:border-text-mute"
                            }`}
                          >
                            <span className="text-[10px] text-text-mute uppercase tracking-wider">
                              {dateOpt.dayLabel}
                            </span>
                            <span className={`text-base font-black my-0.5 ${active ? "text-primary" : "text-text-primary"}`}>
                              {dateOpt.dateNum}
                            </span>
                            <span className="text-[9px] text-text-mute uppercase">
                              {dateOpt.monthLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-2">
                      Select Time Slot
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {getAvailableTimeSlots(selectedDate).map((slot) => {
                        const active = selectedTime === slot.label;
                        return (
                          <button
                            key={slot.label}
                            type="button"
                            onClick={() => setSelectedTime(slot.label)}
                            className={`px-3 py-2.5 text-xs font-semibold rounded-xl border-2 transition-all text-center ${
                              active
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-surface-2 border-border-low hover:border-text-mute text-text-primary"
                            }`}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                    {getAvailableTimeSlots(selectedDate).length === 0 && (
                      <p className="text-xs text-red-400 mt-1">
                        No time slots available for today. Please select a different date.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>

          </div>

          {/* Right — Order summary */}
          <div className="px-4 mt-4 sm:px-0 sm:mt-0">
            <section className="bg-surface-1 rounded-2xl border border-border-low p-4">
              <button
                onClick={() => setShowItems(!showItems)}
                className="w-full flex items-center justify-between mb-3"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag size={16} className="text-primary" />
                  <h2 className="font-display font-bold text-base">
                    Order Summary <span className="text-text-mute font-normal text-sm">({items.length} items)</span>
                  </h2>
                </div>
                {showItems ? <ChevronUp size={16} className="text-text-mute" /> : <ChevronDown size={16} className="text-text-mute" />}
              </button>

              {/* Items list */}
              {showItems && (
                <div className="mb-4 space-y-3 border-b border-border-low pb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-2 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-text-primary truncate">{item.name}</p>
                        <p className="text-[10px] text-text-mute">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-bold text-text-primary shrink-0">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Coupon code */}
              <div className="mb-4 border-b border-border-low pb-4">
                {appliedCoupon ? (
                  <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-xl">
                    <Tag size={14} className="text-success shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-success">{appliedCoupon.code}</p>
                      <p className="text-[10px] text-success/80">{appliedCoupon.desc}</p>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-success/20 transition-colors"
                    >
                      <X size={13} className="text-success" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mute" />
                        <input
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponInput}
                          onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                          onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                          className="w-full pl-9 pr-3 py-2.5 bg-surface-2 border border-border-low focus:border-primary/60 rounded-xl text-sm text-text-primary placeholder-text-mute focus:outline-none transition-colors uppercase tracking-wider"
                        />
                      </div>
                      <button
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="px-4 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
                      >
                        {couponLoading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : "Apply"}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-red-400 text-[11px] mt-1.5 flex items-center gap-1">
                        <X size={11} /> {couponError}
                      </p>
                    )}
                    <p className="text-[10px] text-text-mute mt-1.5">
                      Enter a valid coupon code to get discount
                    </p>
                  </div>
                )}
              </div>

              {/* Price breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-text-dim">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-success text-xs font-semibold">
                    <span>Coupon ({appliedCoupon?.code})</span>
                    <span>−₹{discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-text-dim">
                  <span>Delivery</span>
                  <span className={deliveryFee === 0 ? "text-success font-semibold" : ""}>
                    {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="border-t border-border-low pt-2 flex justify-between font-bold text-base text-text-primary">
                  <span>Total</span>
                  <span>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Payment method */}
              <div className="mt-4 space-y-2">
                <p className="text-xs font-bold text-text-mute uppercase tracking-wider mb-2">Payment Method</p>

                {/* Razorpay */}
                <button
                  onClick={() => setPaymentMethod("razorpay")}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    paymentMethod === "razorpay"
                      ? "border-primary bg-primary/5"
                      : "border-border-low bg-surface-2 hover:border-text-mute"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-blue-400 text-[20px]">payments</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-text-primary">Razorpay</p>
                    <p className="text-[10px] text-text-mute">UPI · Cards · NetBanking · Wallets</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    paymentMethod === "razorpay" ? "border-primary bg-primary" : "border-border-low"
                  }`}>
                    {paymentMethod === "razorpay" && <Check size={12} className="text-on-primary" />}
                  </div>
                </button>

                {/* Cash on Delivery */}
                <button
                  onClick={() => setPaymentMethod("cod")}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    paymentMethod === "cod"
                      ? "border-primary bg-primary/5"
                      : "border-border-low bg-surface-2 hover:border-text-mute"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-success text-[20px]">local_atm</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-text-primary">Cash on Delivery</p>
                    <p className="text-[10px] text-text-mute">Pay when your order arrives</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    paymentMethod === "cod" ? "border-primary bg-primary" : "border-border-low"
                  }`}>
                    {paymentMethod === "cod" && <Check size={12} className="text-on-primary" />}
                  </div>
                </button>
              </div>

              <p className="text-[10px] text-text-mute mt-3 text-center">
                By placing this order you agree to our Terms of Service
              </p>
            </section>
          </div>

        </div>
      </div>

      {/* Sticky place order bar */}
      <div className="fixed bottom-16 inset-x-0 z-30 bg-background/97 backdrop-blur-xl border-t border-border-low">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-text-mute">
              {paymentMethod === "cod" ? "Cash on Delivery" : "Pay via Razorpay"}
            </p>
            <p className="text-base font-black text-primary">₹{total.toLocaleString("en-IN")}</p>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="shrink-0 px-6 py-3 bg-primary text-on-primary font-bold text-sm rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">
                  {paymentMethod === "cod" ? "local_atm" : "lock"}
                </span>
                {paymentMethod === "cod" ? "Place Order" : "Pay Now"}
              </>
            )}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
