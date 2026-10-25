"use client";

import { useState, useMemo } from "react";
import { Escapada } from "@/lib/data";
import { regionVisual } from "@/lib/regiones";
import FiltroZonas from "./FiltroZonas";
import Icono from "@/components/ui/Icono";
import { EstadoVacio } from "@/components/ui/Bloques";
import { boton } from "@/components/ui/estilos";

interface EscapadasContentProps {
  escapadas: Escapada[];
}

const formatoMB = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });
const pesoLegible = (bytes: number) => `${formatoMB.format(bytes / 1_000_000)} MB`;

export default function EscapadasContent({ escapadas }: EscapadasContentProps) {
  const [zonaActiva, setZonaActiva] = useState<string>("Todas");

  const escapadasFiltradas = useMemo(() => {
    if (zonaActiva === "Todas") {
      return escapadas;
    }
    return escapadas.filter((e) => e.zona === zonaActiva);
  }, [escapadas, zonaActiva]);

  return (
    <section aria-labelledby="guias-escapadas-heading">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="antetitulo text-terracota-600">Catálogo actual</p>
          <h2 id="guias-escapadas-heading" className="mt-1 font-display text-seccion text-tinta-900">
            Guías de escapadas en PDF
          </h2>
        </div>
        <p aria-live="polite" className="text-sm font-medium text-tinta-700">
          {escapadasFiltradas.length} {escapadasFiltradas.length === 1 ? "guía" : "guías"}{zonaActiva === "Todas" ? "" : ` en ${zonaActiva}`}
        </p>
      </div>

      <FiltroZonas filterLabel="Filtrar escapadas por región" zonaActiva={zonaActiva} onZonaChange={setZonaActiva} />

      {escapadasFiltradas.length > 0 ? (
        <ul className="mt-6 grid list-none gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
          {escapadasFiltradas.map((escapada) => {
            const region = regionVisual(escapada.zona);
            const detalle = `escapada-${escapada.id}-pdf`;
            return (
              <li key={escapada.id}>
                {/* Banda de región a la izquierda y PDF en una sola fila: unos 180 px por guía en teléfonos. */}
                <article className="flex h-full overflow-hidden rounded-tarjeta border border-arena-300/80 bg-white shadow-tarjeta">
                  <div aria-hidden="true" className={`w-1.5 shrink-0 ${region?.fondo ?? "bg-arena-400"}`} />
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <p className={`antetitulo ${region?.texto ?? "text-terracota-600"}`}>{escapada.zona}</p>
                    <h3 className="mt-1 font-display text-2xl leading-tight text-tinta-900 sm:text-[1.75rem]">{escapada.titulo}</h3>
                    <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-tinta-700">
                      <div className="flex items-center gap-1.5">
                        <dt><Icono nombre="pin" className="size-4 text-tinta-500" /><span className="sr-only">Provincia</span></dt>
                        <dd>{escapada.provincias}</dd>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <dt><Icono nombre="reloj" className="size-4 text-tinta-500" /><span className="sr-only">Duración</span></dt>
                        <dd>{escapada.duracion}</dd>
                      </div>
                    </dl>
                    <div className="mt-auto flex items-center gap-3 pt-4">
                      <a
                        href={escapada.pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-describedby={detalle}
                        className={boton("secundario")}
                      >
                        <Icono nombre="documento" className="size-4" />
                        Ver PDF
                      </a>
                      <p className="text-xs text-tinta-500">
                        <span aria-hidden="true">{escapada.pesoBytes ? pesoLegible(escapada.pesoBytes) : "PDF"}</span>
                        <span id={detalle} className="sr-only">
                          {escapada.pesoBytes ? `PDF de ${pesoLegible(escapada.pesoBytes)}` : "Guía en PDF"}, se abre en otra pestaña
                        </span>
                      </p>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-6">
          <EstadoVacio titulo="No se encontraron escapadas para la zona seleccionada.">Probá con otra región o volvé a «Todas».</EstadoVacio>
        </div>
      )}
    </section>
  );
}
