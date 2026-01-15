"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix para el icono del marcador en Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface CapitalMapProps {
  lat: number;
  lon: number;
  nombreCapital: string;
}

export default function CapitalMap({ lat, lon, nombreCapital }: CapitalMapProps) {
  if (!lat || !lon) {
    return null;
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-[#C9B99B]/40">
      <MapContainer
        center={[lat, lon]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lon]} icon={icon}>
          <Popup>{nombreCapital}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
