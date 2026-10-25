"use client";

import { useState, useMemo } from 'react';
import { Agencia } from "@/lib/data";
import Icono from "@/components/ui/Icono";
import { EstadoVacio } from "@/components/ui/Bloques";
import { boton, chip } from "@/components/ui/estilos";

interface AgenciasSectionProps {
  agencias: Agencia[];
}

export default function AgenciasSection({ agencias }: AgenciasSectionProps) {
  const [ciudadFiltro, setCiudadFiltro] = useState<string>("todas");

  // Obtener ciudades únicas
  const ciudades = useMemo(() => {
    const ciudadesUnicas = Array.from(new Set(agencias.map(a => a.Ciudad)));
    return ciudadesUnicas.sort();
  }, [agencias]);

  // Filtrar agencias
  const agenciasFiltradas = useMemo(() => {
    if (ciudadFiltro === "todas") {
      return agencias;
    }
    return agencias.filter(a => a.Ciudad === ciudadFiltro);
  }, [agencias, ciudadFiltro]);

  const getTelefonoLink = (telefono: string) => {
    const numero = telefono.replace(/[\s\-]/g, '');
    return `tel:${numero}`;
  };

  return (
    <section id="agencias" aria-labelledby="agencias-titulo">
      <h2 id="agencias-titulo" className="sr-only">Agencias de Viajes</h2>

      {/* Filtro por ciudad: chips en una fila desplazable en teléfonos. */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div role="group" aria-label="Filtrar agencias por ciudad" className="fila-desplazable -mx-4 px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {[{ valor: "todas", etiqueta: "Todas" }, ...ciudades.map(c => ({ valor: c, etiqueta: c }))].map(opcion => (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => setCiudadFiltro(opcion.valor)}
              aria-pressed={ciudadFiltro === opcion.valor}
              className={chip(ciudadFiltro === opcion.valor)}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="shrink-0 text-sm font-medium text-tinta-700">
          {agenciasFiltradas.length} {agenciasFiltradas.length === 1 ? "agencia" : "agencias"}
        </p>
      </div>

      {agenciasFiltradas.length > 0 ? (
        <ul className="grid list-none gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {agenciasFiltradas.map((agencia, index) => (
            <li key={index}>
              <article className="flex h-full flex-col rounded-tarjeta border border-arena-300/80 bg-white p-5 shadow-tarjeta">
                <p className="antetitulo text-region-litoral">{agencia.Ciudad}</p>
                <h3 className="mt-1 text-lg font-semibold leading-snug text-tinta-900">{agencia.Agencia}</h3>

                <dl className="mt-3 flex-1 space-y-2.5 text-sm text-tinta-700">
                  <div className="flex items-start gap-2">
                    <dt><Icono nombre="telefono" className="mt-0.5 size-4 text-tinta-500" /><span className="sr-only">Teléfono</span></dt>
                    <dd className="break-words">{agencia["Teléfono/Celular"]}</dd>
                  </div>
                  {agencia["Correo electrónico"] && (
                    <div className="flex items-start gap-2">
                      <dt><Icono nombre="correo" className="mt-0.5 size-4 text-tinta-500" /><span className="sr-only">Correo</span></dt>
                      <dd className="min-w-0">
                        <a href={`mailto:${agencia["Correo electrónico"]}`} className="inline-block break-words py-1 text-lago-600 underline underline-offset-2">
                          {agencia["Correo electrónico"]}
                        </a>
                      </dd>
                    </div>
                  )}
                  {agencia.Contacto && (
                    <div className="flex items-start gap-2 border-t border-arena-300/70 pt-2.5">
                      <dt><Icono nombre="persona" className="mt-0.5 size-4 text-tinta-500" /><span className="sr-only">Contacto</span></dt>
                      <dd className="break-words">{agencia.Contacto}</dd>
                    </div>
                  )}
                </dl>

                <a href={getTelefonoLink(agencia["Teléfono/Celular"])} aria-label={`Llamar a ${agencia.Agencia}`} className={boton("secundario", "mt-4 self-start")}>
                  <Icono nombre="telefono" className="size-4" />
                  Llamar
                </a>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <EstadoVacio titulo="No se encontraron agencias para la ciudad seleccionada." />
      )}
    </section>
  );
}
