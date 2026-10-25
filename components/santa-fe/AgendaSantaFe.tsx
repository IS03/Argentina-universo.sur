import type { Evento } from "@/lib/data";
import EventosSection from "./EventosSection";

// Archivo de eventos pasados o sin vigencia calculada: plegado, con el mismo estilo en Vercel y en el
// export estático (scripts/pr10/overrides/StaticAgenda.tsx.template lo reutiliza).
export function ArchivoEventos({ eventos, resumen, titulo }: { eventos: Evento[]; resumen: string; titulo: string }) {
  return (
    <details className="group mt-10 rounded-tarjeta border border-arena-300/80 bg-white shadow-tarjeta">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 font-semibold text-tinta-900 [&::-webkit-details-marker]:hidden">
        {resumen}
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0 text-tinta-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="border-t border-arena-300/70 px-5 pt-6">
        <EventosSection eventos={eventos} titulo={titulo} id="eventos-anteriores" />
      </div>
    </details>
  );
}

// Agenda de Vercel: la vigencia ya se calculó en el servidor (getAgendaSantaFe).
export default function AgendaSantaFe({ vigentes, anteriores }: { vigentes: Evento[]; anteriores: Evento[] }) {
  return (
    <>
      <EventosSection eventos={vigentes} />
      {anteriores.length > 0 && (
        <ArchivoEventos eventos={anteriores} resumen={`Eventos anteriores (${anteriores.length})`} titulo="Eventos anteriores" />
      )}
    </>
  );
}
