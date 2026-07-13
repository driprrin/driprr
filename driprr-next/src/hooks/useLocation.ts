"use client";

import { useState, useCallback, useEffect } from "react";

type LocationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; city: string; state: string; display: string }
  | { status: "error"; message: string };

async function reverseGeocode(lat: number, lon: number): Promise<{ city: string; state: string }> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
    { headers: { "Accept-Language": "en" } }
  );
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();

  const addr = data.address ?? {};
  const city =
    addr.city || addr.town || addr.village || addr.county || addr.suburb || "Unknown city";
  const state = addr.state || addr.region || "";
  return { city, state };
}

const CACHE_KEY = "driprr-location";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({ status: "idle" });

  // On mount: restore cached location immediately
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Date.now() - cached.ts < CACHE_TTL) {
          setLocation({
            status: "success",
            city: cached.city,
            state: cached.state,
            display: cached.display,
          });
          return; // Still fresh — no need to re-fetch
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const detect = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation({ status: "error", message: "Geolocation not supported" });
      return;
    }

    setLocation((prev) =>
      // Keep showing last known location while loading (no flash to spinner if cached)
      prev.status === "success" ? prev : { status: "loading" }
    );

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { city, state } = await reverseGeocode(coords.latitude, coords.longitude);
          const display = state ? `${city}, ${state}` : city;
          const result = { status: "success" as const, city, state, display };
          setLocation(result);
          // Cache result
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ city, state, display, ts: Date.now() })
          );
        } catch {
          setLocation({ status: "error", message: "Could not fetch location name" });
        }
      },
      (err) => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied"
            : "Could not get location";
        setLocation({ status: "error", message });
      },
      { timeout: 10000, maximumAge: CACHE_TTL }
    );
  }, []);

  return { location, detect };
}
