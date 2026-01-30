"use client";

import { useState, useMemo } from "react";
import { Escapada } from "@/lib/data";
import FiltroZonas from "./FiltroZonas";
import Link from "next/link";

interface EscapadasContentProps {
  escapadas: Escapada[];
}

export default function EscapadasContent({ escapadas }: EscapadasContentProps) {
  const [zonaActiva, setZonaActiva] = useState<string>("Todas");

  const escapadasFiltradas = useMemo(() => {
    if (zonaActiva === "Todas") {
      return escapadas;
    }
    return escapadas.filter((e) => e.zona === zonaActiva);
  }, [escapadas, zonaActiva]);

  return (
    <div className="w-full">
      {/* Filtros por zona */}
      <FiltroZonas zonaActiva={zonaActiva} onZonaChange={setZonaActiva} />

      {/* Listado de escapadas filtradas */}
      <section aria-labelledby="guias-escapadas-heading">
        <h2 id="guias-escapadas-heading" className="text-2xl font-semibold uppercase tracking-widest mb-6 text-[#5A4E3D]">
          Guías de escapadas en PDF
        </h2>
      <div className="space-y-6">
        {escapadasFiltradas.map((escapada) => (
          <article
            key={escapada.id}
            className="bg-[#E8DDD0] border border-[#C9B99B]/50 rounded-lg p-6 hover:border-[#A68B5B] hover:bg-[#F5F1E8] transition-all duration-300"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-2 text-[#5A4E3D]">
                  {escapada.titulo}
                </h3>
                <div className="flex flex-wrap gap-4 text-sm text-[#6B5D47]">
                  <span>
                    <span className="uppercase tracking-wider">Provincia:</span>{" "}
                    {escapada.provincias}
                  </span>
                  <span>
                    <span className="uppercase tracking-wider">Duración:</span>{" "}
                    {escapada.duracion}
                  </span>
                </div>
              </div>
              <div>
                <Link
                  href={escapada.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-[#A68B5B]/20 hover:bg-[#A68B5B]/30 backdrop-blur-sm text-[#5A4E3D] uppercase tracking-widest text-sm transition-all duration-300 border border-[#C9B99B]/50 hover:border-[#A68B5B] whitespace-nowrap"
                >
                  Ver PDF
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      </section>

      {/* Mensaje si no hay escapadas */}
      {escapadasFiltradas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#6B5D47] text-lg">
            No se encontraron escapadas para la zona seleccionada.
          </p>
        </div>
      )}
    </div>
  );
}
