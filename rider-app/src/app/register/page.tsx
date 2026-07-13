"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User, Mail, Phone, MapPin, CreditCard,
  Car, Bike, ChevronLeft, Check, ArrowRight,
  Loader2, Zap, Fuel, Calendar, Shield,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormData {
  // Step 1 — Personal
  fullName: string; email: string; phone: string;
  dateOfBirth: string; gender: string;
  // Step 2 — Address
  address: string; city: string; pincode: string; preferredZone: string;
  // Step 3 — Identity & Licence
  aadhaarNumber: string; licenceNumber: string; licenceExpiry: string;
  // Step 4 — Vehicle
  vehicleType: string; fuelType: string;
  vehicleNumber: string; vehicleModel: string; vehicleYear: string;
  // Step 5 — Emergency
  emergencyName: string; emergencyPhone: string; emergencyRelation: string;
}

const EMPTY: FormData = {
  fullName: "", email: "", phone: "", dateOfBirth: "", gender: "",
  address: "", city: "", pincode: "", preferredZone: "",
  aadhaarNumber: "", licenceNumber: "", licenceExpiry: "",
  vehicleType: "", fuelType: "", vehicleNumber: "", vehicleModel: "", vehicleYear: "",
  emergencyName: "", emergencyPhone: "", emergencyRelation: "",
};

const STEPS = [
  { label: "Personal",  icon: User     },
  { label: "Address",   icon: MapPin   },
  { label: "Identity",  icon: Shield   },
  { label: "Vehicle",   icon: Bike     },
  { label: "Emergency", icon: Phone    },
];

const inputCls = "w-full px-4 py-3 bg-surface-2 border border-border-low focus:border-primary/60 rounded-2xl text-sm text-text-primary placeholder-text-mute focus:outline-none transition-colors";
const errBorder = "border-red-500/60 focus:border-red-500";

const ZONES = ["Hubli Central", "Dharwad", "Keshwapur", "Gokul Road", "Vidyanagar", "Shirur Park"];

// ── Main Component ────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [step, setStep]       = useState(0);
  const [form, setForm]       = useState<FormData>(EMPTY);
  const [errors, setErrors]   = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function set(key: keyof FormData, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (step === 0) {
      if (!form.fullName.trim())    e.fullName    = "Required";
      if (!form.email.trim())       e.email       = "Required";
      if (form.phone.length < 10)   e.phone       = "Enter 10 digits";
      if (!form.dateOfBirth)        e.dateOfBirth = "Required";
      if (!form.gender)             e.gender      = "Select gender";
    }
    if (step === 1) {
      if (!form.address.trim())     e.address     = "Required";
      if (!form.city.trim())        e.city        = "Required";
      if (form.pincode.length < 6)  e.pincode     = "Enter 6 digits";
      if (!form.preferredZone)      e.preferredZone = "Select a zone";
    }
    if (step === 2) {
      if (form.aadhaarNumber.replace(/\s/g,"").length < 12) e.aadhaarNumber = "Enter 12-digit Aadhaar";
      if (!form.licenceNumber.trim()) e.licenceNumber = "Required";
      if (!form.licenceExpiry)        e.licenceExpiry = "Required";
    }
    if (step === 3) {
      if (!form.vehicleType)          e.vehicleType   = "Select vehicle type";
      if (!form.fuelType)             e.fuelType      = "Select fuel type";
      if (!form.vehicleNumber.trim()) e.vehicleNumber = "Required";
      if (!form.vehicleModel.trim())  e.vehicleModel  = "Required";
      if (!form.vehicleYear.trim())   e.vehicleYear   = "Required";
    }
    if (step === 4) {
      if (!form.emergencyName.trim())  e.emergencyName  = "Required";
      if (form.emergencyPhone.length < 10) e.emergencyPhone = "Enter 10 digits";
      if (!form.emergencyRelation)     e.emergencyRelation = "Select relation";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() { if (validate()) setStep((s) => s + 1); }
  function back() { setStep((s) => s - 1); setErrors({}); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setSubmitError("");
    try {
      const { error } = await supabase.from("RiderApplication").insert({
        fullName:           form.fullName.trim(),
        email:              form.email.trim().toLowerCase(),
        phone:              form.phone,
        dateOfBirth:        form.dateOfBirth,
        gender:             form.gender,
        address:            form.address.trim(),
        city:               form.city.trim(),
        pincode:            form.pincode,
        preferredZone:      form.preferredZone,
        aadhaarNumber:      form.aadhaarNumber.replace(/\s/g, ""),
        licenceNumber:      form.licenceNumber.trim().toUpperCase(),
        licenceExpiry:      form.licenceExpiry,
        vehicleType:        form.vehicleType,
        fuelType:           form.fuelType,
        vehicleNumber:      form.vehicleNumber.trim().toUpperCase(),
        vehicleModel:       form.vehicleModel.trim(),
        vehicleYear:        form.vehicleYear,
        emergencyName:      form.emergencyName.trim(),
        emergencyPhone:     form.emergencyPhone,
        emergencyRelation:  form.emergencyRelation,
        status:             "PENDING",
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed.";
      setSubmitError(msg.includes("unique") ? "An application with this email already exists." : msg);
    } finally { setLoading(false); }
  }

  const errCls = (k: keyof FormData) => errors[k] ? errBorder : "";
  const prog = ((step + 1) / STEPS.length) * 100;

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="relative inline-flex">
            <div className="w-24 h-24 rounded-full bg-success/15 flex items-center justify-center">
              <Check size={44} className="text-success" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-success/30 animate-ping" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-text-primary">Application Sent!</h1>
            <p className="text-text-mute text-sm mt-2 leading-relaxed">
              Thanks <span className="text-text-primary font-bold">{form.fullName}</span>! We'll verify your documents and get back to you within 2–3 days.
            </p>
          </div>
          <div className="bg-surface-1 border border-border-low rounded-2xl p-4 text-left space-y-2">
            <p className="text-[11px] font-black text-text-mute uppercase tracking-wider mb-2">What's next</p>
            {["Background verification (1–2 days)", "Document review by our team", "You'll receive login credentials on email", "Start delivering and earning!"].map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-text-dim">{s}</span>
              </div>
            ))}
          </div>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity">
            Back to Login <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary relative overflow-hidden">
      <div className="absolute top-[-30%] left-[-30%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="max-w-md mx-auto px-5 py-8 relative z-10">

        {/* Back */}
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-mute hover:text-text-primary mb-6">
          <ChevronLeft size={14} /> Back to login
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <Bike size={24} className="text-on-primary" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl leading-tight">Become a Rider</h1>
            <p className="text-text-mute text-sm">Join DRIPRR delivery network</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-2 h-1.5 bg-surface-2 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${prog}%` }} />
        </div>
        <p className="text-[11px] text-text-mute mb-5">Step {step + 1} of {STEPS.length} — {STEPS[step].label}</p>

        {/* Step dots */}
        <div className="flex items-center gap-1.5 mb-6">
          {STEPS.map((s, i) => {
            const done = i < step; const active = i === step;
            return (
              <div key={s.label} className="flex items-center gap-1.5 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 ${done ? "bg-success" : active ? "bg-primary scale-110" : "bg-surface-2 border border-border-low"}`}>
                  {done ? <Check size={13} className="text-white" /> : <s.icon size={12} className={active ? "text-on-primary" : "text-text-mute"} />}
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded-full ${done ? "bg-success" : "bg-border-low"}`} />}
              </div>
            );
          })}
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit}>
          <div className="bg-surface-1/60 backdrop-blur-xl border border-border-low rounded-3xl p-5 space-y-4">

            {submitError && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded-2xl text-danger text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>{submitError}
              </div>
            )}

            {/* ── Step 0: Personal ── */}
            {step === 0 && <>
              <h2 className="font-display font-black text-lg">Personal Details</h2>
              <div>
                <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Full Name (as on Aadhaar)</label>
                <div className="relative">
                  <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mute" />
                  <input type="text" placeholder="Your full name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} className={`${inputCls} pl-11 ${errCls("fullName")}`} />
                </div>
                {errors.fullName && <p className="text-red-400 text-[10px] mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mute" />
                  <input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} className={`${inputCls} pl-11 ${errCls("email")}`} />
                </div>
                {errors.email && <p className="text-red-400 text-[10px] mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Phone</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mute" />
                  <input type="tel" placeholder="10-digit mobile" value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g,"").slice(0,10))} className={`${inputCls} pl-11 ${errCls("phone")}`} />
                </div>
                {errors.phone && <p className="text-red-400 text-[10px] mt-1">{errors.phone}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Date of Birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} className={`${inputCls} ${errCls("dateOfBirth")}`} />
                  {errors.dateOfBirth && <p className="text-red-400 text-[10px] mt-1">{errors.dateOfBirth}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Gender</label>
                  <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className={`${inputCls} ${errCls("gender")}`}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                  {errors.gender && <p className="text-red-400 text-[10px] mt-1">{errors.gender}</p>}
                </div>
              </div>
            </>}

            {/* ── Step 1: Address ── */}
            {step === 1 && <>
              <h2 className="font-display font-black text-lg">Address & Zone</h2>
              <div>
                <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Full Address</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-4 top-3.5 text-text-mute" />
                  <textarea rows={2} placeholder="House no., street, area" value={form.address} onChange={(e) => set("address", e.target.value)} className={`${inputCls} pl-11 resize-none ${errCls("address")}`} />
                </div>
                {errors.address && <p className="text-red-400 text-[10px] mt-1">{errors.address}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">City</label>
                  <input type="text" placeholder="Hubli" value={form.city} onChange={(e) => set("city", e.target.value)} className={`${inputCls} ${errCls("city")}`} />
                  {errors.city && <p className="text-red-400 text-[10px] mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Pincode</label>
                  <input type="text" inputMode="numeric" placeholder="6 digits" value={form.pincode} onChange={(e) => set("pincode", e.target.value.replace(/\D/g,"").slice(0,6))} className={`${inputCls} ${errCls("pincode")}`} />
                  {errors.pincode && <p className="text-red-400 text-[10px] mt-1">{errors.pincode}</p>}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-2">Preferred Delivery Zone</label>
                <div className="flex flex-wrap gap-2">
                  {ZONES.map((z) => (
                    <button key={z} type="button" onClick={() => set("preferredZone", z)} className={`px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all ${form.preferredZone === z ? "border-primary bg-primary text-on-primary" : "border-border-low bg-surface-2 text-text-dim hover:border-text-mute"}`}>{z}</button>
                  ))}
                </div>
                {errors.preferredZone && <p className="text-red-400 text-[10px] mt-1">{errors.preferredZone}</p>}
              </div>
            </>}

            {/* ── Step 2: Identity ── */}
            {step === 2 && <>
              <h2 className="font-display font-black text-lg">Identity & Licence</h2>
              <div>
                <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Aadhaar Number</label>
                <div className="relative">
                  <CreditCard size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mute" />
                  <input type="text" inputMode="numeric" placeholder="XXXX XXXX XXXX"
                    value={form.aadhaarNumber}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g,"").slice(0,12);
                      const formatted = digits.replace(/(\d{4})(?=\d)/g,"$1 ").trim();
                      set("aadhaarNumber", formatted);
                    }}
                    className={`${inputCls} pl-11 tracking-widest ${errCls("aadhaarNumber")}`} />
                </div>
                {errors.aadhaarNumber && <p className="text-red-400 text-[10px] mt-1">{errors.aadhaarNumber}</p>}
                <p className="text-[10px] text-text-mute mt-1">Your Aadhaar is encrypted and never shared publicly.</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Driving Licence Number</label>
                <input type="text" placeholder="KA01 20200012345" value={form.licenceNumber}
                  onChange={(e) => set("licenceNumber", e.target.value.toUpperCase())}
                  className={`${inputCls} uppercase tracking-wider ${errCls("licenceNumber")}`} />
                {errors.licenceNumber && <p className="text-red-400 text-[10px] mt-1">{errors.licenceNumber}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Licence Expiry Date</label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mute" />
                  <input type="date" value={form.licenceExpiry} onChange={(e) => set("licenceExpiry", e.target.value)} className={`${inputCls} pl-11 ${errCls("licenceExpiry")}`} />
                </div>
                {errors.licenceExpiry && <p className="text-red-400 text-[10px] mt-1">{errors.licenceExpiry}</p>}
              </div>
            </>}

            {/* ── Step 3: Vehicle ── */}
            {step === 3 && <>
              <h2 className="font-display font-black text-lg">Vehicle Details</h2>

              {/* Vehicle type */}
              <div>
                <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-2">Vehicle Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ val: "bike", label: "Bike", icon: "🏍️" }, { val: "scooty", label: "Scooty / Scooter", icon: "🛵" }].map((v) => (
                    <button key={v.val} type="button" onClick={() => set("vehicleType", v.val)}
                      className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 font-bold text-sm transition-all ${form.vehicleType === v.val ? "border-primary bg-primary/10 text-primary" : "border-border-low bg-surface-2 text-text-dim hover:border-text-mute"}`}>
                      <span className="text-2xl">{v.icon}</span>{v.label}
                    </button>
                  ))}
                </div>
                {errors.vehicleType && <p className="text-red-400 text-[10px] mt-1">{errors.vehicleType}</p>}
              </div>

              {/* Fuel type */}
              <div>
                <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-2">Fuel Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ val: "petrol", label: "Petrol", icon: Fuel }, { val: "electric", label: "Electric", icon: Zap }].map((v) => (
                    <button key={v.val} type="button" onClick={() => set("fuelType", v.val)}
                      className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 font-bold text-sm transition-all ${form.fuelType === v.val ? "border-primary bg-primary/10 text-primary" : "border-border-low bg-surface-2 text-text-dim hover:border-text-mute"}`}>
                      <v.icon size={18} />{v.label}
                    </button>
                  ))}
                </div>
                {errors.fuelType && <p className="text-red-400 text-[10px] mt-1">{errors.fuelType}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Vehicle Registration Number</label>
                <div className="relative">
                  <Car size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mute" />
                  <input type="text" placeholder="KA 25 AB 1234" value={form.vehicleNumber}
                    onChange={(e) => set("vehicleNumber", e.target.value.toUpperCase())}
                    className={`${inputCls} pl-11 uppercase tracking-widest ${errCls("vehicleNumber")}`} />
                </div>
                {errors.vehicleNumber && <p className="text-red-400 text-[10px] mt-1">{errors.vehicleNumber}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Vehicle Model</label>
                  <input type="text" placeholder="Honda Activa" value={form.vehicleModel} onChange={(e) => set("vehicleModel", e.target.value)} className={`${inputCls} ${errCls("vehicleModel")}`} />
                  {errors.vehicleModel && <p className="text-red-400 text-[10px] mt-1">{errors.vehicleModel}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Year</label>
                  <select value={form.vehicleYear} onChange={(e) => set("vehicleYear", e.target.value)} className={`${inputCls} ${errCls("vehicleYear")}`}>
                    <option value="">Select</option>
                    {Array.from({length: 15}, (_,i) => 2024 - i).map((y) => <option key={y}>{y}</option>)}
                  </select>
                  {errors.vehicleYear && <p className="text-red-400 text-[10px] mt-1">{errors.vehicleYear}</p>}
                </div>
              </div>
            </>}

            {/* ── Step 4: Emergency ── */}
            {step === 4 && <>
              <h2 className="font-display font-black text-lg">Emergency Contact</h2>
              <p className="text-xs text-text-mute -mt-2">Someone we can contact in case of an emergency during delivery.</p>
              <div>
                <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Contact Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mute" />
                  <input type="text" placeholder="Full name" value={form.emergencyName} onChange={(e) => set("emergencyName", e.target.value)} className={`${inputCls} pl-11 ${errCls("emergencyName")}`} />
                </div>
                {errors.emergencyName && <p className="text-red-400 text-[10px] mt-1">{errors.emergencyName}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mute" />
                  <input type="tel" placeholder="10-digit number" value={form.emergencyPhone} onChange={(e) => set("emergencyPhone", e.target.value.replace(/\D/g,"").slice(0,10))} className={`${inputCls} pl-11 ${errCls("emergencyPhone")}`} />
                </div>
                {errors.emergencyPhone && <p className="text-red-400 text-[10px] mt-1">{errors.emergencyPhone}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-2">Relation</label>
                <div className="flex flex-wrap gap-2">
                  {["Father", "Mother", "Spouse", "Sibling", "Friend", "Other"].map((r) => (
                    <button key={r} type="button" onClick={() => set("emergencyRelation", r)} className={`px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all ${form.emergencyRelation === r ? "border-primary bg-primary text-on-primary" : "border-border-low bg-surface-2 text-text-dim hover:border-text-mute"}`}>{r}</button>
                  ))}
                </div>
                {errors.emergencyRelation && <p className="text-red-400 text-[10px] mt-1">{errors.emergencyRelation}</p>}
              </div>
              <div className="p-3 bg-surface-2 rounded-2xl border border-border-low text-xs text-text-mute leading-relaxed">
                By submitting, you confirm that all provided information is accurate and that you agree to DRIPRR's delivery partner terms.
              </div>
            </>}

          </div>

          {/* Navigation */}
          <div className="flex gap-3 mt-5">
            {step > 0 && (
              <button type="button" onClick={back} className="flex-1 py-3.5 border-2 border-border-low bg-surface-1 text-text-primary font-bold rounded-2xl text-sm hover:border-text-mute transition-colors flex items-center justify-center gap-2">
                <ChevronLeft size={16} /> Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} className="flex-[2] py-3.5 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" disabled={loading} className="flex-[2] py-3.5 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : <><Check size={16} /> Submit Application</>}
              </button>
            )}
          </div>
          <p className="text-center text-[11px] text-text-mute mt-4">
            Already registered? <Link href="/login" className="text-primary font-bold hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
