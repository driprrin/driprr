"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDashboardStore, Order, OrderStatus } from "@/store/dashboardStore";
import { useAuthStore } from "@/store/authStore";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import {
  TrendingUp, ShoppingBag, Receipt, Clock,
  Wifi, WifiOff, Loader2, Package, Truck, CheckCircle, ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string; icon: React.ElementType; pulse?: boolean }> = {
  Placed:             { bg: "bg-info/10",    text: "text-info",    icon: ShieldCheck },
  Preparing:          { bg: "bg-warning/10", text: "text-warning", icon: Package, pulse: true },
  Ready:              { bg: "bg-primary/10", text: "text-primary", icon: Package },
  "Out for Delivery": { bg: "bg-primary/10", text: "text-primary", icon: Truck,   pulse: true },
  Delivered:          { bg: "bg-success/10", text: "text-success", icon: CheckCircle },
  Cancelled:          { bg: "bg-danger/10",  text: "text-danger",  icon: ShoppingBag },
};

const STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  Placed: "Preparing",
  Preparing: "Ready",
  Ready: "Out for Delivery",
  "Out for Delivery": "Delivered",
};

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({
  label, value, change, icon: Icon, iconColor,
}: {
  label: string; value: string; change?: number;
  icon: React.ElementType; iconColor: string;
}) {
  return (
    <div className="bg-surface-1 border border-border-low rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl ${iconColor}/10 flex items-center justify-center mb-3`}>
        <Icon size={20} className={iconColor} />
      </div>
      <p className="text-2xl font-black text-text-primary leading-none">{value}</p>
      <p className="text-xs font-bold text-text-mute uppercase tracking-wider mt-1">{label}</p>
      {change !== undefined && (
        <p className={`text-xs font-semibold mt-1 ${change >= 0 ? "text-success" : "text-danger"}`}>
          {change >= 0 ? "▲" : "▼"} {Math.abs(change)}% vs yesterday
        </p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { token, isAuthenticated, user } = useAuthStore();
  const { orders, setOrders, updateOrderStatus, addOrder } = useDashboardStore();
  const [wsStatus, setWsStatus] = useState<"off" | "connecting" | "connected" | "disconnected">("off");
  const [chartRange, setChartRange] = useState<"7D" | "30D" | "90D">("7D");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Fetch real orders from backend
  useEffect(() => {
    if (!isAuthenticated || !token || !user?.storeId) return;

    const statusMap: Record<string, OrderStatus> = {
      "PLACED": "Placed", "PREPARING": "Preparing", "READY": "Ready",
      "OUT_FOR_DELIVERY": "Out for Delivery", "DELIVERED": "Delivered", "CANCELLED": "Cancelled",
      "Placed": "Placed", "Preparing": "Preparing", "Ready": "Ready",
      "Out for Delivery": "Out for Delivery", "Delivered": "Delivered", "Cancelled": "Cancelled",
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
  }, [isAuthenticated, token, user?.storeId, setOrders]);
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    setWsStatus("connecting");
    let s: ReturnType<typeof connectSocket>;
    try {
      s = connectSocket(token);
    } catch { setWsStatus("disconnected"); return; }

    s.on("connect",       () => setWsStatus("connected"));
    s.on("disconnect",    () => setWsStatus("disconnected"));
    s.on("connect_error", () => setWsStatus("disconnected"));

    s.on("order:new", (order: Order) => {
      addOrder(order);
      setToastMsg(`New order from ${order.customerName} — ${formatCurrency(order.total)}`);
      setTimeout(() => setToastMsg(null), 5000);
    });

    s.on("order:status", (data: { orderId: string; status: OrderStatus }) => {
      updateOrderStatus(data.orderId, data.status);
    });

    return () => {
      s.off("order:new"); s.off("order:status");
      s.off("connect"); s.off("disconnect"); s.off("connect_error");
      disconnectSocket();
      setWsStatus("off");
    };
  }, [isAuthenticated, token, addOrder, updateOrderStatus]);

  const activeOrders = orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled");

  return (
    <DashboardLayout title="Dashboard">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-16 right-4 z-50 max-w-sm bg-surface-1 border border-primary/40 rounded-2xl shadow-xl p-4 flex items-center gap-3 animate-slide-up">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <ShoppingBag size={16} className="text-primary" />
          </div>
          <p className="text-sm font-semibold text-text-primary flex-1">{toastMsg}</p>
        </div>
      )}

      {/* WS status */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-text-mute">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          {wsStatus === "connected"    && <><span className="w-2 h-2 rounded-full bg-success animate-pulse" /><span className="text-success">Live</span><Wifi size={12} className="text-success" /></>}
          {wsStatus === "connecting"   && <><Loader2 size={12} className="animate-spin text-text-mute" /><span className="text-text-mute">Connecting</span></>}
          {wsStatus === "disconnected" && <><WifiOff size={12} className="text-text-mute" /><span className="text-text-mute">Offline</span></>}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Today's Revenue"  value={formatCurrency(0)}  change={0}  icon={TrendingUp}   iconColor="text-success"  />
        <MetricCard label="Orders Today"     value="0"                  change={0}  icon={Receipt}      iconColor="text-primary"  />
        <MetricCard label="Avg Order Value"  value={formatCurrency(0)}              icon={ShoppingBag}  iconColor="text-info"     />
        <MetricCard label="Pending Orders"   value={String(activeOrders.length)}    icon={Clock}        iconColor="text-warning"  />
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Live Orders */}
        <div className="lg:col-span-2 bg-surface-1 border border-border-low rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-low">
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-base">Live Orders</h2>
              {activeOrders.length > 0 && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                  {activeOrders.length} active
                </span>
              )}
            </div>
            {wsStatus === "connected" && (
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            )}
          </div>

          <div className="divide-y divide-border-low max-h-[420px] overflow-y-auto">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-text-mute gap-2">
                <ShoppingBag size={24} />
                <p className="text-sm">No orders yet</p>
              </div>
            ) : (
              orders.map((o) => {
                const meta = STATUS_STYLES[o.status];
                const Icon = meta.icon;
                const nextStatus = STATUS_NEXT[o.status];
                return (
                  <div key={o.id} className="p-4 hover:bg-surface-2 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-xs font-mono font-bold text-text-mute">{o.id}</p>
                        <p className="text-sm font-bold text-text-primary">{o.customerName}</p>
                      </div>
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase ${meta.bg} ${meta.text}`}>
                        <Icon size={11} className={meta.pulse ? "animate-pulse" : ""} />
                        {o.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-text-mute">{o.items[0]?.name}{o.items.length > 1 ? ` +${o.items.length - 1}` : ""}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-primary">{formatCurrency(o.total)}</span>
                        {nextStatus && (
                          <button
                            onClick={() => {
                              updateOrderStatus(o.id, nextStatus);
                              const map: Record<string, string> = {
                                "Placed":"PLACED","Preparing":"PREPARING","Ready":"READY",
                                "Out for Delivery":"OUT_FOR_DELIVERY","Delivered":"DELIVERED","Cancelled":"CANCELLED",
                              };
                              import("@/lib/axios").then(({ default: api }) => {
                                api.patch(`/orders/${o.id}/status`, { status: map[nextStatus] }).catch(() => {});
                              });
                            }}
                            className="text-[10px] font-bold px-2 py-1 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity"
                          >
                            → {nextStatus}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Revenue chart */}
        <div className="lg:col-span-3 bg-surface-1 border border-border-low rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-base">Revenue</h2>
            <div className="flex gap-1">
              {(["7D", "30D", "90D"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setChartRange(r)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    chartRange === r
                      ? "bg-primary text-on-primary"
                      : "bg-surface-2 border border-border-low text-text-dim hover:border-text-mute"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={[]} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-low)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--text-mute)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-mute)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "var(--surface-1)", border: "1px solid var(--border-low)", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => [formatCurrency(v), "Revenue"]}
              />
              <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "var(--primary)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  );
}
