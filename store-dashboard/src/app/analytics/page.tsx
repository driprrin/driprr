"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { TrendingUp, ShoppingBag, Users, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["var(--primary)", "var(--info)", "var(--success)", "var(--warning)"];

const tooltipStyle = {
  contentStyle: {
    background: "var(--surface-1)", border: "1px solid var(--border-low)",
    borderRadius: 12, fontSize: 12,
  },
};

export default function AnalyticsPage() {
  const [range, setRange] = useState<"7D" | "30D" | "90D">("7D");

  const revenueData: { day: string; revenue: number; orders: number }[] = [];
  const categoryData: { name: string; value: number }[] = [];
  const topProducts: { name: string; sold: number; revenue: number }[] = [];

  const kpis = [
    { label: "Total Revenue",   value: formatCurrency(0), change: 0, icon: TrendingUp, color: "text-success"  },
    { label: "Total Orders",    value: "0",               change: 0, icon: ShoppingBag,color: "text-primary"  },
    { label: "New Customers",   value: "0",               change: 0, icon: Users,      color: "text-info"     },
    { label: "Return Rate",     value: "0%",              change: 0, icon: RotateCcw,  color: "text-warning"  },
  ];

  return (
    <DashboardLayout title="Analytics">
      {/* Range toggle */}
      <div className="flex gap-2 mb-6">
        {(["7D", "30D", "90D"] as const).map((r) => (
          <button key={r} onClick={() => setRange(r)}
            className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${range === r ? "bg-primary text-on-primary border-primary" : "bg-surface-1 border-border-low text-text-dim hover:border-text-mute"}`}>
            {r}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-surface-1 border border-border-low rounded-2xl p-4">
            <div className={`w-9 h-9 rounded-xl ${k.color}/10 flex items-center justify-center mb-3`}>
              <k.icon size={18} className={k.color} />
            </div>
            <p className="text-2xl font-black text-text-primary">{k.value}</p>
            <p className="text-[10px] font-bold text-text-mute uppercase tracking-wider mt-0.5">{k.label}</p>
            <p className={`text-xs font-semibold mt-1 ${k.change >= 0 ? "text-success" : "text-danger"}`}>
              {k.change >= 0 ? "▲" : "▼"} {Math.abs(k.change)}%
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Revenue + Orders line chart */}
        <div className="lg:col-span-2 bg-surface-1 border border-border-low rounded-2xl p-5">
          <h2 className="font-display font-bold text-base mb-4">Revenue & Orders</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-low)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--text-mute)" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="rev" tick={{ fontSize: 10, fill: "var(--text-mute)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 10, fill: "var(--text-mute)" }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue" stroke="var(--primary)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              <Line yAxisId="ord" type="monotone" dataKey="orders"  name="Orders"  stroke="var(--info)"    strokeWidth={2}   dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="bg-surface-1 border border-border-low rounded-2xl p-5">
          <h2 className="font-display font-bold text-base mb-4">Sales by Category</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, "Share"]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {categoryData.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-text-dim">{c.name}</span>
                </div>
                <span className="font-bold text-text-primary">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top products bar chart */}
      <div className="bg-surface-1 border border-border-low rounded-2xl p-5">
        <h2 className="font-display font-bold text-base mb-4">Top Products by Revenue</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-low)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: "var(--text-mute)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--text-dim)" }} axisLine={false} tickLine={false} width={75} />
            <Tooltip {...tooltipStyle} formatter={(v: number) => [formatCurrency(v), "Revenue"]} />
            <Bar dataKey="revenue" fill="var(--primary)" radius={[0, 6, 6, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardLayout>
  );
}
