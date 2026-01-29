"use client";

import { useState, useMemo } from 'react';
import { Evento } from "@/lib/data";

interface EventosSectionProps {
  eventos: Evento[];
}

export default function EventosSection({ eventos }: EventosSectionProps) {
  const [vista, setVista] = useState<'lista' | 'calendario'>('lista');

  // Agrupar eventos por mes
  const eventosPorMes = useMemo(() => {
    const agrupados: Record<string, Evento[]> = {};
    
    eventos.forEach(evento => {
      const fecha = new Date(evento.Inicio);
      const mes = fecha.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
      if (!agrupados[mes]) {
        agrupados[mes] = [];
      }
      agrupados[mes].push(evento);
    });

    // Ordenar eventos dentro de cada mes por fecha
    Object.keys(agrupados).forEach(mes => {
      agrupados[mes].sort((a, b) => 
        new Date(a.Inicio).getTime() - new Date(b.Inicio).getTime()
      );
    });

    return agrupados;
  }, [eventos]);

  const meses = Object.keys(eventosPorMes).sort((a, b) => {
    const fechaA = new Date(eventosPorMes[a][0].Inicio);
    const fechaB = new Date(eventosPorMes[b][0].Inicio);
    return fechaA.getTime() - fechaB.getTime();
  });

  const formatFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return {
      dia: fecha.getDate(),
      mes: fecha.toLocaleString('es-AR', { month: 'short' }),
      fechaCompleta: fecha.toLocaleDateString('es-AR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      hora: fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getPrecioBadge = (precio: string) => {
    if (precio.toLowerCase().includes('gratis') || precio.toLowerCase().includes('gratuita')) {
      return { texto: 'Gratis', clase: 'bg-green-500/20 text-green-700 border-green-500/30' };
    }
    if (precio.toLowerCase().includes('consultar')) {
      return { texto: 'Consultar', clase: 'bg-blue-500/20 text-blue-700 border-blue-500/30' };
    }
    if (precio.includes('$')) {
      return { texto: precio, clase: 'bg-[#A68B5B]/20 text-[#5A4E3D] border-[#A68B5B]/30' };
    }
    return { texto: precio, clase: 'bg-gray-500/20 text-gray-700 border-gray-500/30' };
  };

  return (
    <section id="eventos" className="mb-16 scroll-mt-32">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-3xl md:text-4xl font-semibold uppercase tracking-widest text-center text-[#5A4E3D]">
          Calendario de Eventos
        </h2>
        <div className="flex gap-2 bg-[#E8DDD0]/80 backdrop-blur-sm border border-[#C9B99B]/50 rounded-lg p-1">
          <button
            onClick={() => setVista('lista')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
              vista === 'lista'
                ? 'bg-[#A68B5B] text-white shadow-md'
                : 'text-[#5A4E3D] hover:bg-[#E8DDD0]'
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setVista('calendario')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
              vista === 'calendario'
                ? 'bg-[#A68B5B] text-white shadow-md'
                : 'text-[#5A4E3D] hover:bg-[#E8DDD0]'
            }`}
          >
            Calendario
          </button>
        </div>
      </div>

      {vista === 'lista' ? (
        // Vista de lista
        <div className="space-y-8">
          {meses.map((mes) => (
            <div key={mes}>
              <h3 className="text-2xl font-semibold mb-4 text-[#5A4E3D] capitalize border-b border-[#C9B99B]/50 pb-2">
                {mes}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventosPorMes[mes].map((evento, index) => {
                  const fecha = formatFecha(evento.Inicio);
                  const precioBadge = getPrecioBadge(evento.Precio);

                  return (
                    <div
                      key={index}
                      className="group bg-gradient-to-br from-[#E8DDD0] to-[#D4C4B0] hover:from-[#D4C4B0] hover:to-[#C9B99B] border border-[#C9B99B]/50 hover:border-[#A68B5B]/70 rounded-xl p-5 transition-all duration-300 transform hover:scale-[1.01] shadow-md hover:shadow-lg"
                    >
                      {/* Fecha destacada */}
                      <div className="flex items-start gap-4 mb-3">
                        <div className="flex-shrink-0 text-center bg-[#A68B5B]/20 rounded-lg p-2 min-w-[60px] border border-[#A68B5B]/30">
                          <div className="text-2xl font-bold text-[#5A4E3D]">{fecha.dia}</div>
                          <div className="text-xs uppercase text-[#6B5D47]">{fecha.mes}</div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-[#5A4E3D] mb-1 group-hover:text-[#8B7355] transition-colors duration-300">
                            {evento.Título}
                          </h4>
                          <p className="text-xs text-[#6B5D47]">{fecha.fechaCompleta}</p>
                        </div>
                      </div>

                      {/* Lugar */}
                      {evento.Lugar && evento.Lugar !== "No especificado" && (
                        <div className="flex items-start gap-2 mb-3 text-sm text-[#6B5D47]">
                          <svg
                            className="w-4 h-4 text-[#A68B5B] flex-shrink-0 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span className="line-clamp-1">{evento.Lugar}</span>
                        </div>
                      )}

                      {/* Descripción */}
                      <p className="text-sm text-[#6B5D47] mb-3 line-clamp-2 leading-relaxed">
                        {evento.Descripción}
                      </p>

                      {/* Precio */}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full border ${precioBadge.clase}`}>
                          {precioBadge.texto}
                        </span>
                        {fecha.hora && (
                          <span className="text-xs text-[#6B5D47]">
                            {fecha.hora}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Vista de calendario (simplificada - grid por días)
        <div className="space-y-8">
          {meses.map((mes) => (
            <div key={mes}>
              <h3 className="text-2xl font-semibold mb-4 text-[#5A4E3D] capitalize border-b border-[#C9B99B]/50 pb-2">
                {mes}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {eventosPorMes[mes].map((evento, index) => {
                  const fecha = formatFecha(evento.Inicio);
                  const precioBadge = getPrecioBadge(evento.Precio);

                  return (
                    <div
                      key={index}
                      className="group bg-gradient-to-br from-[#E8DDD0] to-[#D4C4B0] hover:from-[#D4C4B0] hover:to-[#C9B99B] border border-[#C9B99B]/50 hover:border-[#A68B5B]/70 rounded-lg p-4 transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-lg"
                    >
                      <div className="text-center mb-2">
                        <div className="text-3xl font-bold text-[#5A4E3D]">{fecha.dia}</div>
                        <div className="text-xs uppercase text-[#6B5D47]">{fecha.mes}</div>
                      </div>
                      <h4 className="text-sm font-semibold text-[#5A4E3D] mb-2 line-clamp-2 group-hover:text-[#8B7355] transition-colors duration-300">
                        {evento.Título}
                      </h4>
                      <p className="text-xs text-[#6B5D47] mb-2 line-clamp-2">
                        {evento.Lugar && evento.Lugar !== "No especificado" ? evento.Lugar : ''}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full border inline-block ${precioBadge.clase}`}>
                        {precioBadge.texto}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
