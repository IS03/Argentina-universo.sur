import { NoticiaSantaFe } from "@/lib/data";
import Icono from "@/components/ui/Icono";
import { boton } from "@/components/ui/estilos";
import { fechaSantaFe, limpiarResumen } from "./formato";

interface NoticiasSectionProps {
  noticias: NoticiaSantaFe[];
}

export default function NoticiasSection({ noticias }: NoticiasSectionProps) {
  return (
    <section id="noticias" aria-labelledby="noticias-titulo" className="max-w-3xl">
      <h2 id="noticias-titulo" className="sr-only">Noticias</h2>
      <div className="space-y-6">
        {noticias.map((noticia, index) => {
          // Obtener categorías
          const categorias = noticia.Categories.split(";").slice(0, 3).map(c => c.trim()).filter(Boolean);

          return (
            <article key={index} className="rounded-tarjeta border border-arena-300/80 bg-white p-5 shadow-tarjeta sm:p-8">
              {categorias.length > 0 && (
                <ul className="mb-3 flex list-none flex-wrap gap-1.5" aria-label="Categorías">
                  {categorias.map((cat, i) => (
                    <li key={i} className="rounded-full bg-region-litoral/10 px-2.5 py-0.5 text-xs font-medium text-region-litoral">{cat}</li>
                  ))}
                </ul>
              )}
              <p className="text-sm text-tinta-500">
                <time dateTime={noticia.Date}>{fechaSantaFe(noticia.Date)}</time>
              </p>
              <h3 className="mt-2 font-display text-[1.875rem] leading-tight text-tinta-900">{noticia.Title}</h3>
              <p className="mt-4 leading-relaxed text-tinta-700">{limpiarResumen(noticia.Summary)}</p>
              {noticia.Additional_Info && (
                <p className="mt-4 border-l-2 border-arena-300 pl-4 text-sm leading-relaxed text-tinta-700">{noticia.Additional_Info}</p>
              )}
              {noticia.Source && (
                <a href={noticia.Source} target="_blank" rel="noopener noreferrer" className={boton("primario", "mt-6")}>
                  Leer más
                  <Icono nombre="externo" className="size-4" />
                  <span className="sr-only">(abre en otra pestaña)</span>
                </a>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
