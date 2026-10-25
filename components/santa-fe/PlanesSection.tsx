import { PlanSantaFe } from "@/lib/data";
import Icono from "@/components/ui/Icono";
import { fechaSantaFe, limpiarResumen } from "./formato";

interface PlanesSectionProps {
  planes: PlanSantaFe[];
}

export default function PlanesSection({ planes }: PlanesSectionProps) {
  // Función para obtener las primeras categorías
  const getCategorias = (categories: string) => {
    return categories.split(";").slice(0, 2).map(c => c.trim()).filter(Boolean);
  };

  return (
    <section id="planes" aria-labelledby="planes-titulo">
      <h2 id="planes-titulo" className="sr-only">Planes e Ideas</h2>
      <p className="mb-6 text-sm font-medium text-tinta-700">{planes.length} propuestas para recorrer la provincia</p>
      <ul className="grid list-none gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {planes.map((plan, index) => {
          const categorias = getCategorias(plan.Categories);
          return (
            <li key={index}>
              <article className="flex h-full flex-col rounded-tarjeta border border-arena-300/80 bg-white p-5 shadow-tarjeta">
                {categorias.length > 0 && (
                  <ul className="mb-3 flex list-none flex-wrap gap-1.5" aria-label="Categorías">
                    {categorias.map((cat, i) => (
                      <li key={i} className="rounded-full bg-region-litoral/10 px-2.5 py-0.5 text-xs font-medium text-region-litoral">{cat}</li>
                    ))}
                  </ul>
                )}
                <h3 className="text-lg font-semibold leading-snug text-tinta-900">{plan.Title}</h3>
                <p className="mt-1 text-xs text-tinta-500">
                  <time dateTime={plan.Date}>{fechaSantaFe(plan.Date)}</time>
                </p>
                <p className="mt-3 line-clamp-4 flex-1 text-sm leading-relaxed text-tinta-700">{limpiarResumen(plan.Summary)}</p>
                {plan.Source && (
                  <a
                    href={plan.Source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex min-h-11 items-center gap-1.5 self-start font-semibold text-lago-600 underline decoration-lago-600/40 underline-offset-4 hover:decoration-lago-600"
                  >
                    Ver más
                    <Icono nombre="externo" className="size-4" />
                    <span className="sr-only">(abre en otra pestaña)</span>
                  </a>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
