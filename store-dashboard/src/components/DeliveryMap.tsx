"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface DeliveryMapProps {
  lat: number;
  lng: number;
  radiusKm: number;
  onLocationChange?: (lat: number, lng: number) => void;
}

function ClickHandler({ onLocationChange }: { onLocationChange?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onLocationChange) {
        onLocationChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function DeliveryMap({ lat, lng, radiusKm, onLocationChange }: DeliveryMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="w-full h-56 bg-surface-2 border border-border-low rounded-xl flex items-center justify-center text-text-mute text-sm">
        Loading map...
      </div>
    );
  }

  const zoom = radiusKm > 50 ? 8 : radiusKm > 20 ? 10 : radiusKm > 5 ? 12 : 13;

  return (
    <div className="w-full h-56 rounded-xl overflow-hidden border border-border-low relative">
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
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
        <Marker position={[lat, lng]} icon={icon} />
        <ClickHandler onLocationChange={onLocationChange} />
        <MapUpdater center={[lat, lng]} zoom={zoom} />
      </MapContainer>
      {onLocationChange && (
        <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] font-medium text-neutral-600 shadow-sm">
          Click map to set store location
        </div>
      )}
    </div>
  );
}
