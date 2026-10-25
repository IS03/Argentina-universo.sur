"use client";

import { useState, useMemo } from 'react';
import { Evento } from "@/lib/data";
import { EVENT_TIME_ZONE, parseEventDate } from "@/lib/events";
import Icono from "@/components/ui/Icono";
import { EstadoVacio } from "@/components/ui/Bloques";

interface EventosSectionProps {
  eventos: Evento[];
  titulo?: string;
  id?: string;
  // Mensaje cuando no hay eventos. El export estático lo usa mientras calcula la vigencia, con el
  // mismo bloque que el mensaje final para que el contenido no salte (CLS).
  vacio?: { titulo: string; detalle: string };
}

const VACIO = {
  titulo: "No hay próximos eventos confirmados por el momento.",
  detalle: "Revisá el archivo de eventos anteriores o volvé a consultar más adelante.",
};

export default function EventosSection({ eventos, titulo = "Próximos eventos y en curso", id = "eventos", vacio = VACIO }: EventosSectionProps) {
  const [vista, setVista] = useState<'lista' | 'calendario'>('lista');

  // Agrupar eventos por mes
  const eventosPorMes = useMemo(() => {
    const agrupados: Record<string, Evento[]> = {};
    
    eventos.forEach(evento => {
      const fecha = parseEventDate(evento.Inicio);
      const mes = fecha.toLocaleString('es-AR', { month: 'long', year: 'numeric', timeZone: EVENT_TIME_ZONE });
      if (!agrupados[mes]) {
        agrupados[mes] = [];
      }
      agrupados[mes].push(evento);
    });

    // Ordenar eventos dentro de cada mes por fecha
    Object.keys(agrupados).forEach(mes => {
      agrupados[mes].sort((a, b) => 
        parseEventDate(a.Inicio).getTime() - parseEventDate(b.Inicio).getTime()
      );
    });

    return agrupados;
  }, [eventos]);

  const meses = Object.keys(eventosPorMes).sort((a, b) => {
    const fechaA = parseEventDate(eventosPorMes[a][0].Inicio);
    const fechaB = parseEventDate(eventosPorMes[b][0].Inicio);
    return fechaA.getTime() - fechaB.getTime();
  });

  const formatFecha = (fechaStr: string) => {
    const fecha = parseEventDate(fechaStr);
    return {
      dia: fecha.toLocaleString('es-AR', { day: 'numeric', timeZone: EVENT_TIME_ZONE }),
      mes: fecha.toLocaleString('es-AR', { month: 'short', timeZone: EVENT_TIME_ZONE }),
      fechaCompleta: fecha.toLocaleDateString('es-AR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', timeZone: EVENT_TIME_ZONE
      }),
      hora: fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: EVENT_TIME_ZONE })
    };
  };

  // Etiqueta de precio en texto (no solo color): «Gratis», «Consultar» o el precio publicado.
  const getPrecioBadge = (precio: string) => {
    if (precio.toLowerCase().includes('gratis') || precio.toLowerCase().includes('gratuita')) {
      return { texto: 'Gratis', clase: 'border-region-litoral/40 bg-region-litoral/10 text-region-litoral' };
    }
    if (precio.toLowerCase().includes('consultar')) {
      return { texto: 'Consultar', clase: 'border-lago-600/30 bg-lago-100 text-lago-700' };
    }
    return { texto: precio, clase: 'border-arena-400/60 bg-arena-100 text-tinta-900' };
  };

  const VISTAS = [{ id: 'lista', etiqueta: 'Lista' }, { id: 'calendario', etiqueta: 'Calendario' }] as const;

  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="mb-4">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 id={`${id}-titulo`} className="font-display text-seccion text-tinta-900">
          {titulo}
        </h2>
        {eventos.length > 0 && (
          <div role="group" aria-label="Vista de los eventos" className="inline-flex self-start rounded-full border border-arena-400 bg-white p-1">
            {VISTAS.map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVista(v.id)}
                aria-pressed={vista === v.id}
                className={`min-h-10 rounded-full px-4 text-sm font-semibold transition-colors ${vista === v.id ? 'bg-tinta-900 text-white' : 'text-tinta-700 hover:text-lago-700'}`}
              >
                {v.etiqueta}
              </button>
            ))}
          </div>
        )}
      </div>

      {eventos.length === 0 ? (
        <EstadoVacio titulo={vacio.titulo}>{vacio.detalle}</EstadoVacio>
      ) : (
        <div className="space-y-10">
          {meses.map((mes) => (
            <div key={mes}>
              <h3 className="mb-4 border-b border-arena-300/80 pb-2 text-xl font-semibold capitalize text-tinta-900">
                {mes}
              </h3>
              <ul className={`grid list-none gap-4 ${vista === 'lista' ? 'md:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                {eventosPorMes[mes].map((evento, index) => {
                  const fecha = formatFecha(evento.Inicio);
                  const precioBadge = getPrecioBadge(evento.Precio);
                  const lugar = evento.Lugar && evento.Lugar !== "No especificado" ? evento.Lugar : null;
                  return (
                    <li key={index} className="flex h-full gap-4 rounded-tarjeta border border-arena-300/80 bg-white p-4 shadow-tarjeta">
                      {/* Fecha destacada */}
                      <div className="flex w-16 shrink-0 flex-col items-center justify-center self-start rounded-control bg-region-litoral py-2 text-white">
                        <span className="text-2xl font-semibold leading-none">{fecha.dia}</span>
                        <span className="mt-1 text-xs uppercase">{fecha.mes}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold leading-snug text-tinta-900">{evento.Título}</h4>
                        <p className="mt-1 text-xs text-tinta-500">
                          {fecha.fechaCompleta}{fecha.hora && <> · {fecha.hora}</>}
                        </p>
                        {lugar && (
                          <p className="mt-2 flex items-start gap-1.5 text-sm text-tinta-700">
                            <Icono nombre="pin" className="mt-0.5 size-4 text-region-litoral" />
                            <span className={vista === 'lista' ? '' : 'line-clamp-2'}>{lugar}</span>
                          </p>
                        )}
                        {vista === 'lista' && (
                          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-tinta-700">{evento.Descripción}</p>
                        )}
                        <span className={`mt-3 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${precioBadge.clase}`}>
                          {precioBadge.texto}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
