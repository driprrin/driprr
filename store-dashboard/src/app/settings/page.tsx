"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Store, Clock, MapPin, Bell, AlertTriangle, Check, Camera, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const DeliveryMap = dynamic(() => import("@/components/DeliveryMap"), { ssr: false });

const CLOUDINARY_CLOUD  = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME  ?? "hunu2oxf";
const CLOUDINARY_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "d1qib0aj";

const TABS = ["Profile", "Hours", "Delivery", "Notifications", "Danger Zone"] as const;
type Tab = typeof TABS[number];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface DayHours { open: boolean; from: string; to: string; }
const defaultHours: Record<string, DayHours> = Object.fromEntries(
  DAYS.map((d) => [d, { open: d !== "Sunday", from: "10:00", to: "21:00" }])
);

function SavedToast() {
  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-success text-white font-bold text-sm rounded-2xl shadow-xl animate-slide-up">
      <Check size={16} />
      Changes saved
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab]   = useState<Tab>("Profile");
  const [saved, setSaved]           = useState(false);
  const [hours, setHours]           = useState(defaultHours);
  const [radius, setRadius]         = useState(5);
  const [storeLat, setStoreLat]     = useState(15.3647);  // Hubli default
  const [storeLng, setStoreLng]     = useState(75.1240);
  const [deliveryFee, setDeliveryFee] = useState(49);
  const [freeAbove, setFreeAbove]   = useState(999);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Profile form
  const [storeName,   setStoreName]   = useState(user?.storeName ?? "Urban Vault");
  const [tagline,     setTagline]     = useState("Premium streetwear, curated drops");
  const [address,     setAddress]     = useState("MG Road, Hubli, Karnataka");
  const [pincode,     setPincode]     = useState("580020");
  const [storePhone,  setStorePhone]  = useState("9876543210");
  const [coverUrl,    setCoverUrl]    = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", CLOUDINARY_PRESET);
      fd.append("folder", "driprr/stores");
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.secure_url) {
        setCoverUrl(data.secure_url);
        // Save to Supabase immediately
        if (user?.storeId) {
          const { supabase } = await import("@/lib/supabase");
          await supabase.from("Store").update({ coverUrl: data.secure_url }).eq("id", user.storeId);
        }
      }
    } catch { /* ignore */ }
    finally { setUploadingCover(false); if (coverRef.current) coverRef.current.value = ""; }
  }

  // Notifications
  const [notifs, setNotifs] = useState({
    newOrder: true, cancelled: true, lowStock: true, dailySummary: false, payout: true,
  });

  function save() {
    // Persist delivery settings to Supabase
    if (user?.storeId) {
      import("@/lib/supabase").then(({ supabase }) => {
        supabase.from("Store").update({
          deliveryFee,
          freeDeliveryAbove: freeAbove,
          deliveryRadiusKm: radius,
          lat: storeLat,
          lng: storeLng,
        }).eq("id", user.storeId).then(() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        });
      });
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  // Load existing store settings from Supabase
  useEffect(() => {
    if (!user?.storeId) return;
    import("@/lib/supabase").then(({ supabase }) => {
      supabase.from("Store")
        .select("name, tagline, address, pincode, deliveryFee, freeDeliveryAbove, deliveryRadiusKm, coverUrl, lat, lng")
        .eq("id", user.storeId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            if (data.name) setStoreName(data.name);
            if (data.tagline) setTagline(data.tagline);
            if (data.address) setAddress(data.address);
            if (data.pincode) setPincode(data.pincode);
            if (data.coverUrl) setCoverUrl(data.coverUrl);
            setDeliveryFee(data.deliveryFee ?? 49);
            setFreeAbove(data.freeDeliveryAbove ?? 999);
            setRadius(data.deliveryRadiusKm ?? 5);
            if (data.lat) setStoreLat(data.lat);
            if (data.lng) setStoreLng(data.lng);
          }
        });
    });
  }, [user?.storeId]);

  const inputCls = "w-full px-3 py-2.5 bg-surface-2 border border-border-low focus:border-primary/60 rounded-xl text-sm text-text-primary placeholder-text-mute focus:outline-none transition-colors";

  return (
    <DashboardLayout title="Store Settings">
      {saved && <SavedToast />}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar mb-6 bg-surface-1 border border-border-low rounded-2xl p-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === t
                ? t === "Danger Zone" ? "bg-danger text-white" : "bg-primary text-on-primary"
                : "text-text-dim hover:text-text-primary"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Profile ── */}
      {activeTab === "Profile" && (
        <div className="max-w-lg space-y-4">
          {/* Cover Image Upload */}
          <div className="bg-surface-1 border border-border-low rounded-2xl overflow-hidden">
            <div className="relative h-40 bg-surface-2">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt="Store cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-mute">
                  <Camera size={32} />
                </div>
              )}
              {/* Upload overlay */}
              <button
                onClick={() => coverRef.current?.click()}
                disabled={uploadingCover}
                className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center gap-2 transition-opacity text-white font-bold text-sm"
              >
                {uploadingCover ? <Loader2 size={20} className="animate-spin" /> : <><Camera size={18} /> Change Cover Photo</>}
              </button>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </div>
            <div className="p-3 flex items-center justify-between">
              <p className="text-[10px] font-bold text-text-mute uppercase tracking-wider">Store Cover Photo</p>
              {coverUrl && <span className="text-[10px] text-success font-semibold">✓ Uploaded</span>}
            </div>
          </div>

          <div className="bg-surface-1 border border-border-low rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Store size={16} className="text-primary" />
              <h3 className="font-display font-bold text-base">Store Information</h3>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Store Name</label>
              <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Tagline</label>
              <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Your store's vibe in one line" className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Address</label>
              <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} className={`${inputCls} resize-none`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Pincode</label>
                <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Store Phone</label>
                <input type="tel" value={storePhone} onChange={(e) => setStorePhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className={inputCls} />
              </div>
            </div>
          </div>
          <button onClick={save} className="w-full py-3.5 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity">Save Changes</button>
        </div>
      )}

      {/* ── Hours ── */}
      {activeTab === "Hours" && (
        <div className="max-w-lg space-y-3">
          <div className="bg-surface-1 border border-border-low rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border-low">
              <Clock size={16} className="text-primary" />
              <h3 className="font-display font-bold text-base">Operating Hours</h3>
            </div>
            {DAYS.map((day) => {
              const h = hours[day];
              return (
                <div key={day} className="flex items-center gap-3 px-5 py-3 border-b border-border-low last:border-b-0">
                  <span className="w-24 text-sm font-semibold text-text-primary shrink-0">{day}</span>
                  <button onClick={() => setHours((p) => ({ ...p, [day]: { ...p[day], open: !p[day].open } }))}
                    className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${h.open ? "bg-success" : "bg-border-low"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${h.open ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                  {h.open ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="time" value={h.from} onChange={(e) => setHours((p) => ({ ...p, [day]: { ...p[day], from: e.target.value } }))}
                        className="flex-1 px-2 py-1 bg-surface-2 border border-border-low rounded-lg text-xs focus:outline-none focus:border-primary/50" />
                      <span className="text-text-mute text-xs">→</span>
                      <input type="time" value={h.to} onChange={(e) => setHours((p) => ({ ...p, [day]: { ...p[day], to: e.target.value } }))}
                        className="flex-1 px-2 py-1 bg-surface-2 border border-border-low rounded-lg text-xs focus:outline-none focus:border-primary/50" />
                    </div>
                  ) : (
                    <span className="text-xs text-text-mute font-semibold">Closed</span>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={save} className="w-full py-3.5 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity">Save Hours</button>
        </div>
      )}

      {/* ── Delivery ── */}
      {activeTab === "Delivery" && (
        <div className="max-w-lg space-y-4">
          <div className="bg-surface-1 border border-border-low rounded-2xl p-5 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={16} className="text-primary" />
              <h3 className="font-display font-bold text-base">Delivery Zone</h3>
            </div>

            {/* Radius slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-text-mute uppercase tracking-wider">Delivery Radius</label>
                <span className="text-sm font-black text-primary">{radius} km</span>
              </div>
              <input type="range" min={1} max={100} value={radius} onChange={(e) => setRadius(+e.target.value)}
                className="w-full accent-primary" />
              <div className="flex justify-between text-[10px] text-text-mute mt-1"><span>1 km</span><span>100 km</span></div>
            </div>

            {/* Delivery zone map */}
            <DeliveryMap lat={storeLat} lng={storeLng} radiusKm={radius} onLocationChange={(lat, lng) => { setStoreLat(lat); setStoreLng(lng); }} />
            <p className="text-[10px] text-text-mute mt-1">Click on the map to set your store location. Delivery area: ~{(Math.PI * radius * radius).toFixed(0)} sq km</p>

            {/* Fees */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Delivery Fee (₹)</label>
                <input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(+e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Free Delivery Above (₹)</label>
                <input type="number" value={freeAbove} onChange={(e) => setFreeAbove(+e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>
          <button onClick={save} className="w-full py-3.5 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity">Save Delivery Settings</button>
        </div>
      )}

      {/* ── Notifications ── */}
      {activeTab === "Notifications" && (
        <div className="max-w-lg space-y-3">
          <div className="bg-surface-1 border border-border-low rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border-low">
              <Bell size={16} className="text-primary" />
              <h3 className="font-display font-bold text-base">Notification Preferences</h3>
            </div>
            {([
              { key: "newOrder",     label: "New Order",           desc: "Alert when a customer places an order"       },
              { key: "cancelled",    label: "Order Cancelled",     desc: "When a customer cancels their order"          },
              { key: "lowStock",     label: "Low Stock Alert",     desc: "When a product drops below 3 units"          },
              { key: "dailySummary", label: "Daily Summary Email", desc: "Revenue + orders recap every morning"        },
              { key: "payout",       label: "Payout Processed",    desc: "When DRIPRR transfers your earnings"         },
            ] as const).map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between px-5 py-4 border-b border-border-low last:border-b-0">
                <div>
                  <p className="text-sm font-bold text-text-primary">{label}</p>
                  <p className="text-xs text-text-mute">{desc}</p>
                </div>
                <button onClick={() => setNotifs((n) => ({ ...n, [key]: !n[key] }))}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${notifs[key] ? "bg-success" : "bg-border-low"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${notifs[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={save} className="w-full py-3.5 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity">Save Preferences</button>
        </div>
      )}

      {/* ── Danger Zone ── */}
      {activeTab === "Danger Zone" && (
        <div className="max-w-lg space-y-4">
          <div className="bg-surface-1 border-2 border-danger/30 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-danger/20 bg-danger/5">
              <AlertTriangle size={16} className="text-danger" />
              <h3 className="font-display font-bold text-base text-danger">Danger Zone</h3>
            </div>

            {/* Close temporarily */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-low">
              <div>
                <p className="text-sm font-bold text-text-primary">Temporarily Close Store</p>
                <p className="text-xs text-text-mute">Pause new orders without deleting your store</p>
              </div>
              <button className="px-4 py-2 border-2 border-warning/40 bg-warning/10 text-warning font-bold text-xs rounded-xl hover:bg-warning/20 transition-colors">
                Close Now
              </button>
            </div>

            {/* Delete store */}
            <div className="px-5 py-5">
              <p className="text-sm font-bold text-text-primary mb-1">Delete Store Account</p>
              <p className="text-xs text-text-mute mb-4">Permanently delete your store, products, and all data. This cannot be undone.</p>
              <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-2">
                Type <span className="text-danger font-black">{storeName}</span> to confirm
              </label>
              <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={storeName} className={`${inputCls} mb-3`} />
              <button
                disabled={deleteConfirm !== storeName}
                className="w-full py-3 bg-danger text-white font-bold rounded-2xl text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Permanently Delete Store
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
