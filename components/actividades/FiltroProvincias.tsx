"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { TODAS_LAS_PROVINCIAS, type Provincia } from "@/lib/catalog";
import { chip } from "@/components/ui/estilos";

export type ProvinciaOpcion = Pick<Provincia, "provincia" | "slug">;

interface FiltroProvinciasProps {
  provincias: ProvinciaOpcion[];
  seleccion: string;
  cantidad: number;
  // URL de cada filtro: los chips son enlaces reales y funcionan sin JavaScript.
  hrefDe: (slug: string) => string;
  // Con JavaScript, cada variante decide cómo filtrar (en memoria o navegando).
  onElegir: (slug: string) => void;
  // Solo en la variante en memoria: el chip filtra sin navegar una vez hidratado.
  interceptarChips?: boolean;
  selectRef?: React.Ref<HTMLSelectElement>;
  hidratado: boolean;
}

// Presentación compartida por el filtro de Vercel (components/actividades/ActividadesExplorer)
// y el del export estático (components/pages/ActivitiesExplorer). Conserva #provincia-filtro.
export default function FiltroProvincias({ provincias, seleccion, cantidad, hrefDe, onElegir, interceptarChips = false, selectRef, hidratado }: FiltroProvinciasProps) {
  const filaRef = useRef<HTMLUListElement>(null);
  // En teléfonos la fila de chips se desplaza: el chip elegido se centra para que siempre se vea.
  useEffect(() => {
    const fila = filaRef.current;
    const activo = fila?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!fila || !activo || fila.scrollWidth <= fila.clientWidth) return;
    fila.scrollLeft = activo.offsetLeft - (fila.clientWidth - activo.offsetWidth) / 2;
  }, [seleccion]);
  const nombre = provincias.find(p => p.slug === seleccion)?.provincia;
  const resumen = seleccion === TODAS_LAS_PROVINCIAS
    ? `${cantidad} actividades en todo el país`
    : nombre ? `${cantidad} ${cantidad === 1 ? "actividad" : "actividades"} en ${nombre}` : "Sin resultados para esa provincia";
  const alTocarChip = (slug: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!interceptarChips || !hidratado || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    onElegir(slug);
  };

  return (
    <div className="rounded-tarjeta border border-arena-300/80 bg-white p-4 shadow-tarjeta sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <label htmlFor="provincia-filtro" className="mb-2 block text-sm font-semibold text-tinta-900">
            Filtrar por provincia
          </label>
          <div className="relative">
            <select
              id="provincia-filtro"
              ref={selectRef}
              value={seleccion}
              onChange={(e) => onElegir(e.target.value)}
              data-hidratado={hidratado ? "" : undefined}
              className="min-h-12 w-full cursor-pointer appearance-none rounded-control border border-arena-400 bg-arena-50 py-3 pr-11 pl-4 text-base text-tinta-900 transition-colors hover:border-lago-600"
            >
              <option value={TODAS_LAS_PROVINCIAS}>Todas las provincias</option>
              {provincias.map((provincia) => (
                <option key={provincia.slug} value={provincia.slug}>
                  {provincia.provincia}
                </option>
              ))}
            </select>
            <svg aria-hidden="true" viewBox="0 0 12 12" className="pointer-events-none absolute top-1/2 right-4 size-3 -translate-y-1/2 fill-tinta-700">
              <path d="M6 9 1 4h10z" />
            </svg>
          </div>
        </div>
        <p aria-live="polite" className="text-sm font-medium text-tinta-700 sm:pb-3">{resumen}</p>
      </div>

      <nav aria-label="Actividades por provincia" className="mt-5 border-t border-arena-300/70 pt-4">
        <ul ref={filaRef} className="fila-desplazable relative -mx-4 list-none px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0">
          {[{ slug: TODAS_LAS_PROVINCIAS, provincia: "Todas" }, ...provincias].map(p => {
            const actual = p.slug === seleccion;
            return (
              <li key={p.slug}>
                <Link
                  href={hrefDe(p.slug)}
                  prefetch={false}
                  scroll={false}
                  onClick={alTocarChip(p.slug)}
                  aria-current={actual ? "page" : undefined}
                  className={chip(actual)}
                >
                  {p.provincia}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <noscript>
        <p className="mt-3 text-sm text-tinta-700">Elegí una provincia mediante los enlaces. Las páginas de cada provincia funcionan sin JavaScript.</p>
      </noscript>
    </div>
  );
}
