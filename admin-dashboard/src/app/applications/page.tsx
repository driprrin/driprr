"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase, supabaseAdmin, StoreApplication, ApplicationStatus } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import {
  Search, Filter, Eye, CheckCircle, XCircle,
  Clock, RefreshCw, X, Phone, Mail, MapPin,
  Tag, Instagram, Briefcase, TrendingUp, Loader2,
} from "lucide-react";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<ApplicationStatus, { bg: string; text: string; border: string; label: string }> = {
  PENDING:  { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20",  label: "Pending"  },
  APPROVED: { bg: "bg-success/10", text: "text-success", border: "border-success/20",  label: "Approved" },
  REJECTED: { bg: "bg-danger/10",  text: "text-danger",  border: "border-danger/20",   label: "Rejected" },
};

// ── Reject modal ─────────────────────────────────────────────────────────────
function RejectModal({
  app, onClose, onConfirm,
}: { app: StoreApplication; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  const presets = [
    "Incomplete information provided",
    "Store category not supported in your city",
    "Duplicate application",
    "Does not meet our seller requirements",
  ];
  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[420px] z-50 bg-surface-1 rounded-3xl border border-border-low shadow-2xl p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
            <XCircle size={20} className="text-danger" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg">Reject Application</h2>
            <p className="text-xs text-text-mute">{app.storeName} — {app.ownerName}</p>
          </div>
        </div>

        <p className="text-[11px] font-black text-text-mute uppercase tracking-wider mb-2">Reason for rejection</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {presets.map((p) => (
            <button key={p} onClick={() => setReason(p)}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                reason === p
                  ? "border-danger bg-danger/10 text-danger"
                  : "border-border-low bg-surface-2 text-text-dim hover:border-text-mute"
              }`}>
              {p}
            </button>
          ))}
        </div>
        <textarea
          rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="Or write a custom reason..."
          className="w-full px-3 py-2.5 bg-surface-2 border border-border-low focus:border-danger/60 rounded-xl text-sm text-text-primary placeholder-text-mute focus:outline-none resize-none transition-colors"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose}
            className="flex-1 py-3 border-2 border-border-low font-bold rounded-2xl text-sm text-text-primary hover:border-text-mute transition-colors">
            Cancel
          </button>
          <button onClick={() => onConfirm(reason)} disabled={!reason.trim()}
            className="flex-[1.5] py-3 bg-danger text-white font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity disabled:opacity-40">
            Reject Application
          </button>
        </div>
      </div>
    </>
  );
}

// ── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({
  app, onClose, onApprove, onReject, approving, rejecting,
}: {
  app: StoreApplication;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
  rejecting: boolean;
}) {
  const cfg = STATUS_CFG[app.status];
  const date = new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-surface-1 border-l border-border-low z-50 flex flex-col animate-slide-up overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-low sticky top-0 bg-surface-1 z-10">
          <div>
            <p className="text-xs text-text-mute font-mono">{app.id.slice(0, 12)}…</p>
            <h2 className="font-display font-black text-xl">{app.storeName}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
              {cfg.label}
            </span>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 hover:bg-border-low transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Personal info */}
          <section>
            <p className="text-[11px] font-black text-text-mute uppercase tracking-wider mb-3">Owner Details</p>
            <div className="bg-surface-2 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2.5 text-sm">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-black text-primary text-sm">{app.ownerName[0]}</span>
                </div>
                <div>
                  <p className="font-bold text-text-primary">{app.ownerName}</p>
                  <p className="text-xs text-text-mute">Applied {date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-dim">
                <Mail size={14} className="text-primary shrink-0" />
                <a href={`mailto:${app.email}`} className="hover:text-primary transition-colors">{app.email}</a>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-dim">
                <Phone size={14} className="text-primary shrink-0" />
                <a href={`tel:${app.phone}`} className="hover:text-primary transition-colors">{app.phone}</a>
              </div>
              {app.instagram && (
                <div className="flex items-center gap-2 text-sm text-text-dim">
                  <Instagram size={14} className="text-primary shrink-0" />
                  <a href={`https://instagram.com/${app.instagram}`} target="_blank" rel="noopener noreferrer"
                    className="hover:text-primary transition-colors">@{app.instagram}</a>
                </div>
              )}
            </div>
          </section>

          {/* Store info */}
          <section>
            <p className="text-[11px] font-black text-text-mute uppercase tracking-wider mb-3">Store Details</p>
            <div className="bg-surface-2 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-2 text-sm text-text-dim">
                <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-text-primary font-semibold">{app.storeAddress}</p>
                  <p>{app.city} — {app.pincode}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm text-text-dim">
                <Tag size={14} className="text-primary shrink-0 mt-0.5" />
                <div className="flex flex-wrap gap-1">
                  {app.categories.map((c) => (
                    <span key={c} className="px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-bold rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* About */}
          <section>
            <p className="text-[11px] font-black text-text-mute uppercase tracking-wider mb-3">About the Store</p>
            <div className="bg-surface-2 rounded-2xl p-4 space-y-3">
              <p className="text-sm text-text-dim leading-relaxed">{app.description}</p>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border-low">
                {app.experience && (
                  <div className="flex items-center gap-1.5 text-xs text-text-dim">
                    <Briefcase size={13} className="text-primary" />
                    <span>{app.experience}</span>
                  </div>
                )}
                {app.monthlySales && (
                  <div className="flex items-center gap-1.5 text-xs text-text-dim">
                    <TrendingUp size={13} className="text-primary" />
                    <span>{app.monthlySales}/mo</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Rejection reason if rejected */}
          {app.status === "REJECTED" && app.rejectReason && (
            <section>
              <p className="text-[11px] font-black text-text-mute uppercase tracking-wider mb-2">Rejection Reason</p>
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-2xl text-sm text-danger">
                {app.rejectReason}
              </div>
            </section>
          )}
        </div>

        {/* Action buttons — only for PENDING */}
        {app.status === "PENDING" && (
          <div className="sticky bottom-0 border-t border-border-low bg-surface-1 px-6 py-4 flex gap-3">
            <button onClick={onReject} disabled={rejecting}
              className="flex-1 py-3 border-2 border-danger/40 bg-danger/5 text-danger font-bold rounded-2xl text-sm hover:bg-danger/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {rejecting ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
              Reject
            </button>
            <button onClick={onApprove} disabled={approving}
              className="flex-[2] py-3 bg-success text-white font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              {approving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              Approve & Create Account
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ApplicationsPage() {
  const { user } = useAuthStore();
  const [apps, setApps]               = useState<StoreApplication[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "ALL">("ALL");
  const [selected, setSelected]       = useState<StoreApplication | null>(null);
  const [rejectTarget, setRejectTarget] = useState<StoreApplication | null>(null);
  const [approving, setApproving]     = useState(false);
  const [rejecting, setRejecting]     = useState(false);
  const [toast, setToast]             = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchApps = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabaseAdmin
      .from("StoreApplication")
      .select("*")
      .order("createdAt", { ascending: false });
    if (error) console.error("fetchApps error:", error);
    if (!error && data) setApps(data as StoreApplication[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("applications-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "StoreApplication" }, () => {
        fetchApps();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchApps]);

  async function handleApprove(app: StoreApplication) {
    setApproving(true);
    try {
      // Call backend — creates Supabase user + Store row + marks APPROVED
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/applications/stores/${app.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Admin token from Supabase session
          "Authorization": `Bearer ${(await import("@/lib/supabase").then(m => m.supabase.auth.getSession()))?.data?.session?.access_token ?? ""}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Approval failed");
      }

      const result = await res.json();
      setApps((prev) => prev.map((a) => a.id === app.id ? { ...a, status: "APPROVED" } : a));
      setSelected(null);

      // Show credentials to admin so they can share manually
      const creds = result.credentials;
      showToast(`✅ ${app.storeName} approved! Credentials — ${creds.email} / ${creds.password}`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Approval failed", "error");
    } finally {
      setApproving(false);
    }
  }

  async function handleReject(app: StoreApplication, reason: string) {
    setRejecting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token ?? "";

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/applications/stores/${app.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ reason }),
        }
      );
      if (!res.ok) throw new Error("Rejection failed");

      setApps((prev) => prev.map((a) => a.id === app.id ? { ...a, status: "REJECTED", rejectReason: reason } : a));
      setRejectTarget(null);
      setSelected(null);
      showToast(`Application from ${app.ownerName} rejected.`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Rejection failed", "error");
    } finally {
      setRejecting(false);
    }
  }

  // Filtered list
  const filtered = apps.filter((a) => {
    const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.ownerName.toLowerCase().includes(q) ||
      a.storeName.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    ALL:      apps.length,
    PENDING:  apps.filter((a) => a.status === "PENDING").length,
    APPROVED: apps.filter((a) => a.status === "APPROVED").length,
    REJECTED: apps.filter((a) => a.status === "REJECTED").length,
  };

  return (
    <AdminLayout title="Seller Applications">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] max-w-sm px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 animate-slide-up ${
          toast.type === "success" ? "bg-success text-white" : "bg-danger text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5 pb-1">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
              statusFilter === s
                ? s === "PENDING" ? "bg-warning text-white border-warning"
                  : s === "APPROVED" ? "bg-success text-white border-success"
                  : s === "REJECTED" ? "bg-danger text-white border-danger"
                  : "bg-primary text-on-primary border-primary"
                : "bg-surface-1 border-border-low text-text-dim hover:border-text-mute"
            }`}>
            {s === "ALL" ? "All Applications" : s.charAt(0) + s.slice(1).toLowerCase()}
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
              statusFilter === s ? "bg-white/20" : "bg-surface-2"
            }`}>
              {counts[s]}
            </span>
          </button>
        ))}
        <button onClick={fetchApps} title="Refresh"
          className="shrink-0 ml-auto w-8 h-8 flex items-center justify-center rounded-full bg-surface-1 border border-border-low text-text-mute hover:text-text-primary transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mute" />
        <input type="text" placeholder="Search by name, store, email, city..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-surface-1 border border-border-low rounded-xl text-sm text-text-primary placeholder-text-mute focus:outline-none focus:border-primary/50 transition-colors" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3 text-text-mute">
          <Loader2 size={24} className="animate-spin text-primary" />
          <span className="text-sm">Loading applications…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-text-mute">
          <div className="w-16 h-16 rounded-3xl bg-surface-1 border border-border-low flex items-center justify-center">
            <Filter size={24} />
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-text-primary">No applications found</p>
            <p className="text-sm mt-1">{search ? "Try a different search term" : "New applications will appear here"}</p>
          </div>
        </div>
      ) : (
        <div className="bg-surface-1 border border-border-low rounded-2xl overflow-hidden">
          {/* Desktop header */}
          <div className="hidden md:grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-border-low text-[11px] font-black uppercase tracking-wider text-text-mute">
            <span>Applicant</span>
            <span>Store</span>
            <span>Location</span>
            <span>Categories</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          <div className="divide-y divide-border-low">
            {filtered.map((app) => {
              const cfg = STATUS_CFG[app.status];
              const date = new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
              return (
                <div key={app.id}
                  className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] gap-3 md:gap-4 px-5 py-4 hover:bg-surface-2 transition-colors cursor-pointer"
                  onClick={() => setSelected(app)}>

                  {/* Applicant */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-black text-primary">{app.ownerName[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text-primary truncate">{app.ownerName}</p>
                      <p className="text-[11px] text-text-mute truncate">{app.email}</p>
                    </div>
                  </div>

                  {/* Store */}
                  <div className="self-center">
                    <p className="text-sm font-semibold text-text-primary truncate">{app.storeName}</p>
                    <p className="text-[11px] text-text-mute">{date}</p>
                  </div>

                  {/* Location */}
                  <div className="self-center">
                    <p className="text-xs text-text-dim flex items-center gap-1">
                      <MapPin size={11} className="text-primary shrink-0" />
                      {app.city}, {app.pincode}
                    </p>
                  </div>

                  {/* Categories */}
                  <div className="self-center">
                    <p className="text-xs text-text-mute line-clamp-1">
                      {app.categories.slice(0, 2).join(", ")}{app.categories.length > 2 ? ` +${app.categories.length - 2}` : ""}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="self-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      {app.status === "PENDING"  && <Clock size={10}        className="animate-pulse" />}
                      {app.status === "APPROVED" && <CheckCircle size={10}                            />}
                      {app.status === "REJECTED" && <XCircle size={10}                                />}
                      {cfg.label}
                    </span>
                  </div>

                  {/* View button */}
                  <div className="self-center" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setSelected(app)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 border border-border-low rounded-xl text-xs font-bold text-text-dim hover:text-primary hover:border-primary/40 transition-colors">
                      <Eye size={13} />
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <DetailPanel
          app={selected}
          onClose={() => setSelected(null)}
          onApprove={() => handleApprove(selected)}
          onReject={() => setRejectTarget(selected)}
          approving={approving}
          rejecting={rejecting}
        />
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          app={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={(reason) => handleReject(rejectTarget, reason)}
        />
      )}
    </AdminLayout>
  );
}
