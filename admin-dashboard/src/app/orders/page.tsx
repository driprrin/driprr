"use client";

import { useState, useEffect } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import AdminLayout from "@/components/AdminLayout";
import { useAuthStore } from "@/store/authStore";
import {
  Search, RefreshCw, ShoppingBag, CreditCard,
  Banknote, AlertTriangle, CheckCircle, Loader2, X,
} from "lucide-react";

interface OrderItem {
  name: string;
  size: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  userId: string;
  storeId: string;
  storeName: string;
  customerName: string;
  customerPhone: string;
  status: string;
  paymentMethod: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode: string | null;
  createdAt: string;
  items: OrderItem[];
  hasPayment: boolean;
  paymentStatus: string | null;
  razorpayPaymentId: string | null;
}

export default function AdminOrdersPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [refunding, setRefunding] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  async function loadOrders() {
    setLoading(true);
    const { data: ordersData } = await supabaseAdmin
      .from("Order")
      .select("*, items:OrderItem(*)")
      .order("createdAt", { ascending: false });

    if (!ordersData) { setLoading(false); return; }

    // Fetch store names and payment info
    const storeIds = [...new Set(ordersData.map((o: any) => o.storeId))];
    const { data: stores } = await supabaseAdmin
      .from("Store")
      .select("id, name")
      .in("id", storeIds);
    const storeMap = Object.fromEntries((stores ?? []).map((s: any) => [s.id, s.name]));

    // Fetch payment records
    const orderIds = ordersData.map((o: any) => o.id);
    const { data: payments } = await supabaseAdmin
      .from("Payment")
      .select("orderId, status, razorpayPaymentId")
      .in("orderId", orderIds);
    const paymentMap = Object.fromEntries((payments ?? []).map((p: any) => [p.orderId, p]));

    const mapped: Order[] = ordersData.map((o: any) => ({
      id: o.id,
      userId: o.userId,
      storeId: o.storeId,
      storeName: storeMap[o.storeId] ?? "Unknown Store",
      customerName: o.deliveryName ?? "Customer",
      customerPhone: o.deliveryPhone ?? "",
      status: o.status,
      paymentMethod: o.paymentMethod ?? "COD",
      total: o.total,
      subtotal: o.subtotal ?? o.total,
      deliveryFee: o.deliveryFee ?? 0,
      discount: o.discount ?? 0,
      couponCode: o.couponCode,
      createdAt: o.createdAt,
      items: (o.items ?? []).map((i: any) => ({
        name: i.name, size: i.size, qty: i.qty, price: i.price,
      })),
      hasPayment: !!paymentMap[o.id],
      paymentStatus: paymentMap[o.id]?.status ?? null,
      razorpayPaymentId: paymentMap[o.id]?.razorpayPaymentId ?? null,
    }));

    setOrders(mapped);
    setLoading(false);
  }

  useEffect(() => { loadOrders(); }, []);

  async function handleRefund(orderId: string) {
    setRefunding(orderId);
    try {
      const res = await fetch("http://localhost:4000/api/payments/refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ msg: `Refund of ₹${data.amount ?? ""} initiated successfully!`, type: "success" });
        // Update local state
        setOrders((prev) => prev.map((o) =>
          o.id === orderId ? { ...o, paymentStatus: "REFUNDED" } : o
        ));
      } else {
        setToast({ msg: data.message ?? "Refund failed", type: "error" });
      }
    } catch (err: any) {
      setToast({ msg: err.message ?? "Network error", type: "error" });
    } finally {
      setRefunding(null);
      setTimeout(() => setToast(null), 4000);
    }
  }

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    const matchSearch = !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.storeName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusLabels: Record<string, string> = {
    PLACED: "Placed", PREPARING: "Preparing", READY: "Ready",
    OUT_FOR_DELIVERY: "Out for Delivery", DELIVERED: "Delivered", CANCELLED: "Cancelled",
  };

  return (
    <AdminLayout title="Orders">
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold ${
            toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}>
            {toast.type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
          <button onClick={loadOrders} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Search by order ID, customer, or store..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="PLACED">Placed</option>
            <option value="PREPARING">Preparing</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <ShoppingBag size={32} />
            <p className="text-sm">No orders found</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Store</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((o) => {
                    const canRefund = o.status === "CANCELLED" &&
                      o.paymentMethod === "RAZORPAY" &&
                      o.paymentStatus !== "REFUNDED" &&
                      o.razorpayPaymentId;

                    return (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs font-bold text-gray-600">{o.id.slice(0, 12)}...</p>
                          <p className="text-[10px] text-gray-400">{o.items.length} items</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-800">{o.customerName}</p>
                          <p className="text-xs text-gray-400">{o.customerPhone}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{o.storeName}</td>
                        <td className="px-4 py-3 font-bold text-gray-900">₹{o.total}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {o.paymentMethod === "RAZORPAY" ? (
                              <CreditCard size={12} className="text-blue-500" />
                            ) : (
                              <Banknote size={12} className="text-green-500" />
                            )}
                            <span className="text-xs font-medium">
                              {o.paymentMethod === "RAZORPAY" ? "Razorpay" : "COD"}
                            </span>
                            {o.paymentStatus === "REFUNDED" && (
                              <span className="ml-1 px-1.5 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded">REFUNDED</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                            o.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                            o.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                            o.status === "PLACED" ? "bg-blue-100 text-blue-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                            {statusLabels[o.status] ?? o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </td>
                        <td className="px-4 py-3">
                          {canRefund ? (
                            <button
                              onClick={() => handleRefund(o.id)}
                              disabled={refunding === o.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                            >
                              {refunding === o.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <RefreshCw size={12} />
                              )}
                              Refund
                            </button>
                          ) : o.paymentStatus === "REFUNDED" ? (
                            <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                              <CheckCircle size={12} /> Refunded
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
    </AdminLayout>
  );
}
