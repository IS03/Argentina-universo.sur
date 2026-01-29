import { NoticiaSantaFe } from "@/lib/data";
import Link from "next/link";

interface NoticiasSectionProps {
  noticias: NoticiaSantaFe[];
}

export default function NoticiasSection({ noticias }: NoticiasSectionProps) {
  return (
    <section id="noticias" className="mb-16 scroll-mt-32">
      <h2 className="text-3xl md:text-4xl font-semibold uppercase tracking-widest mb-8 text-center text-[#5A4E3D]">
        Noticias
      </h2>
      <div className="space-y-6 max-w-4xl mx-auto">
        {noticias.map((noticia, index) => {
          const fecha = new Date(noticia.Date);
          const fechaFormateada = fecha.toLocaleDateString('es-AR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });

          // Obtener categorías
          const categorias = noticia.Categories.split(";").slice(0, 3).map(c => c.trim()).filter(Boolean);

          return (
            <article
              key={index}
              className="group bg-gradient-to-br from-[#E8DDD0] to-[#D4C4B0] hover:from-[#D4C4B0] hover:to-[#C9B99B] border border-[#C9B99B]/50 hover:border-[#A68B5B]/70 rounded-xl p-6 md:p-8 transition-all duration-300 transform hover:scale-[1.01] shadow-lg hover:shadow-xl"
            >
              {/* Badges de categorías */}
              {categorias.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
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
              <p className="text-sm text-[#6B5D47] mb-4 font-light">
                {fechaFormateada}
              </p>

              {/* Título */}
              <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-[#5A4E3D] group-hover:text-[#8B7355] transition-colors duration-300">
                {noticia.Title}
              </h3>

              {/* Resumen */}
              <p className="text-[#6B5D47] mb-6 leading-relaxed">
                {noticia.Summary.replace(/【.*?】/g, '').trim()}
              </p>

              {/* Información adicional si existe */}
              {noticia.Additional_Info && (
                <p className="text-[#6B5D47] mb-6 text-sm italic leading-relaxed">
                  {noticia.Additional_Info}
                </p>
              )}

              {/* Botón Leer más */}
              {noticia.Source && (
                <Link
                  href={noticia.Source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#A68B5B] hover:bg-[#8B7355] text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg group/link"
                >
                  Leer más
                  <svg
                    className="w-5 h-5 transform group-hover/link:translate-x-1 transition-transform duration-300"
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
            </article>
          );
        })}
      </div>
    </section>
  );
}
