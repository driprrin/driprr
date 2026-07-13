"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, MapPin, Home, Briefcase, MoreHorizontal, Trash2, Star, X } from "lucide-react";
import { useAddressStore, SavedAddress } from "@/store/addressStore";

const LABEL_ICONS: Record<string, React.ElementType> = {
  Home:  Home,
  Work:  Briefcase,
  Other: MapPin,
};

const LABEL_OPTIONS = ["Home", "Work", "Other"];

// ── Address Form ──────────────────────────────────────────────────────────────
interface FormState {
  label: string;
  name: string;
  phone: string;
  address: string;
  landmark: string;
  pincode: string;
  isDefault: boolean;
}

const EMPTY_FORM: FormState = {
  label: "Home", name: "", phone: "", address: "", landmark: "", pincode: "", isDefault: false,
};

function AddressForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: FormState;
  onSave: (data: FormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial ?? EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.name.trim())           e.name     = "Required";
    if (form.phone.length < 10)      e.phone    = "Enter 10 digits";
    if (!form.address.trim())        e.address  = "Required";
    if (form.pincode.length < 6)     e.pincode  = "Enter 6 digits";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSave(form);
  }

  function field(key: keyof FormState) {
    return {
      value: form[key] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  const inputCls = (err?: string) =>
    `w-full px-3 py-2.5 bg-surface-2 border rounded-xl text-sm text-text-primary placeholder-text-mute focus:outline-none transition-colors ${
      err ? "border-red-500/60 focus:border-red-500" : "border-border-low focus:border-primary/60"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Label chips */}
      <div>
        <p className="text-[11px] font-bold tracking-wider text-text-mute uppercase mb-2">Address Label</p>
        <div className="flex gap-2">
          {LABEL_OPTIONS.map((l) => {
            const Icon = LABEL_ICONS[l];
            const active = form.label === l;
            return (
              <button
                key={l}
                type="button"
                onClick={() => setForm((f) => ({ ...f, label: l }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all ${
                  active
                    ? "border-primary bg-primary text-on-primary"
                    : "border-border-low bg-surface-2 text-text-dim hover:border-text-mute"
                }`}
              >
                <Icon size={12} />
                {l}
              </button>
            );
          })}
        </div>
      </div>

      {/* Name + Phone */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Name</label>
          <input type="text" placeholder="Full name" {...field("name")} className={inputCls(errors.name)} />
          {errors.name && <p className="text-red-400 text-[10px] mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Phone</label>
          <input
            type="tel"
            placeholder="10-digit"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
            className={inputCls(errors.phone)}
          />
          {errors.phone && <p className="text-red-400 text-[10px] mt-1">{errors.phone}</p>}
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Address</label>
        <textarea
          placeholder="House no., street, area"
          rows={2}
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          className={`${inputCls(errors.address)} resize-none`}
        />
        {errors.address && <p className="text-red-400 text-[10px] mt-1">{errors.address}</p>}
      </div>

      {/* Landmark + Pincode */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Landmark <span className="normal-case font-normal">(opt.)</span></label>
          <input type="text" placeholder="Near..." {...field("landmark")} className={inputCls()} />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1">Pincode</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="6 digits"
            value={form.pincode}
            onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
            className={inputCls(errors.pincode)}
          />
          {errors.pincode && <p className="text-red-400 text-[10px] mt-1">{errors.pincode}</p>}
        </div>
      </div>

      {/* Default toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div
          className={`w-11 h-6 rounded-full flex items-center transition-colors ${
            form.isDefault ? "bg-primary" : "bg-border-low"
          }`}
          onClick={() => setForm((f) => ({ ...f, isDefault: !f.isDefault }))}
        >
          <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isDefault ? "translate-x-5" : "translate-x-0.5"}`} />
        </div>
        <span className="text-sm font-semibold text-text-primary">Set as default address</span>
      </label>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 border-2 border-border-low bg-surface-2 text-text-primary font-bold rounded-2xl text-sm hover:border-text-mute transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-[2] py-3 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity"
        >
          Save Address
        </button>
      </div>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AddressesPage() {
  const { addresses, addAddress, updateAddress, removeAddress, setDefault } = useAddressStore();
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const editingAddress = addresses.find((a) => a.id === editingId);

  function handleAdd(data: FormState) {
    addAddress(data);
    setMode("list");
  }

  function handleEdit(data: FormState) {
    if (editingId) {
      updateAddress(editingId, data);
      setEditingId(null);
      setMode("list");
    }
  }

  function handleDelete(id: string) {
    removeAddress(id);
    setDeleteConfirm(null);
    setMenuOpenId(null);
  }

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center gap-3 border-b border-border-low bg-surface-1/40 backdrop-blur-md sticky top-0 z-30">
        <button
          onClick={() => {
            if (mode !== "list") { setMode("list"); setEditingId(null); }
          }}
          className="w-10 h-10 bg-surface-2 border border-border-low rounded-2xl flex items-center justify-center text-text-dim hover:text-text-primary transition-all"
        >
          {mode === "list" ? (
            <Link href="/profile">
              <ArrowLeft size={18} />
            </Link>
          ) : (
            <ArrowLeft size={18} />
          )}
        </button>
        <h1 className="text-lg font-black tracking-widest uppercase flex-1">
          {mode === "list" ? "Saved Addresses" : mode === "add" ? "Add Address" : "Edit Address"}
        </h1>
        {mode === "list" && (
          <button
            onClick={() => setMode("add")}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            Add
          </button>
        )}
      </header>

      <main className="max-w-md mx-auto px-5 pt-6 relative z-10">

        {/* ── Form modes ── */}
        {(mode === "add" || mode === "edit") && (
          <div className="bg-surface-1 border border-border-low rounded-3xl p-5">
            <AddressForm
              initial={
                mode === "edit" && editingAddress
                  ? {
                      label: editingAddress.label,
                      name: editingAddress.name,
                      phone: editingAddress.phone,
                      address: editingAddress.address,
                      landmark: editingAddress.landmark ?? "",
                      pincode: editingAddress.pincode,
                      isDefault: editingAddress.isDefault,
                    }
                  : undefined
              }
              onSave={mode === "add" ? handleAdd : handleEdit}
              onCancel={() => { setMode("list"); setEditingId(null); }}
            />
          </div>
        )}

        {/* ── List mode ── */}
        {mode === "list" && (
          <>
            {addresses.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] gap-5 text-center">
                <div className="w-16 h-16 rounded-3xl bg-surface-1 border border-border-low flex items-center justify-center text-text-mute">
                  <MapPin size={28} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg">No saved addresses</h2>
                  <p className="text-text-mute text-sm mt-1">Save addresses for faster checkout.</p>
                </div>
                <button
                  onClick={() => setMode("add")}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity"
                >
                  <Plus size={16} />
                  Add Address
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => {
                  const Icon = LABEL_ICONS[addr.label] ?? MapPin;
                  return (
                    <div
                      key={addr.id}
                      className={`bg-surface-1 border rounded-2xl p-4 relative transition-all ${
                        addr.isDefault ? "border-primary/40" : "border-border-low"
                      }`}
                    >
                      {/* Default badge */}
                      {addr.isDefault && (
                        <span className="absolute top-3 right-10 flex items-center gap-1 px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black rounded-full">
                          <Star size={9} className="fill-primary" />
                          Default
                        </span>
                      )}

                      {/* Menu button */}
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === addr.id ? null : addr.id)}
                        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-2 transition-colors text-text-mute"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {/* Dropdown menu */}
                      {menuOpenId === addr.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                          <div className="absolute top-10 right-3 z-20 bg-surface-1 border border-border-low rounded-2xl shadow-xl overflow-hidden min-w-[140px]">
                            <button
                              onClick={() => { setEditingId(addr.id); setMode("edit"); setMenuOpenId(null); }}
                              className="w-full px-4 py-3 text-left text-sm font-semibold text-text-primary hover:bg-surface-2 transition-colors flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-[16px] text-text-mute">edit</span>
                              Edit
                            </button>
                            {!addr.isDefault && (
                              <button
                                onClick={() => { setDefault(addr.id); setMenuOpenId(null); }}
                                className="w-full px-4 py-3 text-left text-sm font-semibold text-text-primary hover:bg-surface-2 transition-colors flex items-center gap-2"
                              >
                                <Star size={14} className="text-text-mute" />
                                Set Default
                              </button>
                            )}
                            <button
                              onClick={() => { setDeleteConfirm(addr.id); setMenuOpenId(null); }}
                              className="w-full px-4 py-3 text-left text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </>
                      )}

                      {/* Address content */}
                      <div className="flex items-start gap-3 pr-8">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon size={16} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-black uppercase tracking-widest text-primary">{addr.label}</p>
                          </div>
                          <p className="text-sm font-semibold text-text-primary mt-0.5">{addr.name}</p>
                          <p className="text-xs text-text-dim mt-1 leading-relaxed">
                            {addr.address}
                            {addr.landmark && `, near ${addr.landmark}`}
                            {" — "}{addr.pincode}
                          </p>
                          <p className="text-xs text-text-mute mt-1">{addr.phone}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add another */}
                <button
                  onClick={() => setMode("add")}
                  className="w-full py-4 border-2 border-dashed border-border-low rounded-2xl text-sm font-bold text-text-mute hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add Another Address
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setDeleteConfirm(null)} />
          <div className="fixed bottom-0 inset-x-0 z-50 bg-surface-1 rounded-t-3xl p-6 animate-slide-up">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash2 size={22} className="text-red-400" />
              </div>
            </div>
            <h3 className="font-display font-black text-lg text-center">Delete Address?</h3>
            <p className="text-text-mute text-sm text-center mt-2">This address will be permanently removed.</p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 border-2 border-border-low bg-surface-2 text-text-primary font-bold rounded-2xl text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-[1.5] py-3 bg-red-500 text-white font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity"
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
