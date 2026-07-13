"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Clock, ShoppingBag, CheckCircle,
  Truck, Package, ShieldCheck, Loader2, Wifi, WifiOff,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";

interface OrderItem {
  name: string;
  price: number;
  qty: number;
  size: string;
}

type OrderStatus = "Placed" | "Preparing" | "Ready" | "Out for Delivery" | "Delivered" | "Cancelled";

interface Order {
  id: string;
  storeName: string;
  status: OrderStatus;
  eta?: string;
  date: string;
  total: number;
  items: OrderItem[];
}



const STATUS_STEPS: OrderStatus[] = ["Placed", "Preparing", "Out for Delivery", "Delivered"];

const STATUS_META: Record<
  OrderStatus,
  { icon: React.ElementType; colorClass: string; bgClass: string }
> = {
  Placed:            { icon: ShieldCheck, colorClass: "text-blue-400",   bgClass: "bg-blue-400/10"   },
  Preparing:         { icon: Package,     colorClass: "text-amber-400",  bgClass: "bg-amber-400/10"  },
  Ready:             { icon: Package,     colorClass: "text-purple-400", bgClass: "bg-purple-400/10" },
  "Out for Delivery":{ icon: Truck,       colorClass: "text-primary",    bgClass: "bg-primary/10"    },
  Delivered:         { icon: CheckCircle, colorClass: "text-success",    bgClass: "bg-success/10"    },
  Cancelled:         { icon: ShoppingBag, colorClass: "text-red-400",    bgClass: "bg-red-400/10"    },
};

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META["Placed"];
  const Icon = meta.icon;
  const isLive = status === "Out for Delivery" || status === "Preparing";
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 ${meta.bgClass} border border-current/20 rounded-xl text-xs font-bold uppercase tracking-wide ${meta.colorClass}`}>
      <Icon size={14} className={isLive ? "animate-pulse" : ""} />
      <span className="text-[10px]">{status}</span>
    </div>
  );
}

// ── Progress stepper ──────────────────────────────────────────────────────────
function StatusStepper({ status }: { status: OrderStatus }) {
  const currentIndex = STATUS_STEPS.indexOf(status);
  return (
    <div className="mt-4 flex items-start justify-between relative">
      {/* Track */}
      <div className="absolute left-0 right-0 top-[10px] h-[2px] bg-border-low z-0" />
      <div
        className="absolute left-0 top-[10px] h-[2px] bg-primary transition-all duration-700 z-0"
        style={{ width: `${(currentIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
      />
      {STATUS_STEPS.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isActive    = idx === currentIndex;
        return (
          <div key={step} className="flex flex-col items-center relative z-10 flex-1">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all duration-500
                ${isActive
                  ? "bg-primary border-primary text-on-primary scale-110 shadow-lg shadow-primary/30"
                  : isCompleted
                    ? "bg-primary border-primary text-on-primary"
                    : "bg-surface-2 border-border-low text-text-mute"
                }`}
            >
              {isCompleted ? (
                <CheckCircle size={11} className="text-on-primary" />
              ) : (
                idx + 1
              )}
            </div>
            <span
              className={`text-[8px] font-black uppercase tracking-wider mt-1.5 text-center leading-tight max-w-[52px]
                ${isActive ? "text-primary" : isCompleted ? "text-text-primary" : "text-text-mute"}`}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function StatusToast({ orderId, status, onDismiss }: { orderId: string; status: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed top-4 inset-x-4 z-[9999] animate-slide-up">
      <div className="max-w-sm mx-auto bg-surface-1 border border-primary/40 rounded-2xl shadow-2xl p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Truck size={18} className="text-primary animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-text-primary">Order Update</p>
          <p className="text-xs text-text-dim truncate">
            {orderId} → <span className="text-primary font-bold">{status}</span>
          </p>
        </div>
        <button onClick={onDismiss} className="text-text-mute hover:text-text-primary transition-colors">
          ×
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { token, isAuthenticated } = useAuthStore();
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected" | "off">("off");
  const [toast, setToast] = useState<{ orderId: string; status: string } | null>(null);

  // Keep a ref to orders so socket handler always sees latest
  const ordersRef = useRef<Order[]>([]);
  useEffect(() => { ordersRef.current = orders; }, [orders]);

  // Load orders from backend, fallback to empty
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setOrders([]);
      setLoading(false);
      return;
    }

    // Map backend status (UPPERCASE) to display status
    const statusMap: Record<string, OrderStatus> = {
      "PLACED": "Placed",
      "PREPARING": "Preparing",
      "READY": "Preparing",
      "OUT_FOR_DELIVERY": "Out for Delivery",
      "DELIVERED": "Delivered",
      "CANCELLED": "Delivered",
      // Also handle already-mapped display values
      "Placed": "Placed",
      "Preparing": "Preparing",
      "Out for Delivery": "Out for Delivery",
      "Delivered": "Delivered",
    };

    import("@/lib/axios").then(({ default: api }) => {
      api.get("/orders")
        .then((r) => {
          const mapped: Order[] = (r.data ?? []).map((o: any) => ({
            id:        o.id,
            storeName: o.store?.name ?? "Store",
            status:    (statusMap[o.status] ?? "Placed") as OrderStatus,
            eta:       o.eta,
            date:      new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
            total:     o.total,
            items:     (o.items ?? []).map((item: any) => ({
              name: item.name, price: item.price, qty: item.qty, size: item.size,
            })),
          }));
          setOrders(mapped);
        })
        .catch(() => setOrders([]))
        .finally(() => setLoading(false));
    });
  }, [isAuthenticated, token]);

  // ── WebSocket real-time tracking ──────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setWsStatus("off");
      return;
    }

    setWsStatus("connecting");

    let s: ReturnType<typeof connectSocket>;
    try {
      s = connectSocket(token);
    } catch {
      setWsStatus("disconnected");
      return;
    }

    s.on("connect", () => setWsStatus("connected"));
    s.on("disconnect", () => setWsStatus("disconnected"));
    s.on("connect_error", () => setWsStatus("disconnected"));

    // Server emits: { orderId: string, status: OrderStatus, eta?: string }
    s.on("order:status", (data: { orderId: string; status: OrderStatus; eta?: string }) => {
      setOrders((prev) => {
        const updated = prev.map((o) =>
          o.id === data.orderId
            ? { ...o, status: data.status, eta: data.eta ?? o.eta }
            : o
        );
        localStorage.setItem("driprr_orders", JSON.stringify(updated));
        return updated;
      });
      setToast({ orderId: data.orderId, status: data.status });
    });

    // Server emits new order placed from another device/session
    s.on("order:new", (order: Order) => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === order.id)) return prev;
        const updated = [order, ...prev];
        localStorage.setItem("driprr_orders", JSON.stringify(updated));
        return updated;
      });
    });

    return () => {
      s.off("order:status");
      s.off("order:new");
      s.off("connect");
      s.off("disconnect");
      s.off("connect_error");
      disconnectSocket();
      setWsStatus("off");
    };
  }, [isAuthenticated, token]);

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24 relative overflow-hidden">
      {/* Toast */}
      {toast && (
        <StatusToast
          orderId={toast.orderId}
          status={toast.status}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center justify-between border-b border-border-low bg-surface-1/40 backdrop-blur-md sticky top-0 z-30 max-w-4xl mx-auto w-full">
        <Link
          href="/"
          className="w-10 h-10 bg-surface-2 border border-border-low rounded-2xl flex items-center justify-center text-text-dim hover:text-text-primary transition-all"
        >
          <ArrowLeft size={18} />
        </Link>

        <h1 className="text-lg font-black tracking-widest uppercase">MY ORDERS</h1>

        {/* WebSocket status indicator */}
        <div className="w-10 flex justify-end">
          {wsStatus === "connected" && (
            <div title="Live updates active" className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <Wifi size={14} className="text-success" />
            </div>
          )}
          {wsStatus === "connecting" && (
            <Loader2 size={14} className="text-text-mute animate-spin" />
          )}
          {wsStatus === "disconnected" && (
            <WifiOff size={14} className="text-text-mute" title="Reconnecting..." />
          )}
        </div>
      </header>

      {/* Live banner */}
      {wsStatus === "connected" && orders.some((o) => o.status !== "Delivered") && (
        <div className="max-w-4xl mx-auto mx-5 mt-4 mx-4">
          <div className="mx-5 flex items-center gap-2 px-4 py-2.5 bg-success/10 border border-success/30 rounded-2xl">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
            <p className="text-xs font-semibold text-success">
              Live tracking active — order updates will appear automatically
            </p>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-5 pt-6 relative z-10 text-left">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center max-w-sm mx-auto gap-4">
            <div className="w-16 h-16 rounded-3xl bg-surface-2 border border-border-low flex items-center justify-center text-text-dim">
              <ShoppingBag size={28} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase">No orders yet</h2>
              <p className="text-text-dim text-xs mt-1.5 leading-relaxed">
                You haven't dispatched any streetwear drops yet.
              </p>
            </div>
            <Link
              href="/"
              className="px-5 py-3 bg-primary text-on-primary font-bold text-xs uppercase rounded-xl transition-all shadow-md hover:opacity-90"
            >
              Shop Streetwear
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-surface-1 border border-border-low rounded-3xl p-5 shadow-sm flex flex-col gap-4 overflow-hidden"
              >
                {/* Header */}
                <div className="flex flex-wrap justify-between items-start gap-2 pb-4 border-b border-border-low">
                  <div>
                    <h3 className="font-display font-black text-lg leading-tight">{o.storeName}</h3>
                    <p className="text-[10px] font-bold text-text-mute uppercase tracking-widest mt-1">
                      {o.id} · {o.date}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {o.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold truncate">{item.name}</p>
                        <p className="text-[10px] text-text-dim mt-0.5">
                          Size: {item.size} · Qty: {item.qty}
                        </p>
                      </div>
                      <span className="font-bold text-text-dim ml-4 shrink-0">
                        ₹{(item.price * item.qty).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Stepper — only for active orders */}
                {o.status !== "Delivered" && (
                  <div className="pt-2 pb-1">
                    {o.eta && (
                      <p className="text-[10px] font-black uppercase text-text-mute tracking-widest flex items-center gap-1 mb-1">
                        <Clock size={11} className="text-primary" />
                        ETA: {o.eta}
                      </p>
                    )}
                    <StatusStepper status={o.status} />
                  </div>
                )}

                {/* Footer */}
                <div className="pt-3 border-t border-border-low flex justify-between items-center">
                  <span className="text-xs font-bold text-text-dim uppercase tracking-wider">Total Paid</span>
                  <span className="text-primary font-black text-lg">
                    ₹{o.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
