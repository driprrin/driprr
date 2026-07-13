"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Package, Clock, MapPin } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";

function OrderConfirmationContent() {
  const params = useSearchParams();
  const orderId = params.get("id") || "ORD000000";
  const total = params.get("total") || "0";
  const slot = params.get("slot") || "Standard Delivery (60-90 min)";

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24 flex flex-col">
      <div className="max-w-md mx-auto w-full px-4 pt-16 flex flex-col items-center gap-6 flex-1">

        {/* Success icon */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-success/15 flex items-center justify-center">
            <CheckCircle size={48} className="text-success" />
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full border-2 border-success/30 animate-ping" />
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="font-display font-black text-2xl text-text-primary">Order Placed!</h1>
          <p className="text-text-mute text-sm mt-1">Your drip is on its way 🔥</p>
        </div>

        {/* Order ID card */}
        <div className="w-full bg-surface-1 rounded-2xl border border-border-low p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-text-mute font-semibold uppercase tracking-wider">Order ID</span>
            <span className="text-xs font-mono font-bold text-primary">{orderId}</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-text-mute font-semibold uppercase tracking-wider">Delivery Slot</span>
            <span className="text-xs font-semibold text-text-primary">{slot}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-mute font-semibold uppercase tracking-wider">Total Paid</span>
            <span className="text-base font-black text-text-primary">₹{parseInt(total).toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Status timeline */}
        <div className="w-full bg-surface-1 rounded-2xl border border-border-low p-4 space-y-4">
          <h2 className="font-display font-bold text-sm text-text-primary">Order Status</h2>

          {[
            { icon: CheckCircle, label: "Order Confirmed", sub: "Just now", done: true },
            { icon: Package, label: "Store Packing", sub: slot.startsWith("Scheduled") ? "Scheduled for store packing" : "~10 min", done: false },
            { icon: Clock, label: "Out for Delivery", sub: slot.startsWith("Scheduled") ? "Scheduled for dispatch" : "~25 min", done: false },
            { icon: MapPin, label: "Delivered", sub: slot.startsWith("Scheduled") ? slot : "~40 min", done: false },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                step.done ? "bg-success/20" : "bg-surface-2"
              }`}>
                <step.icon size={16} className={step.done ? "text-success" : "text-text-mute"} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${step.done ? "text-text-primary" : "text-text-mute"}`}>
                  {step.label}
                </p>
                <p className="text-[11px] text-text-mute">{step.sub}</p>
              </div>
              {step.done && (
                <CheckCircle size={14} className="text-success shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          <Link
            href="/orders"
            className="w-full py-3.5 bg-primary text-on-primary font-bold text-sm rounded-2xl text-center hover:opacity-90 transition-opacity"
          >
            Track Order
          </Link>
          <Link
            href="/"
            className="w-full py-3.5 bg-surface-1 border border-border-low text-text-primary font-semibold text-sm rounded-2xl text-center hover:bg-surface-2 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>

      </div>
      <BottomNav />
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
