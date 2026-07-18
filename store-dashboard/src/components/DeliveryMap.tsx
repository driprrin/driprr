"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Leaflet must be loaded client-side only
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then(m => m.Circle), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });

interface DeliveryMapProps {
  lat: number;
  lng: number;
  radiusKm: number;
  onLocationChange?: (lat: number, lng: number) => void;
}

export default function DeliveryMap({ lat, lng, radiusKm, onLocationChange }: DeliveryMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Import leaflet CSS
    import("leaflet/dist/leaflet.css");
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-48 bg-surface-2 border border-border-low rounded-xl flex items-center justify-center text-text-mute text-sm">
        Loading map...
      </div>
    );
  }

  return (
    <div className="w-full h-48 rounded-xl overflow-hidden border border-border-low">
      <MapContainer
        center={[lat, lng]}
        zoom={radiusKm > 50 ? 8 : radiusKm > 20 ? 10 : radiusKm > 5 ? 12 : 13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle
          center={[lat, lng]}
          radius={radiusKm * 1000}
          pathOptions={{ color: "#FF4D2E", fillColor: "#FF4D2E", fillOpacity: 0.1, weight: 2 }}
        />
        <Marker position={[lat, lng]} />
      </MapContainer>
    </div>
  );
}
