"use client";

import dynamic from "next/dynamic";

// Cargar el mapa dinámicamente solo en el cliente para evitar errores de SSR
const CapitalMap = dynamic(() => import("@/components/CapitalMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-[#C9B99B]/40 bg-[#F5F1E8] flex items-center justify-center">
      <p className="text-[#6B5D47]">Cargando mapa...</p>
    </div>
  ),
});

interface CapitalMapWrapperProps {
  lat: number;
  lon: number;
  nombreCapital: string;
}

export default function CapitalMapWrapper({
  lat,
  lon,
  nombreCapital,
}: CapitalMapWrapperProps) {
  return <CapitalMap lat={lat} lon={lon} nombreCapital={nombreCapital} />;
}
