"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { Search, Loader2 } from "lucide-react";

interface User { id: string; name: string; email: string; phone: string; role: string; createdAt: string; }

const ROLE_CFG: Record<string, { bg: string; text: string }> = {
  CUSTOMER:    { bg: "bg-info/10",    text: "text-info"    },
  STORE_OWNER: { bg: "bg-primary/10", text: "text-primary" },
  ADMIN:       { bg: "bg-danger/10",  text: "text-danger"  },
  RIDER:       { bg: "bg-warning/10", text: "text-warning" },
};

export default function UsersPage() {
  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [role,    setRole]    = useState("ALL");

  useEffect(() => {
    supabaseAdmin.from("User").select("*").order("createdAt", { ascending: false })
      .then(({ data }) => { if (data) setUsers(data as User[]); setLoading(false); });
  }, []);

  const filtered = users.filter((u) => {
    const matchRole = role === "ALL" || u.role === role;
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  return (
    <AdminLayout title="Users">
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mute" />
          <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-surface-1 border border-border-low rounded-xl text-sm text-text-primary placeholder-text-mute focus:outline-none focus:border-primary/50 transition-colors" />
        </div>
        <div className="flex gap-1">
          {["ALL", "CUSTOMER", "STORE_OWNER", "RIDER", "ADMIN"].map((r) => (
            <button key={r} onClick={() => setRole(r)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${role === r ? "bg-primary text-on-primary border-primary" : "bg-surface-1 border-border-low text-text-dim hover:border-text-mute"}`}>
              {r === "ALL" ? "All" : r.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 size={24} className="animate-spin text-primary" /></div>
      ) : (
        <div className="bg-surface-1 border border-border-low rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr] gap-4 px-5 py-3 border-b border-border-low text-[11px] font-black uppercase tracking-wider text-text-mute">
            <span>Name</span><span>Email</span><span>Phone</span><span>Role</span><span>Joined</span>
          </div>
          <div className="divide-y divide-border-low">
            {filtered.length === 0 ? (
              <p className="text-center py-12 text-sm text-text-mute">No users found</p>
            ) : filtered.map((u) => {
              const cfg = ROLE_CFG[u.role] ?? { bg: "bg-surface-2", text: "text-text-mute" };
              const date = new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
              return (
                <div key={u.id} className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1.5fr_1fr_1fr] gap-3 md:gap-4 px-5 py-3.5 hover:bg-surface-2 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-primary">{u.name?.[0] ?? "?"}</span>
                    </div>
                    <p className="text-sm font-semibold text-text-primary truncate">{u.name || "—"}</p>
                  </div>
                  <p className="text-xs text-text-dim self-center truncate">{u.email || "—"}</p>
                  <p className="text-xs text-text-dim self-center">{u.phone || "—"}</p>
                  <div className="self-center">
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase ${cfg.bg} ${cfg.text}`}>{u.role}</span>
                  </div>
                  <p className="text-xs text-text-mute self-center">{date}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
