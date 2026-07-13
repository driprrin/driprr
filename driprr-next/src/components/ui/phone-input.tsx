"use client";

import { useState } from "react";

const COUNTRY_CODES = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+1", flag: "🇺🇸", name: "USA" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "+27", flag: "🇿🇦", name: "South Africa" },
];

interface PhoneInputProps {
  value: string;
  onChange: (fullPhone: string) => void;
  id?: string;
  required?: boolean;
}

export default function PhoneInput({ value, onChange, id = "phone", required }: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState("+91");
  const [localNumber, setLocalNumber] = useState("");
  const [open, setOpen] = useState(false);

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/\D/g, ""); // digits only
    setLocalNumber(num);
    onChange(`${countryCode}${num}`);
  };

  const handleCodeSelect = (code: string) => {
    setCountryCode(code);
    onChange(`${code}${localNumber}`);
    setOpen(false);
  };

  const selected = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];

  return (
    <div className="flex gap-2 relative">
      {/* Country code selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="h-full flex items-center gap-1.5 px-3 py-3.5 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl text-white text-sm whitespace-nowrap transition-colors focus:outline-none focus:border-primary/60"
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="font-medium text-neutral-300">{selected.code}</span>
          <span className={`material-symbols-outlined text-[16px] text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}>
            expand_more
          </span>
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-2 w-52 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="max-h-56 overflow-y-auto">
              {COUNTRY_CODES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCodeSelect(c.code)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-neutral-800 transition-colors ${
                    c.code === countryCode ? "text-primary bg-primary/5" : "text-neutral-300"
                  }`}
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="flex-1 font-medium">{c.name}</span>
                  <span className="text-neutral-500 font-mono text-xs">{c.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Number input */}
      <div className="relative flex-1">
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          placeholder="9999999999"
          value={localNumber}
          onChange={handleLocalChange}
          required={required}
          className="w-full px-4 py-3.5 bg-neutral-950 border border-neutral-800 focus:border-primary/60 rounded-2xl text-white placeholder-neutral-600 focus:outline-none transition-colors text-sm"
        />
      </div>

      {/* Click-outside overlay */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}
