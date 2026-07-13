"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Phone, Package, CheckCircle,
  Navigation, Wifi, WifiOff, Loader2, Bike,
  ChevronRight, Clock, IndianRupee,
} from "lucide-react";
import { useRiderStore, DeliveryOrder, DeliveryStatus } from "@/store/riderStore";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import api from "@/lib/api";
import BottomNav from "@/components/BottomNav";

const STATUS_NEXT: Partial<Record<DeliveryStatus, { label: string; next: DeliveryStatus; color: string }>> = {
  ASSIGNED:         { label: "Confirm Pickup",   next: "PICKED_UP",        color: "bg-warning text-black"   },
  PICKED_UP:        { label: "Start Delivery",   next: "OUT_FOR_DELIVERY", color: "bg-primary text-on-primary" },
  OUT_FOR_DELIVERY: { label: "Mark Delivered",   next: "DELIVERED",        color: "bg-success text-white"   },
};

const STATUS_LABEL: Record<DeliveryStatus, { label: string; color: string }> = {
  ASSIGNED:         { label: "Pickup Pending",    color: "text-warning"  },
  PICKED_UP:        { label: "Picked Up",          color: "text-primary"  },
  OUT_FOR_DELIVERY: { label: "Out for Delivery",   color: "text-primary"  },
  DELIVERED:        { label: "Delivered",           color: "text-success"  },
  FAILED:           { label: "Failed",              color: "text-danger"   },
};

// Mock nearby orders — replace with real WebSocket events
const MOCK_NEARBY: DeliveryOrder[] = [
  {
    id: "del-001", orderId: "ORD-9284", status: "ASSIGNED",
    storeName: "Urban Vault", storeAddress: "MG Road, Hubli",
    customerName: "Aryan K.", customerPhone: "9876543210",
    deliveryAddress: "Keshwapur, Hubli", deliveryPincode: "580023",
    total: 3548, itemCount: 2, placedAt: new Date().toISOString(), eta: "8 min",
  },
  {
    id: "del-002", orderId: "ORD-9281", status: "ASSIGNED",
    storeName: "Street Code", storeAddress: "Station Road, Hubli",
    customerName: "Sneha M.", customerPhone: "9876543211",
    deliveryAddress: "Vidyanagar, Hubli", deliveryPincode: "580031",
    total: 2948, itemCount: 1, placedAt: new Date(Date.now() - 120000).toISOString(), eta: "12 min",
  },
];

export default function HomePage() {
  const router    = useRouter();
  const { user, token, isAuthenticated, isOnline, activeDelivery,
          setOnline, setActiveDelivery, addToHistory, updateEarnings } = useRiderStore();

  const [wsStatus,     setWsStatus]     = useState<"off"|"connecting"|"connected"|"disconnected">("off");
  const [nearbyOrders, setNearbyOrders] = useState<DeliveryOrder[]>([]);
  const [accepting,    setAccepting]    = useState<string | null>(null);
  const [updating,     setUpdating]     = useState(false);
  const [mounted,      setMounted]      = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !isAuthenticated) router.push("/login");
  }, [mounted, isAuthenticated, router]);

  // WebSocket for live order assignments
  useEffect(() => {
    if (!isAuthenticated || !token || !isOnline) return;

    setWsStatus("connecting");
    let s: ReturnType<typeof connectSocket>;
    try {
      s = connectSocket(token);
    } catch { setWsStatus("disconnected"); return; }

    s.on("connect",       () => { setWsStatus("connected"); });
    s.on("disconnect",    () => setWsStatus("disconnected"));
    s.on("connect_error", () => setWsStatus("disconnected"));

    // New order assigned to this rider
    s.on("delivery:assigned", (order: DeliveryOrder) => {
      setNearbyOrders((prev) => {
        if (prev.some((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });
    });

    // Load mock nearby orders while backend WS isn't emitting yet
    setNearbyOrders(MOCK_NEARBY);

    return () => {
      s.off("delivery:assigned");
      s.off("connect"); s.off("disconnect"); s.off("connect_error");
      disconnectSocket();
      setWsStatus("off");
    };
  }, [isAuthenticated, token, isOnline]);

  async function handleAccept(order: DeliveryOrder) {
    setAccepting(order.id);
    try {
      // In production: PATCH /api/deliveries/:orderId/accept
      await new Promise((r) => setTimeout(r, 800));
      setActiveDelivery(order);
      setNearbyOrders((prev) => prev.filter((o) => o.id !== order.id));
    } finally {
      setAccepting(null);
    }
  }

  async function handleStatusUpdate() {
    if (!activeDelivery) return;
    const next = STATUS_NEXT[activeDelivery.status];
    if (!next) return;

    setUpdating(true);
    try {
      // In production: PATCH /api/deliveries/:id/status { status: next.next }
      await new Promise((r) => setTimeout(r, 1000));

      if (next.next === "DELIVERED") {
        const completed = { ...activeDelivery, status: "DELIVERED" as DeliveryStatus };
        addToHistory(completed);
        updateEarnings(Math.round(activeDelivery.total * 0.1)); // 10% commission
        setActiveDelivery(null);
      } else {
        setActiveDelivery({ ...activeDelivery, status: next.next });
      }
    } finally {
      setUpdating(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24">
      {/* Header */}
      <header className="px-5 pt-8 pb-5 flex items-center justify-between">
        <div>
          <p className="text-text-mute text-xs font-semibold">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},</p>
          <h1 className="font-display font-black text-2xl text-text-primary">{user?.name ?? "Rider"} 👋</h1>
        </div>
        {/* Online toggle */}
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={() => setOnline(!isOnline)}
            className={`relative w-16 h-8 rounded-full transition-all duration-300 ${isOnline ? "bg-success" : "bg-surface-2 border border-border-low"}`}
          >
            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-300 ${isOnline ? "translate-x-8" : "translate-x-1"}`} />
          </button>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isOnline ? "text-success" : "text-text-mute"}`}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </header>

      {/* WS status pill */}
      {isOnline && (
        <div className="mx-5 mb-4">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${
            wsStatus === "connected" ? "bg-success/10 border-success/20 text-success" :
            wsStatus === "connecting" ? "bg-warning/10 border-warning/20 text-warning" :
            "bg-danger/10 border-danger/20 text-danger"
          }`}>
            {wsStatus === "connected" && <><span className="w-2 h-2 rounded-full bg-success animate-pulse" />Live — receiving new orders</>}
            {wsStatus === "connecting" && <><Loader2 size={12} className="animate-spin" />Connecting to dispatch…</>}
            {wsStatus === "disconnected" && <><WifiOff size={12} />Reconnecting…</>}
            {wsStatus === "off" && <><Wifi size={12} className="opacity-40" />Go online to receive orders</>}
          </div>
        </div>
      )}

      {/* Offline banner */}
      {!isOnline && (
        <div className="mx-5 mb-6 p-5 bg-surface-1 border border-border-low rounded-3xl text-center">
          <Bike size={32} className="text-text-mute mx-auto mb-3" />
          <p className="font-display font-bold text-lg text-text-primary">You're Offline</p>
          <p className="text-text-mute text-sm mt-1">Toggle online to start receiving delivery requests</p>
          <button onClick={() => setOnline(true)}
            className="mt-4 px-6 py-3 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity">
            Go Online
          </button>
        </div>
      )}

      {/* Active delivery card */}
      {activeDelivery && (
        <div className="mx-5 mb-5">
          <p className="text-[11px] font-black text-text-mute uppercase tracking-wider mb-2">Active Delivery</p>
          <div className="bg-surface-1 border border-primary/30 rounded-3xl overflow-hidden shadow-lg shadow-primary/10">
            {/* Status bar */}
            <div className="px-5 py-3 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <span className={`text-sm font-black ${STATUS_LABEL[activeDelivery.status].color}`}>
                  {STATUS_LABEL[activeDelivery.status].label}
                </span>
              </div>
              <span className="text-xs text-text-mute font-mono">{activeDelivery.orderId}</span>
            </div>

            <div className="p-5 space-y-4">
              {/* Pickup */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                  <Package size={18} className="text-warning" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-text-mute uppercase tracking-wider">Pickup from</p>
                  <p className="font-bold text-text-primary">{activeDelivery.storeName}</p>
                  <p className="text-xs text-text-dim mt-0.5">{activeDelivery.storeAddress}</p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-2 pl-4">
                <div className="w-0.5 h-6 bg-border-low ml-3.5" />
              </div>

              {/* Drop */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-success" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black text-text-mute uppercase tracking-wider">Deliver to</p>
                  <p className="font-bold text-text-primary">{activeDelivery.customerName}</p>
                  <p className="text-xs text-text-dim mt-0.5">{activeDelivery.deliveryAddress}</p>
                </div>
                <a href={`tel:${activeDelivery.customerPhone}`}
                  className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center text-text-dim hover:text-primary transition-colors shrink-0">
                  <Phone size={16} />
                </a>
              </div>

              {/* Earnings */}
              <div className="flex items-center justify-between pt-2 border-t border-border-low">
                <div className="flex items-center gap-1.5 text-sm text-text-dim">
                  <IndianRupee size={14} className="text-success" />
                  <span>Earn <span className="font-black text-success">₹{Math.round(activeDelivery.total * 0.1)}</span> on delivery</span>
                </div>
                <span className="text-xs text-text-mute">{activeDelivery.itemCount} item{activeDelivery.itemCount > 1 ? "s" : ""}</span>
              </div>

              {/* Action button */}
              {STATUS_NEXT[activeDelivery.status] && (
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating}
                  className={`w-full py-4 font-black text-base rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 ${STATUS_NEXT[activeDelivery.status]!.color}`}
                >
                  {updating
                    ? <Loader2 size={20} className="animate-spin" />
                    : <>
                        {activeDelivery.status === "ASSIGNED"         && <Package size={20} />}
                        {activeDelivery.status === "PICKED_UP"        && <Navigation size={20} />}
                        {activeDelivery.status === "OUT_FOR_DELIVERY" && <CheckCircle size={20} />}
                        {STATUS_NEXT[activeDelivery.status]!.label}
                      </>
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Available orders */}
      {isOnline && !activeDelivery && (
        <div className="px-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-black text-text-mute uppercase tracking-wider">
              Available Orders ({nearbyOrders.length})
            </p>
            {nearbyOrders.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>

          {nearbyOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-text-mute">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-surface-1 flex items-center justify-center">
                  <Package size={28} />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-text-mute/20 animate-pulse-ring" />
              </div>
              <div className="text-center">
                <p className="font-bold text-text-dim">Waiting for orders</p>
                <p className="text-xs mt-1">New orders will appear here instantly</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {nearbyOrders.map((order) => (
                <div key={order.id} className="bg-surface-1 border border-border-low rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-text-primary">{order.storeName}</p>
                      <p className="text-xs text-text-mute">{order.storeAddress}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs bg-success/10 text-success px-2.5 py-1 rounded-full font-black">
                      <Clock size={11} />
                      {order.eta}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-text-dim">
                    <MapPin size={12} className="text-primary shrink-0" />
                    <span className="truncate">{order.deliveryAddress}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-low">
                    <div>
                      <p className="text-xs text-text-mute">{order.itemCount} items · COD ₹{order.total.toLocaleString("en-IN")}</p>
                      <p className="text-sm font-black text-success">Earn ₹{Math.round(order.total * 0.1)}</p>
                    </div>
                    <button
                      onClick={() => handleAccept(order)}
                      disabled={accepting === order.id}
                      className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold text-sm rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                      {accepting === order.id
                        ? <Loader2 size={15} className="animate-spin" />
                        : <><ChevronRight size={15} /> Accept</>
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
