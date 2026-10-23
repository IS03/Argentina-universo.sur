"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import ActividadCard from "@/components/ActividadCard";
import { filtrarActividades, resolveProvinciaSlug, TODAS_LAS_PROVINCIAS } from "@/lib/catalog";
import type { ActividadResumen, Provincia } from "@/lib/catalog";

export type ProvinciaOpcion = Pick<Provincia, "provincia" | "slug">;

interface ActividadesListadoProps {
  actividades: ActividadResumen[];
  provincias: ProvinciaOpcion[];
  seleccion: string;
  onSeleccion?: (provincia: string) => void;
}

// Filtro y grilla. Sin onSeleccion es la versión que el servidor escribe en el HTML estático
// (todas las actividades) mientras el navegador todavía no conoce el parámetro ?provincia.
export function ActividadesListado({ actividades, provincias, seleccion, onSeleccion }: ActividadesListadoProps) {
  const actividadesFiltradas = filtrarActividades(actividades, seleccion);
  const control = onSeleccion
    ? { value: seleccion, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onSeleccion(e.target.value) }
    : { defaultValue: seleccion };

  return (
    <>
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
              {...control}
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

// Lee ?provincia (incluido el alias histórico catarmaca) y filtra en memoria, sin pedir datos.
// La URL se actualiza con replaceState: el filtro se puede compartir y recargar sin navegar.
export default function ActividadesExplorer({ actividades, provincias }: Omit<ActividadesListadoProps, "seleccion" | "onSeleccion">) {
  const searchParams = useSearchParams();
  const provinciaUrl = resolveProvinciaSlug(searchParams.get("provincia") || TODAS_LAS_PROVINCIAS);
  const [seleccion, setSeleccion] = useState(provinciaUrl);
  const [provinciaUrlPrevia, setProvinciaUrlPrevia] = useState(provinciaUrl);
  if (provinciaUrl !== provinciaUrlPrevia) {
    // Navegación atrás/adelante o un enlace interno con otro filtro.
    setProvinciaUrlPrevia(provinciaUrl);
    setSeleccion(provinciaUrl);
  }

  const seleccionar = (provincia: string) => {
    setSeleccion(provincia);
    setProvinciaUrlPrevia(provincia);
    const params = new URLSearchParams(searchParams.toString());
    if (provincia === TODAS_LAS_PROVINCIAS) params.delete("provincia");
    else params.set("provincia", provincia);
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  };

  return <ActividadesListado actividades={actividades} provincias={provincias} seleccion={seleccion} onSeleccion={seleccionar} />;
}
