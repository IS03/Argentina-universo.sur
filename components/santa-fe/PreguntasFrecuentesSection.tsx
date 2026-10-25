import { PreguntaFrecuente } from "@/lib/data";

interface PreguntasFrecuentesSectionProps {
  preguntas: PreguntaFrecuente[];
}

// <details> nativo: abre y cierra sin JavaScript, con teclado y lector de pantalla, y las respuestas
// están en el HTML inicial.
export default function PreguntasFrecuentesSection({ preguntas }: PreguntasFrecuentesSectionProps) {
  return (
    <section id="preguntas-frecuentes" aria-labelledby="preguntas-frecuentes-titulo">
      <p className="antetitulo text-region-litoral">Antes de viajar</p>
      <h2 id="preguntas-frecuentes-titulo" className="mt-1 mb-6 font-display text-seccion text-tinta-900">
        Preguntas frecuentes
      </h2>
      <div className="max-w-3xl divide-y divide-arena-300/80 rounded-tarjeta border border-arena-300/80 bg-white shadow-tarjeta">
        {preguntas.map((pregunta, index) => (
          <details key={index} className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-semibold text-tinta-900 hover:text-lago-700 [&::-webkit-details-marker]:hidden">
              {pregunta.Pregunta}
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0 text-lago-600 transition-transform group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </summary>
            <p className="px-5 pb-5 leading-relaxed whitespace-pre-line text-tinta-700">{pregunta.Respuesta}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
