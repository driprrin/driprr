"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { Search, Eye, CheckCircle, XCircle, Clock, Loader2, Bike, X, Phone, Mail, MapPin, CreditCard, Car } from "lucide-react";

type Status = "PENDING" | "APPROVED" | "REJECTED";

interface RiderApp {
  id: string; fullName: string; email: string; phone: string;
  dateOfBirth: string; gender: string; address: string; city: string;
  pincode: string; preferredZone: string; aadhaarNumber: string;
  licenceNumber: string; licenceExpiry: string; vehicleType: string;
  fuelType: string; vehicleNumber: string; vehicleModel: string;
  vehicleYear: string; emergencyName: string; emergencyPhone: string;
  emergencyRelation: string; status: Status; rejectReason: string | null;
  createdAt: string;
}

const S: Record<Status, { bg: string; text: string; border: string }> = {
  PENDING:  { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20" },
  APPROVED: { bg: "bg-success/10", text: "text-success", border: "border-success/20" },
  REJECTED: { bg: "bg-danger/10",  text: "text-danger",  border: "border-danger/20"  },
};

function DetailPanel({ app, onClose, onApprove, onReject }: {
  app: RiderApp; onClose: () => void;
  onApprove: () => void; onReject: () => void;
}) {
  const cfg  = S[app.status];
  const date = new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const row = (label: string, value: string, icon?: React.ReactNode) => (
    <div className="flex items-start gap-2 text-sm py-2 border-b border-border-low last:border-0">
      {icon && <span className="text-primary mt-0.5 shrink-0">{icon}</span>}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-text-mute uppercase tracking-wider">{label}</p>
        <p className="text-text-primary font-semibold mt-0.5 break-all">{value || "—"}</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-surface-1 border-l border-border-low z-50 flex flex-col overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-low sticky top-0 bg-surface-1 z-10">
          <div>
            <p className="text-xs text-text-mute">{date}</p>
            <h2 className="font-display font-black text-lg">{app.fullName}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{app.status}</span>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2"><X size={16} /></button>
          </div>
        </div>

        <div className="flex-1 px-5 py-4 space-y-4">
          <div className="bg-surface-2 rounded-2xl p-4">
            <p className="text-[11px] font-black text-text-mute uppercase tracking-wider mb-2">Personal</p>
            {row("Full Name", app.fullName, <User size={14} />)}
            {row("Email", app.email, <Mail size={14} />)}
            {row("Phone", app.phone, <Phone size={14} />)}
            {row("Date of Birth", app.dateOfBirth)}
            {row("Gender", app.gender)}
          </div>
          <div className="bg-surface-2 rounded-2xl p-4">
            <p className="text-[11px] font-black text-text-mute uppercase tracking-wider mb-2">Address</p>
            {row("Address", app.address, <MapPin size={14} />)}
            {row("City & Pincode", `${app.city} — ${app.pincode}`)}
            {row("Preferred Zone", app.preferredZone)}
          </div>
          <div className="bg-surface-2 rounded-2xl p-4">
            <p className="text-[11px] font-black text-text-mute uppercase tracking-wider mb-2">Identity & Licence</p>
            {row("Aadhaar", app.aadhaarNumber, <CreditCard size={14} />)}
            {row("Licence Number", app.licenceNumber)}
            {row("Licence Expiry", app.licenceExpiry)}
          </div>
          <div className="bg-surface-2 rounded-2xl p-4">
            <p className="text-[11px] font-black text-text-mute uppercase tracking-wider mb-2">Vehicle</p>
            {row("Type", `${app.vehicleType} — ${app.fuelType}`, <Car size={14} />)}
            {row("Registration", app.vehicleNumber)}
            {row("Model & Year", `${app.vehicleModel} (${app.vehicleYear})`)}
          </div>
          <div className="bg-surface-2 rounded-2xl p-4">
            <p className="text-[11px] font-black text-text-mute uppercase tracking-wider mb-2">Emergency Contact</p>
            {row("Name", `${app.emergencyName} (${app.emergencyRelation})`)}
            {row("Phone", app.emergencyPhone, <Phone size={14} />)}
          </div>
          {app.rejectReason && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-2xl text-sm text-danger">{app.rejectReason}</div>
          )}
        </div>

        {app.status === "PENDING" && (
          <div className="sticky bottom-0 border-t border-border-low bg-surface-1 px-5 py-4 flex gap-3">
            <button onClick={onReject} className="flex-1 py-3 border-2 border-danger/40 bg-danger/5 text-danger font-bold rounded-2xl text-sm hover:bg-danger/10 transition-colors flex items-center justify-center gap-2">
              <XCircle size={15} /> Reject
            </button>
            <button onClick={onApprove} className="flex-[2] py-3 bg-success text-white font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <CheckCircle size={15} /> Approve Rider
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// workaround: User icon not imported above
function User(props: { size: number }) { return <span style={{ fontSize: props.size }}>👤</span>; }

export default function RidersPage() {
  const [apps,     setApps]     = useState<RiderApp[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [tab,      setTab]      = useState<"ALL" | Status>("ALL");
  const [selected, setSelected] = useState<RiderApp | null>(null);
  const [toast,    setToast]    = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchApps = useCallback(async () => {
    setLoading(true);
    const { data } = await supabaseAdmin.from("RiderApplication").select("*").order("createdAt", { ascending: false });
    if (data) setApps(data as RiderApp[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  async function handleApprove(app: RiderApp) {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token ?? "";

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/applications/riders/${app.id}/approve`,
      { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } }
    );

    if (!res.ok) { const e = await res.json(); showToast(e.message ?? "Approval failed"); return; }
    const result = await res.json();
    setApps((p) => p.map((a) => a.id === app.id ? { ...a, status: "APPROVED" } : a));
    setSelected(null);
    showToast(`✅ ${app.fullName} approved! ${result.credentials?.email} / ${result.credentials?.password}`);
  }

  async function handleReject(app: RiderApp) {
    const reason = prompt("Reason for rejection:");
    if (!reason) return;

    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token ?? "";

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/applications/riders/${app.id}/reject`,
      { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify({ reason }) }
    );

    if (!res.ok) { showToast("Rejection failed"); return; }
    setApps((p) => p.map((a) => a.id === app.id ? { ...a, status: "REJECTED", rejectReason: reason } : a));
    setSelected(null);
    showToast("Application rejected.");
  }

  const filtered = apps.filter((a) => {
    const matchTab = tab === "ALL" || a.status === tab;
    const q = search.toLowerCase();
    return matchTab && (!q || a.fullName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.city.toLowerCase().includes(q));
  });

  const counts = { ALL: apps.length, PENDING: apps.filter((a) => a.status === "PENDING").length, APPROVED: apps.filter((a) => a.status === "APPROVED").length, REJECTED: apps.filter((a) => a.status === "REJECTED").length };

  return (
    <AdminLayout title="Rider Applications">
      {toast && <div className="fixed top-4 right-4 z-[9999] px-4 py-3 bg-success text-white font-bold text-sm rounded-2xl shadow-xl animate-fade-in">{toast}</div>}

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
        {(["ALL","PENDING","APPROVED","REJECTED"] as const).map((s) => (
          <button key={s} onClick={() => setTab(s)} className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${tab === s ? "bg-primary text-on-primary border-primary" : "bg-surface-1 border-border-low text-text-dim hover:border-text-mute"}`}>
            {s === "ALL" ? "All" : s.charAt(0)+s.slice(1).toLowerCase()}
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${tab === s ? "bg-white/20" : "bg-surface-2"}`}>{counts[s]}</span>
          </button>
        ))}
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mute" />
        <input type="text" placeholder="Search by name, email, city..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-surface-1 border border-border-low rounded-xl text-sm text-text-primary placeholder-text-mute focus:outline-none focus:border-primary/50 transition-colors" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 size={24} className="animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-text-mute">
          <Bike size={32} /><p className="text-sm font-semibold">No rider applications found</p>
        </div>
      ) : (
        <div className="bg-surface-1 border border-border-low rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-border-low text-[11px] font-black uppercase tracking-wider text-text-mute">
            <span>Rider</span><span>Vehicle</span><span>Zone</span><span>City</span><span>Status</span><span>View</span>
          </div>
          <div className="divide-y divide-border-low">
            {filtered.map((app) => {
              const cfg = S[app.status];
              return (
                <div key={app.id} className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-3 md:gap-4 px-5 py-4 hover:bg-surface-2 transition-colors cursor-pointer" onClick={() => setSelected(app)}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-black text-primary">{app.fullName[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text-primary truncate">{app.fullName}</p>
                      <p className="text-[11px] text-text-mute truncate">{app.email}</p>
                    </div>
                  </div>
                  <div className="self-center">
                    <p className="text-xs font-semibold text-text-primary capitalize">{app.vehicleType} · {app.fuelType}</p>
                    <p className="text-[11px] text-text-mute">{app.vehicleModel} ({app.vehicleYear})</p>
                  </div>
                  <p className="text-xs text-text-dim self-center">{app.preferredZone}</p>
                  <p className="text-xs text-text-dim self-center">{app.city}</p>
                  <div className="self-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      {app.status === "PENDING" && <Clock size={10} className="animate-pulse" />}
                      {app.status === "APPROVED" && <CheckCircle size={10} />}
                      {app.status === "REJECTED" && <XCircle size={10} />}
                      {app.status.toLowerCase()}
                    </span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setSelected(app); }} className="self-center flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 border border-border-low rounded-xl text-xs font-bold text-text-dim hover:text-primary hover:border-primary/40 transition-colors">
                    <Eye size={13} /> View
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selected && <DetailPanel app={selected} onClose={() => setSelected(null)} onApprove={() => handleApprove(selected)} onReject={() => handleReject(selected)} />}
    </AdminLayout>
  );
}
