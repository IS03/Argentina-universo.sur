import { PlanSantaFe } from "@/lib/data";
import Link from "next/link";

interface PlanesSectionProps {
  planes: PlanSantaFe[];
}

export default function PlanesSection({ planes }: PlanesSectionProps) {
  // Función para obtener las primeras categorías
  const getCategorias = (categories: string) => {
    return categories.split(";").slice(0, 2).map(c => c.trim()).filter(Boolean);
  };

  return (
    <section id="planes" className="mb-16 scroll-mt-32">
      <h2 className="text-3xl md:text-4xl font-semibold uppercase tracking-widest mb-8 text-center text-[#5A4E3D]">
        Planes e Ideas
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {planes.map((plan, index) => {
          const categorias = getCategorias(plan.Categories);
          const fecha = new Date(plan.Date);
          const fechaFormateada = fecha.toLocaleDateString('es-AR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });

          return (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#E8DDD0] to-[#D4C4B0] hover:from-[#D4C4B0] hover:to-[#C9B99B] transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-2xl hover:shadow-[#A68B5B]/30 border border-[#C9B99B]/50 hover:border-[#A68B5B]/70"
            >
              <div className="p-6 h-full flex flex-col">
                {/* Badges de categorías */}
                {categorias.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {categorias.map((cat, i) => (
                      <span
                        key={i}
                        className="text-xs uppercase tracking-wide px-2 py-1 bg-[#A68B5B]/20 text-[#5A4E3D] rounded-full border border-[#A68B5B]/30"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                {/* Fecha */}
                <p className="text-xs text-[#6B5D47] mb-3 font-light">
                  {fechaFormateada}
                </p>

                {/* Título */}
                <h3 className="text-xl font-semibold mb-3 text-[#5A4E3D] group-hover:text-[#8B7355] transition-colors duration-300 line-clamp-2">
                  {plan.Title}
                </h3>

                {/* Resumen */}
                <p className="text-[#6B5D47] mb-4 flex-grow line-clamp-3 text-sm leading-relaxed">
                  {plan.Summary.replace(/【.*?】/g, '').trim()}
                </p>

                {/* Botón Ver más */}
                {plan.Source && (
                  <Link
                    href={plan.Source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#A68B5B] hover:text-[#8B7355] font-medium text-sm transition-colors duration-300 group/link"
                  >
                    Ver más
                    <svg
                      className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
