"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabaseAdmin } from "@/lib/supabase";
import { Users, Store, ShoppingBag, FileText, Loader2, TrendingUp, IndianRupee } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalStores: number;
  totalOrders: number;
  totalRevenue: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
}

interface StoreAnalytics {
  id: string;
  name: string;
  city: string;
  totalOrders: number;
  totalRevenue: number;
  deliveredOrders: number;
  cancelledOrders: number;
  avgOrderValue: number;
  topProducts: string[];
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [storeData, setStoreData] = useState<StoreAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      // Platform stats
      const [users, stores, orders, apps] = await Promise.all([
        supabaseAdmin.from("User").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("Store").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("Order").select("id, total, status, storeId"),
        supabaseAdmin.from("StoreApplication").select("status"),
      ]);

      const allOrders = orders.data ?? [];
      const appData = apps.data ?? [];

      setStats({
        totalUsers: users.count ?? 0,
        totalStores: stores.count ?? 0,
        totalOrders: allOrders.length,
        totalRevenue: allOrders.filter((o: any) => o.status !== "CANCELLED").reduce((s: number, o: any) => s + (o.total ?? 0), 0),
        pendingApplications: appData.filter((a: any) => a.status === "PENDING").length,
        approvedApplications: appData.filter((a: any) => a.status === "APPROVED").length,
        rejectedApplications: appData.filter((a: any) => a.status === "REJECTED").length,
      });

      // Store-wise analytics
      const { data: storeList } = await supabaseAdmin.from("Store").select("id, name, city").eq("status", "active");
      
      if (storeList && storeList.length > 0) {
        const storeAnalytics: StoreAnalytics[] = storeList.map((store: any) => {
          const storeOrders = allOrders.filter((o: any) => o.storeId === store.id);
          const delivered = storeOrders.filter((o: any) => o.status === "DELIVERED");
          const cancelled = storeOrders.filter((o: any) => o.status === "CANCELLED");
          const revenue = storeOrders.filter((o: any) => o.status !== "CANCELLED").reduce((s: number, o: any) => s + (o.total ?? 0), 0);

          return {
            id: store.id,
            name: store.name,
            city: store.city ?? "",
            totalOrders: storeOrders.length,
            totalRevenue: revenue,
            deliveredOrders: delivered.length,
            cancelledOrders: cancelled.length,
            avgOrderValue: storeOrders.length > 0 ? Math.round(revenue / storeOrders.length) : 0,
            topProducts: [],
          };
        });

        // Fetch top products per store
        for (const sa of storeAnalytics) {
          const { data: items } = await supabaseAdmin
            .from("OrderItem")
            .select("name, orderId")
            .in("orderId", allOrders.filter((o: any) => o.storeId === sa.id).map((o: any) => o.id))
            .limit(50);
          
          if (items && items.length > 0) {
            // Count product names
            const counts: Record<string, number> = {};
            items.forEach((i: any) => { counts[i.name] = (counts[i.name] ?? 0) + 1; });
            sa.topProducts = Object.entries(counts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([name]) => name);
          }
        }

        setStoreData(storeAnalytics.sort((a, b) => b.totalRevenue - a.totalRevenue));
      }

      setLoading(false);
    }
    fetchAll();
  }, []);

  return (
    <AdminLayout title="Platform Analytics">
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Platform Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-info" },
              { label: "Active Stores", value: stats?.totalStores ?? 0, icon: Store, color: "text-primary" },
              { label: "Total Orders", value: stats?.totalOrders ?? 0, icon: ShoppingBag, color: "text-success" },
              { label: "Total Revenue", value: `₹${(stats?.totalRevenue ?? 0).toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-success" },
            ].map((c) => (
              <div key={c.label} className="bg-surface-1 border border-border-low rounded-2xl p-5">
                <div className={`w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center mb-3`}>
                  <c.icon size={20} className={c.color} />
                </div>
                <p className="text-2xl font-black text-text-primary">{c.value}</p>
                <p className="text-[10px] font-bold text-text-mute uppercase tracking-wider mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Applications row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Pending Applications", value: stats?.pendingApplications ?? 0, color: "text-warning" },
              { label: "Approved", value: stats?.approvedApplications ?? 0, color: "text-success" },
              { label: "Rejected", value: stats?.rejectedApplications ?? 0, color: "text-danger" },
            ].map((c) => (
              <div key={c.label} className="bg-surface-1 border border-border-low rounded-2xl p-5">
                <div className={`w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center mb-3`}>
                  <FileText size={20} className={c.color} />
                </div>
                <p className="text-2xl font-black text-text-primary">{c.value}</p>
                <p className="text-[10px] font-bold text-text-mute uppercase tracking-wider mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Store-wise Analytics */}
          <div className="bg-surface-1 border border-border-low rounded-2xl overflow-hidden mb-8">
            <div className="px-5 py-4 border-b border-border-low flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              <h2 className="font-display font-bold text-base">Store-wise Analytics</h2>
            </div>

            {storeData.length === 0 ? (
              <div className="p-8 text-center text-text-mute text-sm">No active stores with orders yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-2 border-b border-border-low">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-text-mute uppercase">Store</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-text-mute uppercase">Orders</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-text-mute uppercase">Revenue</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-text-mute uppercase">Delivered</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-text-mute uppercase">Cancelled</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-text-mute uppercase">Avg Order</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-text-mute uppercase">Top Products</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-low">
                    {storeData.map((s) => (
                      <tr key={s.id} className="hover:bg-surface-2 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-text-primary">{s.name}</p>
                          <p className="text-[10px] text-text-mute">{s.city}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-bold">{s.totalOrders}</td>
                        <td className="px-4 py-3 text-right font-bold text-success">₹{s.totalRevenue.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2 py-0.5 bg-success/10 text-success text-[10px] font-bold rounded-full">{s.deliveredOrders}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2 py-0.5 bg-danger/10 text-danger text-[10px] font-bold rounded-full">{s.cancelledOrders}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">₹{s.avgOrderValue.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3">
                          {s.topProducts.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {s.topProducts.map((p) => (
                                <span key={p} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">{p}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-text-mute text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Application funnel */}
          {stats && (
            <div className="bg-surface-1 border border-border-low rounded-2xl p-6">
              <h2 className="font-display font-bold text-base mb-5">Application Funnel</h2>
              <div className="space-y-3">
                {[
                  { label: "Total Received", value: stats.pendingApplications + stats.approvedApplications + stats.rejectedApplications, color: "bg-info" },
                  { label: "Approved", value: stats.approvedApplications, color: "bg-success" },
                  { label: "Rejected", value: stats.rejectedApplications, color: "bg-danger" },
                  { label: "Pending Review", value: stats.pendingApplications, color: "bg-warning" },
                ].map((row) => {
                  const total = stats.pendingApplications + stats.approvedApplications + stats.rejectedApplications;
                  const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
                  return (
                    <div key={row.label} className="flex items-center gap-4">
                      <span className="text-xs font-semibold text-text-dim w-32 shrink-0">{row.label}</span>
                      <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
                        <div className={`h-full ${row.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-black text-text-primary w-10 text-right">{row.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
