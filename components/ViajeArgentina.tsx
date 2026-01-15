"use client";

import { useState, useMemo } from "react";
import { Provincia } from "@/lib/data";
import MapaArgentina from "./MapaArgentina";
import FiltroZonas from "./FiltroZonas";
import ProvinciaCard from "./ProvinciaCard";

interface ViajeArgentinaProps {
  provincias: Provincia[];
}

export default function ViajeArgentina({ provincias }: ViajeArgentinaProps) {
  const [zonaActiva, setZonaActiva] = useState<string>("Todas");

  const provinciasFiltradas = useMemo(() => {
    if (zonaActiva === "Todas") {
      return provincias;
    }
    return provincias.filter((p) => p.zona === zonaActiva);
  }, [provincias, zonaActiva]);

  return (
    <div className="w-full">
      {/* Filtros por zona */}
      <FiltroZonas zonaActiva={zonaActiva} onZonaChange={setZonaActiva} />

      {/* Mapa interactivo */}
      <MapaArgentina provincias={provincias} zonaActiva={zonaActiva} />

      {/* Grilla de provincias filtradas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-12">
        {provinciasFiltradas.map((provincia) => (
          <ProvinciaCard key={provincia.slug} provincia={provincia} />
        ))}
      </div>

      {/* Mensaje si no hay provincias */}
      {provinciasFiltradas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#6B5D47] text-lg">
            No se encontraron provincias para la zona seleccionada.
          </p>
        </div>
      )}
    </div>
  );
}
