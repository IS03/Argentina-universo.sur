"use client";

import { REGIONES } from "@/lib/catalog";
import { chip } from "@/components/ui/estilos";

interface FiltroZonasProps {
  zonaActiva: string;
  filterLabel?: string;
  onZonaChange: (zona: string) => void;
}

const ZONAS = ["Todas", ...REGIONES];

// Chips de región en todos los anchos: en teléfonos se desplazan en una sola fila.
export default function FiltroZonas({ zonaActiva, onZonaChange, filterLabel = "Filtrar provincias por región" }: FiltroZonasProps) {
  return (
    <div role="group" aria-label={filterLabel} className="fila-desplazable -mx-4 px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {ZONAS.map((zona) => (
        <button
          key={zona}
          type="button"
          onClick={() => onZonaChange(zona)}
          aria-pressed={zonaActiva === zona}
          className={chip(zonaActiva === zona)}
        >
          {zona}
        </button>
      ))}
    </div>
  );
}
