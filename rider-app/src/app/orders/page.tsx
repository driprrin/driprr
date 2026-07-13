"use client";

import { useState } from "react";
import { CheckCircle, Package, Clock, IndianRupee, ChevronDown, ChevronUp } from "lucide-react";
import { useRiderStore, DeliveryOrder } from "@/store/riderStore";
import BottomNav from "@/components/BottomNav";

function OrderCard({ order }: { order: DeliveryOrder }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(order.placedAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
  const earned = Math.round(order.total * 0.1);

  return (
    <div className="bg-surface-1 border border-border-low rounded-2xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <CheckCircle size={18} className="text-success" />
          </div>
          <div>
            <p className="font-bold text-text-primary text-sm">{order.storeName}</p>
            <p className="text-xs text-text-mute">{date}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-black text-success">+₹{earned}</span>
          {expanded ? <ChevronUp size={16} className="text-text-mute" /> : <ChevronDown size={16} className="text-text-mute" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border-low space-y-2 text-sm">
          <div className="flex justify-between text-text-dim">
            <span>Order</span><span className="font-mono text-xs">{order.orderId}</span>
          </div>
          <div className="flex justify-between text-text-dim">
            <span>Customer</span><span className="text-text-primary font-semibold">{order.customerName}</span>
          </div>
          <div className="flex justify-between text-text-dim">
            <span>Delivered to</span><span className="text-text-primary text-right max-w-[55%]">{order.deliveryAddress}</span>
          </div>
          <div className="flex justify-between text-text-dim">
            <span>Order value</span><span className="text-text-primary font-semibold">₹{order.total.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-border-low">
            <span className="font-bold text-text-primary">Your earning</span>
            <span className="font-black text-success">₹{earned}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { deliveryHistory } = useRiderStore();

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24">
      <header className="px-5 pt-8 pb-5">
        <h1 className="font-display font-black text-2xl">Delivery History</h1>
        <p className="text-text-mute text-sm mt-0.5">{deliveryHistory.length} completed deliveries</p>
      </header>

      <div className="px-5 space-y-3">
        {deliveryHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-text-mute">
            <div className="w-16 h-16 rounded-3xl bg-surface-1 border border-border-low flex items-center justify-center">
              <Package size={28} />
            </div>
            <div className="text-center">
              <p className="font-bold text-text-dim">No deliveries yet</p>
              <p className="text-xs mt-1">Your completed deliveries will appear here</p>
            </div>
          </div>
        ) : (
          deliveryHistory.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>

      <BottomNav />
    </div>
  );
}
