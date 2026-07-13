"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Store, User, Mail, Phone, MapPin, Tag,
  ChevronLeft, Check, ArrowRight, Loader2, Eye, EyeOff, Lock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const CATEGORIES = ["Top Wear", "Bottom Wear", "Foot Wear", "Accessories", "Mixed / All"];

interface FormData {
  // Step 1 — Personal
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  // Step 2 — Store
  storeName: string;
  storeAddress: string;
  city: string;
  pincode: string;
  categories: string[];
  // Step 3 — About
  description: string;
  instagram: string;
  experience: string;
  monthlySales: string;
}

const EMPTY: FormData = {
  ownerName: "", email: "", phone: "", password: "", confirmPassword: "",
  storeName: "", storeAddress: "", city: "", pincode: "", categories: [],
  description: "", instagram: "", experience: "", monthlySales: "",
};

const STEPS = [
  { label: "Personal Info",  icon: User  },
  { label: "Store Details",  icon: Store },
  { label: "About You",      icon: Tag   },
];

const inputCls = "w-full px-4 py-3 bg-surface-2 border border-border-low focus:border-primary/60 rounded-2xl text-sm text-text-primary placeholder-text-mute focus:outline-none transition-colors";

export default function ApplyPage() {
  const [step, setStep]           = useState(0);
  const [form, setForm]           = useState<FormData>(EMPTY);
  const [errors, setErrors]       = useState<Partial<FormData>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  function set(key: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function toggleCategory(cat: string) {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }));
  }

  function validateStep(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (step === 0) {
      if (!form.ownerName.trim()) e.ownerName = "Required";
      if (!form.email.trim())     e.email     = "Required";
      if (form.phone.length < 10) e.phone     = "Enter 10 digits";
      if (form.password.length < 6) e.password = "Min 6 characters";
      if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    }
    if (step === 1) {
      if (!form.storeName.trim())    e.storeName    = "Required";
      if (!form.storeAddress.trim()) e.storeAddress = "Required";
      if (!form.city.trim())         e.city         = "Required";
      if (form.pincode.length < 6)   e.pincode      = "Enter 6 digits";
      if (form.categories.length === 0) e.categories = "Select at least one";
    }
    if (step === 2) {
      if (!form.description.trim()) e.description = "Required";
    }
    setErrors(e as Partial<FormData>);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (validateStep()) setStep((s) => s + 1);
  }

  function back() {
    setStep((s) => s - 1);
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep()) return;
    setLoading(true);
    setSubmitError("");

    try {
      const { error } = await supabase
        .from("StoreApplication")
        .insert({
          ownerName:    form.ownerName.trim(),
          email:        form.email.trim().toLowerCase(),
          phone:        form.phone.trim(),
          password:     form.password,   // stored so admin approve can use it
          storeName:    form.storeName.trim(),
          storeAddress: form.storeAddress.trim(),
          city:         form.city.trim(),
          pincode:      form.pincode.trim(),
          categories:   form.categories,
          description:  form.description.trim(),
          instagram:    form.instagram.trim() || null,
          experience:   form.experience || null,
          monthlySales: form.monthlySales || null,
          status:       "PENDING",
        });

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed. Please try again.";
      // Handle duplicate email gracefully
      if (msg.includes("unique") || msg.includes("duplicate")) {
        setSubmitError("An application with this email already exists. Contact us if you need help.");
      } else {
        setSubmitError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  const errCls = (key: keyof FormData) =>
    errors[key] ? "border-red-500/60 focus:border-red-500" : "";

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="relative inline-flex">
            <div className="w-24 h-24 rounded-full bg-success/15 flex items-center justify-center">
              <Check size={44} className="text-success" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-success/30 animate-ping" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-text-primary">Application Submitted!</h1>
            <p className="text-text-mute text-sm mt-2 leading-relaxed">
              Thanks <span className="text-text-primary font-bold">{form.ownerName}</span>! We'll review your application for{" "}
              <span className="text-primary font-bold">{form.storeName}</span> and get back to you within 2–3 business days.
            </p>
          </div>
          <div className="bg-surface-1 border border-border-low rounded-2xl p-4 text-left space-y-2 text-sm">
            <p className="text-[11px] font-black text-text-mute uppercase tracking-wider mb-2">What happens next</p>
            {[
              "We review your store details",
              "Our team may reach out for a quick call",
              "Once approved, you'll get login credentials",
              "You can start listing products on DRIPRR",
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-text-dim">{s}</span>
              </div>
            ))}
          </div>
          <Link href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity">
            Back to Login
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="max-w-lg mx-auto px-4 py-10 relative z-10">

        {/* Back to login */}
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-mute hover:text-text-primary transition-colors mb-6">
          <ChevronLeft size={14} />
          Back to login
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <Store size={24} className="text-on-primary" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl leading-tight">Apply to Sell</h1>
            <p className="text-text-mute text-sm">Join DRIPRR as a store partner</p>
          </div>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const done   = i < step;
            const active = i === step;
            return (
              <div key={s.label} className="flex items-center gap-2 flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    done   ? "bg-success text-white" :
                    active ? "bg-primary text-on-primary scale-110 shadow-md shadow-primary/30" :
                             "bg-surface-2 border border-border-low text-text-mute"
                  }`}>
                    {done ? <Check size={14} /> : <s.icon size={14} />}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${
                    active ? "text-primary" : done ? "text-success" : "text-text-mute"
                  }`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full mb-4 transition-colors ${done ? "bg-success" : "bg-border-low"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit}>
          <div className="bg-surface-1/60 backdrop-blur-xl border border-border-low rounded-3xl p-6 shadow-xl space-y-4">

            {/* Submit error */}
            {submitError && (
              <div className="flex items-start gap-3 p-4 bg-red-950/40 border border-red-900/60 rounded-2xl text-red-400 text-xs">
                <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                <span>{submitError}</span>
              </div>
            )}

            {/* ── Step 0: Personal Info ── */}
            {step === 0 && (
              <>
                <h2 className="font-display font-black text-lg mb-1">Personal Information</h2>
                <p className="text-xs text-text-mute -mt-3 mb-2">Tell us about the store owner</p>

                <div>
                  <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mute" />
                    <input type="text" placeholder="Ravi Sharma" value={form.ownerName}
                      onChange={(e) => set("ownerName", e.target.value)}
                      className={`${inputCls} pl-11 ${errCls("ownerName")}`} />
                  </div>
                  {errors.ownerName && <p className="text-red-400 text-[10px] mt-1">{errors.ownerName}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mute" />
                    <input type="email" placeholder="ravi@yourstore.com" value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      className={`${inputCls} pl-11 ${errCls("email")}`} />
                  </div>
                  {errors.email && <p className="text-red-400 text-[10px] mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mute" />
                    <input type="tel" placeholder="10-digit mobile number" value={form.phone}
                      onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className={`${inputCls} pl-11 ${errCls("phone")}`} />
                  </div>
                  {errors.phone && <p className="text-red-400 text-[10px] mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mute" />
                    <input type={showPassword ? "text" : "password"} placeholder="Create a password (min 6 chars)" value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      className={`${inputCls} pl-11 pr-11 ${errCls("password")}`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-mute hover:text-text-primary transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-[10px] mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mute" />
                    <input type={showConfirm ? "text" : "password"} placeholder="Repeat your password" value={form.confirmPassword}
                      onChange={(e) => set("confirmPassword", e.target.value)}
                      className={`${inputCls} pl-11 pr-11 ${errCls("confirmPassword")}`} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-mute hover:text-text-primary transition-colors">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-400 text-[10px] mt-1">{errors.confirmPassword}</p>}
                </div>
              </>
            )}

            {/* ── Step 1: Store Details ── */}
            {step === 1 && (
              <>
                <h2 className="font-display font-black text-lg mb-1">Store Details</h2>
                <p className="text-xs text-text-mute -mt-3 mb-2">Tell us about your streetwear store</p>

                <div>
                  <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Store Name</label>
                  <div className="relative">
                    <Store size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mute" />
                    <input type="text" placeholder="e.g. Hype District" value={form.storeName}
                      onChange={(e) => set("storeName", e.target.value)}
                      className={`${inputCls} pl-11 ${errCls("storeName")}`} />
                  </div>
                  {errors.storeName && <p className="text-red-400 text-[10px] mt-1">{errors.storeName}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Store Address</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-3.5 text-text-mute" />
                    <textarea rows={2} placeholder="Shop no., street, area" value={form.storeAddress}
                      onChange={(e) => set("storeAddress", e.target.value)}
                      className={`${inputCls} pl-11 resize-none ${errCls("storeAddress")}`} />
                  </div>
                  {errors.storeAddress && <p className="text-red-400 text-[10px] mt-1">{errors.storeAddress}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">City</label>
                    <input type="text" placeholder="Hubli" value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                      className={`${inputCls} ${errCls("city")}`} />
                    {errors.city && <p className="text-red-400 text-[10px] mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">Pincode</label>
                    <input type="text" inputMode="numeric" placeholder="6 digits" value={form.pincode}
                      onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className={`${inputCls} ${errCls("pincode")}`} />
                    {errors.pincode && <p className="text-red-400 text-[10px] mt-1">{errors.pincode}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-2">
                    Product Categories <span className="normal-case font-normal">(select all that apply)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => {
                      const active = form.categories.includes(c);
                      return (
                        <button key={c} type="button" onClick={() => toggleCategory(c)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all ${
                            active
                              ? "border-primary bg-primary text-on-primary"
                              : "border-border-low bg-surface-2 text-text-dim hover:border-text-mute"
                          }`}>
                          {active && <Check size={11} />}
                          {c}
                        </button>
                      );
                    })}
                  </div>
                  {errors.categories && <p className="text-red-400 text-[10px] mt-1">{errors.categories}</p>}
                </div>
              </>
            )}

            {/* ── Step 2: About ── */}
            {step === 2 && (
              <>
                <h2 className="font-display font-black text-lg mb-1">About Your Store</h2>
                <p className="text-xs text-text-mute -mt-3 mb-2">Help us understand your brand better</p>

                <div>
                  <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">
                    Describe Your Store
                  </label>
                  <textarea rows={3} placeholder="Tell us what makes your store unique, what you sell, and your target customers..."
                    value={form.description} onChange={(e) => set("description", e.target.value)}
                    className={`${inputCls} resize-none ${errCls("description")}`} />
                  {errors.description && <p className="text-red-400 text-[10px] mt-1">{errors.description}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-1.5">
                    Instagram Handle <span className="normal-case font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mute text-sm font-bold">@</span>
                    <input type="text" placeholder="yourstorehandle" value={form.instagram}
                      onChange={(e) => set("instagram", e.target.value.replace("@", ""))}
                      className={`${inputCls} pl-9`} />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-2">
                    Years in Business
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["< 1 yr", "1–2 yrs", "3–5 yrs", "5+ yrs"].map((opt) => (
                      <button key={opt} type="button" onClick={() => set("experience", opt)}
                        className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                          form.experience === opt
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border-low bg-surface-2 text-text-dim hover:border-text-mute"
                        }`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-mute uppercase tracking-wider mb-2">
                    Estimated Monthly Sales
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Under ₹50k", "₹50k–₹2L", "₹2L–₹10L", "Above ₹10L"].map((opt) => (
                      <button key={opt} type="button" onClick={() => set("monthlySales", opt)}
                        className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                          form.monthlySales === opt
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border-low bg-surface-2 text-text-dim hover:border-text-mute"
                        }`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-5">
            {step > 0 && (
              <button type="button" onClick={back}
                className="flex-1 py-3.5 border-2 border-border-low bg-surface-1 text-text-primary font-bold rounded-2xl text-sm hover:border-text-mute transition-colors flex items-center justify-center gap-2">
                <ChevronLeft size={16} />
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next}
                className="flex-[2] py-3.5 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                Continue
                <ArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" disabled={loading}
                className="flex-[2] py-3.5 bg-primary text-on-primary font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70">
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Submitting…</>
                ) : (
                  <><Check size={16} /> Submit Application</>
                )}
              </button>
            )}
          </div>

          <p className="text-center text-[11px] text-text-mute mt-4">
            Already approved?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">Sign in here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
