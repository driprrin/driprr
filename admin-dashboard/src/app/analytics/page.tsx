"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { Users, Store, ShoppingBag, FileText, Loader2 } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalStores: number;
  totalOrders: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
}

export default function AnalyticsPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const [users, stores, orders, apps] = await Promise.all([
        supabaseAdmin.from("User").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("Store").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("Order").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("StoreApplication").select("status"),
      ]);
      const appData = apps.data ?? [];
      setStats({
        totalUsers:           users.count   ?? 0,
        totalStores:          stores.count  ?? 0,
        totalOrders:          orders.count  ?? 0,
        pendingApplications:  appData.filter((a: any) => a.status === "PENDING").length,
        approvedApplications: appData.filter((a: any) => a.status === "APPROVED").length,
        rejectedApplications: appData.filter((a: any) => a.status === "REJECTED").length,
      });
      setLoading(false);
    }
    fetch();
  }, []);

  const cards = stats ? [
    { label: "Total Users",           value: stats.totalUsers,           icon: Users,       color: "text-info"    },
    { label: "Active Stores",         value: stats.totalStores,          icon: Store,       color: "text-primary" },
    { label: "Total Orders",          value: stats.totalOrders,          icon: ShoppingBag, color: "text-success" },
    { label: "Pending Applications",  value: stats.pendingApplications,  icon: FileText,    color: "text-warning" },
    { label: "Approved Applications", value: stats.approvedApplications, icon: FileText,    color: "text-success" },
    { label: "Rejected Applications", value: stats.rejectedApplications, icon: FileText,    color: "text-danger"  },
  ] : [];

  return (
    <AdminLayout title="Platform Analytics">
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {cards.map((c) => (
              <div key={c.label} className="bg-surface-1 border border-border-low rounded-2xl p-5">
                <div className={`w-10 h-10 rounded-xl ${c.color}/10 flex items-center justify-center mb-3`}>
                  <c.icon size={20} className={c.color} />
                </div>
                <p className="text-3xl font-black text-text-primary">{c.value}</p>
                <p className="text-[11px] font-bold text-text-mute uppercase tracking-wider mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Application funnel */}
          {stats && (
            <div className="bg-surface-1 border border-border-low rounded-2xl p-6">
              <h2 className="font-display font-bold text-base mb-5">Application Funnel</h2>
              <div className="space-y-3">
                {[
                  { label: "Total Received", value: stats.pendingApplications + stats.approvedApplications + stats.rejectedApplications, color: "bg-info"    },
                  { label: "Approved",       value: stats.approvedApplications, color: "bg-success" },
                  { label: "Rejected",       value: stats.rejectedApplications, color: "bg-danger"  },
                  { label: "Pending Review", value: stats.pendingApplications,  color: "bg-warning" },
                ].map((row) => {
                  const total = stats.pendingApplications + stats.approvedApplications + stats.rejectedApplications;
                  const pct   = total > 0 ? Math.round((row.value / total) * 100) : 0;
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
