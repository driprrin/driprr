"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MapPin, Plus, Navigation, Search, Loader2 } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";
import { useAuthStore } from "@/store/authStore";
import { useAddressStore } from "@/store/addressStore";

export default function LocationPage() {
  const router = useRouter();
  const { location, detect } = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { addresses } = useAddressStore();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);

  // Search using Nominatim (OpenStreetMap geocoder - free)
  useEffect(() => {
    if (!search.trim() || search.length < 3) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=5&countrycodes=in&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setResults(data.map((r: any) => ({
          name: r.address?.city || r.address?.town || r.address?.village || r.display_name.split(",")[0],
          address: r.display_name,
          state: r.address?.state || "",
          lat: r.lat,
          lng: r.lon,
        })));
      } catch { setResults([]); }
      setSearching(false);
    }, 500);
    return () => clearTimeout(timeout);
  }, [search]);

  function selectLocation(city: string, state?: string) {
    const display = state ? `${city}, ${state}` : city;
    localStorage.setItem("driprr-location", JSON.stringify({ city, state: state || "", display, ts: Date.now() }));
    router.push("/");
  }

  function handleUseCurrentLocation() {
    setDetecting(true);
    detect();
  }

  // Watch for successful detection and redirect
  useEffect(() => {
    if (detecting && location.status === "success") {
      setDetecting(false);
      router.push("/");
    }
  }, [detecting, location.status, router]);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background border-b border-border-low px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-1">
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-display font-bold text-lg">Select your location</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mute" />
          <input
            type="text"
            placeholder="Search an area or address"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full pl-10 pr-4 py-3 bg-surface-1 border border-border-low rounded-2xl text-sm text-text-primary placeholder-text-mute focus:outline-none focus:border-primary/50"
          />
          {searching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-text-mute" />}
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleUseCurrentLocation}
            disabled={detecting}
            className="flex flex-col items-center gap-1.5 px-4 py-3 bg-surface-1 border border-border-low rounded-2xl hover:border-primary/40 transition-colors flex-1"
          >
            {detecting ? (
              <Loader2 size={18} className="text-primary animate-spin" />
            ) : (
              <Navigation size={18} className="text-primary" />
            )}
            <span className="text-[10px] font-bold text-text-dim">{detecting ? "Detecting..." : "Use Current Location"}</span>
          </button>
          {isAuthenticated && (
            <Link
              href="/profile/addresses"
              className="flex flex-col items-center gap-1.5 px-4 py-3 bg-surface-1 border border-border-low rounded-2xl hover:border-primary/40 transition-colors flex-1"
            >
              <Plus size={18} className="text-primary" />
              <span className="text-[10px] font-bold text-text-dim">Add New Address</span>
            </Link>
          )}
        </div>

        {/* Search results */}
        {results.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-bold text-text-mute uppercase tracking-wider mb-2">Search Results</p>
            <div className="bg-surface-1 border border-border-low rounded-2xl divide-y divide-border-low overflow-hidden">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => selectLocation(r.name, r.state)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-surface-2 transition-colors text-left"
                >
                  <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{r.name}</p>
                    <p className="text-xs text-text-mute truncate">{r.address}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Saved addresses */}
        {isAuthenticated && addresses.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-bold text-text-mute uppercase tracking-wider mb-2">Saved Addresses</p>
            <div className="bg-surface-1 border border-border-low rounded-2xl divide-y divide-border-low overflow-hidden">
              {addresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => selectLocation(addr.city || addr.label)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-surface-2 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                    <Navigation size={14} className="text-text-mute" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-text-primary">{addr.label}</p>
                    <p className="text-xs text-text-mute truncate">{addr.address}, {addr.city}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Popular cities */}
        <div>
          <p className="text-[10px] font-bold text-text-mute uppercase tracking-wider mb-2">Popular Cities</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "Hubli", state: "Karnataka" },
              { name: "Dharwad", state: "Karnataka" },
              { name: "Belgaum", state: "Karnataka" },
              { name: "Bangalore", state: "Karnataka" },
              { name: "Kittur", state: "Karnataka" },
              { name: "Gadag", state: "Karnataka" },
            ].map((city) => (
              <button
                key={city.name}
                onClick={() => selectLocation(city.name, city.state)}
                className="flex items-center gap-2 px-4 py-3 bg-surface-1 border border-border-low rounded-xl hover:border-primary/40 transition-colors"
              >
                <MapPin size={14} className="text-primary shrink-0" />
                <span className="text-sm font-medium text-text-primary">{city.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
