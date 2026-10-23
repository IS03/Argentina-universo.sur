"use client";

import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import ActividadCard from "@/components/ActividadCard";
import { filtrarActividades, TODAS_LAS_PROVINCIAS } from "@/lib/catalog";
import type { ActividadResumen, Provincia } from "@/lib/catalog";
import { seleccionDesdeParametro } from "@/lib/site-links";

export type ProvinciaOpcion = Pick<Provincia, "provincia" | "slug">;

interface ActividadesExplorerProps {
  actividades: ActividadResumen[];
  provincias: ProvinciaOpcion[];
  // Viene del servidor: el HTML ya llega filtrado (ver ACTIVIDADES_FILTRO_REWRITES).
  seleccionInicial: string;
}

const sinSuscripcion = () => () => {};

// Avisa cuando cambia ?provincia (atrás/adelante restauran el árbol cacheado de otra variante).
// Va en su propio Suspense: useSearchParams no puede prerenderizarse y así no arrastra a la grilla.
function SincronizarUrl({ onCambio }: { onCambio: (provincia: string) => void }) {
  const provincia = seleccionDesdeParametro(useSearchParams().get("provincia"));
  useLayoutEffect(() => onCambio(provincia), [provincia, onCambio]);
  return null;
}

// Filtra en memoria, sin pedir datos. La URL se actualiza con replaceState: el filtro se puede
// compartir y recargar sin navegar.
export default function ActividadesExplorer({ actividades, provincias, seleccionInicial }: ActividadesExplorerProps) {
  const [seleccion, setSeleccion] = useState(seleccionInicial);
  const selectRef = useRef<HTMLSelectElement>(null);
  // false en el HTML y durante la hidratación; true después. Lo usan las pruebas E2E.
  const hidratado = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  // true si este montaje hidrató HTML del servidor; false si React lo creó en el navegador.
  const [vinoDelServidor] = useState(!hidratado);
  const escritasEnUrl = useRef<string[]>([]);
  const reportesUrl = useRef(0);

  const seleccionar = (provincia: string) => {
    setSeleccion(provincia);
    escritasEnUrl.current.push(provincia);
    const params = new URLSearchParams(window.location.search);
    if (provincia === TODAS_LAS_PROVINCIAS) params.delete("provincia");
    else params.set("provincia", provincia);
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  };
  const seleccionarRef = useRef(seleccionar);

  const alCambiarUrl = useCallback((provincia: string) => {
    // Al hidratar, el HTML ya corresponde a la URL: el primer aviso no aporta nada.
    if (reportesUrl.current++ === 0 && vinoDelServidor) return;
    // Eco de un replaceState propio: ya está aplicado (y quizá superado por otro más nuevo).
    const propia = escritasEnUrl.current.indexOf(provincia);
    if (propia !== -1) {
      escritasEnUrl.current.splice(0, propia + 1);
      return;
    }
    setSeleccion(provincia);
  }, [vinoDelServidor]);

  useEffect(() => {
    // Si el usuario cambió el select antes de hidratar, React no reescribe su valor ni repite
    // el evento: la elección queda en el DOM y se adopta aquí. La referencia es la opción que el
    // servidor marcó como seleccionada (o la primera, si el valor inicial no tiene opción).
    const select = selectRef.current;
    if (!vinoDelServidor || !select) return;
    const opciones = [...select.options];
    const valorServidor = (opciones.find(o => o.defaultSelected) ?? opciones[0])?.value;
    if (select.value !== valorServidor) seleccionarRef.current(select.value);
  }, [vinoDelServidor]);

  const actividadesFiltradas = filtrarActividades(actividades, seleccion);

  return (
    <>
      <Suspense fallback={null}>
        <SincronizarUrl onCambio={alCambiarUrl} />
      </Suspense>

      {/* Filtro por provincia */}
      <div className="mb-12 flex justify-center">
        <div className="bg-[#E8DDD0]/80 backdrop-blur-sm border border-[#C9B99B]/50 rounded-lg p-6 w-full max-w-md hover:border-[#A68B5B]/70 hover:bg-[#E8DDD0] transition-all duration-300">
          <label
            htmlFor="provincia-filtro"
            className="block text-sm uppercase tracking-widest text-[#6B5D47] mb-4 text-center font-light"
          >
            Filtrar por provincia
          </label>
          <div className="relative">
            <select
              id="provincia-filtro"
              ref={selectRef}
              value={seleccion}
              onChange={(e) => seleccionar(e.target.value)}
              data-hidratado={hidratado ? "" : undefined}
              className="w-full bg-[#F5F1E8] border border-[#C9B99B]/50 text-[#5A4E3D] px-5 py-3.5 rounded-lg focus:outline-none focus:border-[#A68B5B]/70 focus:ring-2 focus:ring-[#A68B5B]/20 transition-all duration-300 appearance-none cursor-pointer hover:bg-[#FAF8F3] hover:border-[#A68B5B]/70 text-base font-light tracking-wide"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                paddingRight: '2.5rem'
              }}
            >
              <option value={TODAS_LAS_PROVINCIAS} className="bg-[#F5F1E8]">Todas las provincias</option>
              {provincias.map((provincia) => (
                <option key={provincia.slug} value={provincia.slug} className="bg-[#F5F1E8]">
                  {provincia.provincia}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grilla de actividades */}
      <section aria-labelledby="actividades-por-provincia-heading">
        <h2 id="actividades-por-provincia-heading" className="text-2xl md:text-3xl font-semibold uppercase tracking-widest mb-6 text-center text-[#5A4E3D]">
          Actividades por provincia
        </h2>
        {actividadesFiltradas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {actividadesFiltradas.map((actividad) => (
              <ActividadCard key={actividad.actividadSlug} actividad={actividad} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[#8B7355] text-lg">
              No se encontraron actividades para la provincia seleccionada.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
