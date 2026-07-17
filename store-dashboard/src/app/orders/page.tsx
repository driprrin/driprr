"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDashboardStore, Order, OrderStatus } from "@/store/dashboardStore";
import { useAuthStore } from "@/store/authStore";
import {
  Search, ChevronDown, Package, Truck, CheckCircle,
  ShieldCheck, ShoppingBag, X, Phone, MapPin,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

const ALL_STATUSES: OrderStatus[] = ["Placed", "Preparing", "Ready", "Out for Delivery", "Delivered", "Cancelled"];

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  Placed:             { bg: "bg-info/10",    text: "text-info",    border: "border-info/20"    },
  Preparing:          { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20" },
  Ready:              { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  "Out for Delivery": { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  Delivered:          { bg: "bg-success/10", text: "text-success", border: "border-success/20" },
  Cancelled:          { bg: "bg-danger/10",  text: "text-danger",  border: "border-danger/20"  },
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  Placed: "Preparing", Preparing: "Ready",
  Ready: "Out for Delivery", "Out for Delivery": "Delivered",
};

// ── Order Detail Panel ────────────────────────────────────────────────────────
function OrderPanel({ order, onClose, onStatusUpdate }: { order: Order; onClose: () => void; onStatusUpdate: (id: string, status: OrderStatus) => void }) {
  const meta   = STATUS_STYLES[order.status];
  const next   = NEXT_STATUS[order.status];

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-surface-1 border-l border-border-low z-50 flex flex-col animate-slide-up overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-low sticky top-0 bg-surface-1 z-10">
          <div>
            <p className="text-xs font-mono font-bold text-text-mute">{order.id}</p>
            <h2 className="font-display font-black text-lg">{order.customerName}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 hover:bg-border-low transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 px-5 py-5 space-y-5">
          {/* Status */}
          <div className={`flex items-center justify-between p-3 rounded-xl border ${meta.bg} ${meta.border}`}>
            <span className={`text-sm font-black uppercase tracking-wider ${meta.text}`}>{order.status}</span>
            {next && (
              <button
              onClick={() => onStatusUpdate(order.id, next)}
                className="text-xs font-bold px-3 py-1.5 bg-primary text-on-primary rounded-xl hover:opacity-90 transition-opacity"
              >
                Mark as {next}
              </button>
            )}
          </div>

          {/* Customer & Delivery Details */}
          <div className="bg-surface-2 rounded-2xl p-4 space-y-2">
            <p className="text-[11px] font-black text-text-mute uppercase tracking-wider mb-3">Customer & Delivery</p>
            <div className="flex items-center gap-2 text-sm">
              <Phone size={14} className="text-primary shrink-0" />
              <span className="text-text-primary font-semibold">{order.customerPhone}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-text-primary">{order.address}</span>
                {order.landmark && <span className="text-text-mute text-xs block">Near: {order.landmark}</span>}
                {order.pincode && <span className="text-text-mute text-xs block">PIN: {order.pincode}</span>}
              </div>
            </div>
            {order.deliverySlot && (
              <div className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-primary text-[14px]">schedule</span>
                <span className="text-text-dim">{order.deliverySlot}</span>
              </div>
            )}
            {order.couponCode && (
              <div className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-success text-[14px]">local_offer</span>
                <span className="text-success font-semibold">Coupon: {order.couponCode}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <p className="text-[11px] font-black text-text-mute uppercase tracking-wider mb-3">Items</p>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm bg-surface-2 rounded-xl px-3 py-2.5">
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary">{item.name}</p>
                    <p className="text-xs text-text-mute">Size: {item.size} · Qty: {item.qty}</p>
                  </div>
                  <span className="font-bold text-text-primary shrink-0">{formatCurrency(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="bg-surface-2 rounded-2xl p-4 space-y-2 text-sm">
            <p className="text-[11px] font-black text-text-mute uppercase tracking-wider mb-3">Payment</p>
            <div className="flex justify-between text-text-dim">
              <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-success text-xs font-semibold">
                <span>Discount</span><span>−{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-text-dim">
              <span>Delivery</span>
              <span className={order.deliveryFee === 0 ? "text-success font-semibold" : ""}>
                {order.deliveryFee === 0 ? "FREE" : formatCurrency(order.deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between font-black text-base text-text-primary border-t border-border-low pt-2">
              <span>Total</span><span className="text-primary">{formatCurrency(order.total)}</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-text-mute uppercase">Payment:</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                order.paymentMethod === "cod" ? "bg-success/10 text-success" : "bg-info/10 text-info"
              }`}>
                {order.paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay"}
              </span>
            </div>
          </div>

          {/* Cancel */}
          {order.status !== "Delivered" && order.status !== "Cancelled" && (
            <button
              onClick={() => { onStatusUpdate(order.id, "Cancelled"); onClose(); }}
              className="w-full py-3 border-2 border-danger/30 bg-danger/5 text-danger font-bold rounded-2xl text-sm hover:bg-danger/10 transition-colors"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { orders, updateOrderStatus, setOrders } = useDashboardStore();
  const { token, user } = useAuthStore();
  const [activeTab, setActiveTab]     = useState<"All" | OrderStatus>("All");
  const [search, setSearch]           = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch real orders from backend on mount
  useEffect(() => {
    if (!token || !user?.storeId) return;

    // Map backend status to display status
    const statusMap: Record<string, OrderStatus> = {
      "PLACED": "Placed",
      "PREPARING": "Preparing",
      "READY": "Ready",
      "OUT_FOR_DELIVERY": "Out for Delivery",
      "DELIVERED": "Delivered",
      "CANCELLED": "Cancelled",
      "Placed": "Placed",
      "Preparing": "Preparing",
      "Ready": "Ready",
      "Out for Delivery": "Out for Delivery",
      "Delivered": "Delivered",
      "Cancelled": "Cancelled",
    };

    import("@/lib/axios").then(({ default: api }) => {
      api.get(`/orders?storeId=${user.storeId}`)
        .then((r) => {
          const mapped = (r.data ?? []).map((o: any) => ({
            id:            o.id,
            customerId:    o.userId,
            customerName:  o.deliveryName,
            customerPhone: o.deliveryPhone,
            address:       o.deliveryAddress,
            landmark:      o.deliveryLandmark ?? "",
            pincode:       o.deliveryPincode ?? "",
            status:        (statusMap[o.status] ?? "Placed") as OrderStatus,
            paymentMethod: (o.paymentMethod?.toLowerCase() ?? "cod") as "razorpay" | "cod",
            deliverySlot:  o.deliverySlot ?? "",
            couponCode:    o.couponCode ?? "",
            items:         (o.items ?? []).map((item: any) => ({
              name: item.name, price: item.price, qty: item.qty, size: item.size, imageUrl: item.imageUrl,
            })),
            subtotal:    o.subtotal ?? o.total,
            deliveryFee: o.deliveryFee ?? 49,
            discount:    o.discount ?? 0,
            total:       o.total,
            placedAt:    o.createdAt,
            eta:         o.eta ?? "",
          }));
          setOrders(mapped);
        })
        .catch(() => {});
    });
  }, [token, user?.storeId, setOrders]);

  // Calls backend + updates local state
  async function handleStatusUpdate(orderId: string, status: OrderStatus) {
    updateOrderStatus(orderId, status); // optimistic
    try {
      const { default: api } = await import("@/lib/axios");
      // Map frontend status labels to backend enum
      const statusMap: Record<OrderStatus, string> = {
        "Placed":             "PLACED",
        "Preparing":          "PREPARING",
        "Ready":              "READY",
        "Out for Delivery":   "OUT_FOR_DELIVERY",
        "Delivered":          "DELIVERED",
        "Cancelled":          "CANCELLED",
      };
      await api.patch(`/orders/${orderId}/status`, { status: statusMap[status] });
    } catch { /* revert is optional — optimistic is fine for now */ }
  }

  const filtered = orders.filter((o) => {
    const matchTab    = activeTab === "All" || o.status === activeTab;
    const matchSearch = !search || o.id.toLowerCase().includes(search.toLowerCase()) ||
                        o.customerName.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const countFor = (s: OrderStatus) => orders.filter((o) => o.status === s).length;

  return (
    <DashboardLayout title="Orders">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
        {(["All", ...ALL_STATUSES] as const).map((tab) => {
          const count = tab === "All" ? orders.length : countFor(tab);
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                active
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface-1 border-border-low text-text-dim hover:border-text-mute"
              }`}
            >
              {tab}
              {count > 0 && (
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                  active ? "bg-on-primary/20 text-on-primary" : "bg-surface-2 text-text-mute"
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mute" />
        <input
          type="text"
          placeholder="Search by order ID or customer name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-surface-1 border border-border-low rounded-xl text-sm text-text-primary placeholder-text-mute focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-surface-1 border border-border-low rounded-2xl overflow-hidden">
        {/* Desktop header */}
        <div className="hidden md:grid grid-cols-[1fr_1fr_2fr_1fr_1fr_auto] gap-4 px-4 py-3 border-b border-border-low text-[11px] font-black uppercase tracking-wider text-text-mute">
          <span>Order ID</span><span>Customer</span><span>Items</span>
          <span>Total</span><span>Status</span><span>Action</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-mute">
            <ShoppingBag size={28} />
            <p className="text-sm">No orders found</p>
          </div>
        ) : (
          <div className="divide-y divide-border-low">
            {filtered.map((o) => {
              const meta = STATUS_STYLES[o.status];
              const next = NEXT_STATUS[o.status];
              return (
                <div
                  key={o.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr_1fr_1fr_auto] gap-3 md:gap-4 px-4 py-3.5 hover:bg-surface-2 transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(o)}
                >
                  <div>
                    <p className="text-xs font-mono font-bold text-text-mute">{o.id}</p>
                    <p className="text-[10px] text-text-mute">{formatDate(o.placedAt)}</p>
                  </div>
                  <p className="text-sm font-semibold text-text-primary self-center">{o.customerName}</p>
                  <p className="text-xs text-text-dim self-center line-clamp-1">
                    {o.items.map((i) => i.name).join(", ")}
                  </p>
                  <p className="text-sm font-black text-primary self-center">{formatCurrency(o.total)}</p>
                  <div className="self-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${meta.bg} ${meta.text} ${meta.border}`}>
                      {o.status}
                    </span>
                  </div>
                  {/* Quick action */}
                  <div className="self-center" onClick={(e) => e.stopPropagation()}>
                    {next ? (
                      <button
                        onClick={() => handleStatusUpdate(o.id, next)}
                        className="text-[10px] font-bold px-2.5 py-1.5 bg-primary text-on-primary rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
                      >
                        → {next}
                      </button>
                    ) : (
                      <span className="text-[10px] text-text-mute">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderPanel order={selectedOrder} onClose={() => setSelectedOrder(null)} onStatusUpdate={handleStatusUpdate} />
      )}
    </DashboardLayout>
  );
}
