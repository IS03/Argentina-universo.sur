"use client";

import { useState, useMemo } from 'react';
import { Agencia } from "@/lib/data";

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
    <section id="agencias" className="mb-16 scroll-mt-32">
      <h2 className="text-3xl md:text-4xl font-semibold uppercase tracking-widest mb-8 text-center text-[#5A4E3D]">
        Agencias de Viajes
      </h2>

      {/* Filtro por ciudad */}
      <div className="mb-8 flex justify-center">
        <div className="bg-[#E8DDD0]/80 backdrop-blur-sm border border-[#C9B99B]/50 rounded-lg p-4 w-full max-w-2xl hover:border-[#A68B5B]/70 transition-all duration-300">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setCiudadFiltro("todas")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                ciudadFiltro === "todas"
                  ? "bg-[#A68B5B] text-white shadow-md"
                  : "bg-[#F5F1E8] text-[#5A4E3D] hover:bg-[#E8DDD0] border border-[#C9B99B]/50"
              }`}
            >
              Todas
            </button>
            {ciudades.map((ciudad) => (
              <button
                key={ciudad}
                onClick={() => setCiudadFiltro(ciudad)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  ciudadFiltro === ciudad
                    ? "bg-[#A68B5B] text-white shadow-md"
                    : "bg-[#F5F1E8] text-[#5A4E3D] hover:bg-[#E8DDD0] border border-[#C9B99B]/50"
                }`}
              >
                {ciudad}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de agencias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agenciasFiltradas.map((agencia, index) => {
          const telefonoLink = getTelefonoLink(agencia["Teléfono/Celular"]);

          return (
            <div
              key={index}
              className="group bg-gradient-to-br from-[#E8DDD0] to-[#D4C4B0] hover:from-[#D4C4B0] hover:to-[#C9B99B] border border-[#C9B99B]/50 hover:border-[#A68B5B]/70 rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            >
              {/* Badge de ciudad */}
              <div className="mb-3">
                <span className="inline-block text-xs uppercase tracking-wide px-3 py-1 bg-[#A68B5B]/20 text-[#5A4E3D] rounded-full border border-[#A68B5B]/30">
                  {agencia.Ciudad}
                </span>
              </div>

              {/* Nombre de la agencia */}
              <h3 className="text-xl font-semibold mb-4 text-[#5A4E3D] group-hover:text-[#8B7355] transition-colors duration-300">
                {agencia.Agencia}
              </h3>

              {/* Información de contacto */}
              <div className="space-y-3 text-[#6B5D47] text-sm">
                {/* Teléfono */}
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-[#A68B5B] flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="break-words">{agencia["Teléfono/Celular"]}</p>
                    {telefonoLink && (
                      <a
                        href={telefonoLink}
                        className="text-[#A68B5B] hover:text-[#8B7355] text-xs underline mt-1 inline-block"
                      >
                        Llamar
                      </a>
                    )}
                  </div>
                </div>

                {/* Email */}
                {agencia["Correo electrónico"] && (
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-[#A68B5B] flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <a
                      href={`mailto:${agencia["Correo electrónico"]}`}
                      className="text-[#A68B5B] hover:text-[#8B7355] break-words underline"
                    >
                      {agencia["Correo electrónico"]}
                    </a>
                  </div>
                )}

                {/* Contacto */}
                {agencia.Contacto && (
                  <div className="flex items-start gap-2 pt-2 border-t border-[#C9B99B]/30">
                    <svg
                      className="w-5 h-5 text-[#A68B5B] flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <p className="break-words">
                      <span className="font-medium">Contacto:</span> {agencia.Contacto}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {agenciasFiltradas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#8B7355] text-lg">No se encontraron agencias para la ciudad seleccionada.</p>
        </div>
      )}
    </section>
  );
}
