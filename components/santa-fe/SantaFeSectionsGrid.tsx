import Link from "next/link";
import {
  PlanSantaFe,
  NoticiaSantaFe,
  OficinaInforme,
  Agencia,
  Evento
} from "@/lib/data";
import Icono from "@/components/ui/Icono";
import { SECCIONES_SANTA_FE } from "./secciones";

interface SantaFeSectionsGridProps {
  planes: PlanSantaFe[];
  eventos: Evento[];
  oficinas: OficinaInforme[];
  agencias: Agencia[];
  noticias: NoticiaSantaFe[];
}

// Vista previa de cada subsección de Santa Fe: hasta tres elementos y el total. Las preguntas
// frecuentes no van acá: se muestran completas en la misma página.
export default function SantaFeSectionsGrid({
  planes,
  eventos,
  oficinas,
  agencias,
  noticias
}: SantaFeSectionsGridProps) {
  const contenido: Record<string, { titulo: string; items: string[]; vacio?: string }> = {
    planes: { titulo: "Planes e ideas", items: planes.map(p => p.Title) },
    eventos: { titulo: "Próximos eventos y en curso", items: eventos.map(e => e.Título), vacio: "No hay próximos eventos confirmados. Consultá el archivo de eventos anteriores." },
    oficinas: { titulo: "Oficinas de información", items: oficinas.map(o => o.Localidad) },
    agencias: { titulo: "Agencias de viajes", items: agencias.map(a => a.Agencia) },
    noticias: { titulo: "Noticias", items: noticias.map(n => n.Title) },
  };
  const secciones = SECCIONES_SANTA_FE.filter(s => s.id in contenido);

  return (
    <section aria-labelledby="santa-fe-secciones-titulo">
      <p className="antetitulo text-region-litoral">Para planificar</p>
      <h2 id="santa-fe-secciones-titulo" className="mt-1 font-display text-seccion text-tinta-900">
        Descubrí todo sobre Santa Fe
      </h2>
      <p className="mt-2 max-w-2xl text-tinta-700">
        Explorá nuestras secciones y encontrá toda la información que necesitás para planificar tu viaje.
      </p>

      <ul className="mt-6 grid list-none gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {secciones.map((seccion) => {
          const datos = contenido[seccion.id];
                    return (
            <li key={seccion.id}>
              <Link
                href={seccion.href}
                aria-label={`${datos.titulo}: ver todos`}
                className="group flex h-full flex-col rounded-tarjeta border border-arena-300/80 bg-white p-5 shadow-tarjeta transition-[border-color,box-shadow] duration-300 hover:border-lago-600/50 hover:shadow-elevada"
              >
                <span className="flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-region-litoral/10 text-region-litoral">
                    <Icono nombre={seccion.icono} className="size-5" />
                  </span>
                  <span>
                    <span className="block font-semibold text-tinta-900 group-hover:text-lago-700">{datos.titulo}</span>
                    <span className="block text-sm text-tinta-500">{datos.items.length} {datos.items.length === 1 ? "elemento" : "elementos"}</span>
                  </span>
                </span>
                <span className="mt-4 flex-1 space-y-1.5 text-sm text-tinta-700">
                  {datos.items.length === 0 && datos.vacio && <span className="block">{datos.vacio}</span>}
                  {datos.items.slice(0, 3).map((item, index) => (
                    <span key={index} className="flex items-start gap-2">
                      <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-region-litoral" />
                      <span className="line-clamp-1">{item}</span>
                    </span>
                  ))}
                  {datos.items.length > 3 && (
                    <span className="block text-xs font-medium text-tinta-500">y {datos.items.length - 3} más</span>
                  )}
                </span>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-lago-600">
                  Ver todos <Icono nombre="flecha" className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
