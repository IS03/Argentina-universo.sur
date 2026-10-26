import { anunciosDelEspacio, urlAnuncio, type IdEspacio, type AnuncioDirecto as Anuncio } from "@/lib/publicidad";

function Creatividad({ anuncio }: { anuncio: Anuncio }) {
  const { imagen, movimientoReducido } = anuncio;
  return (
    <picture className="block">
      {movimientoReducido && <source media="(prefers-reduced-motion: reduce)" type="image/webp" srcSet={movimientoReducido.src} />}
      {/* Recursos locales: el GIF original conserva todos sus cuadros, tiempos y repeticiones. */}
      <img
        src={imagen.src}
        alt={imagen.alt}
        width={imagen.ancho}
        height={imagen.alto}
        loading="eager"
        decoding="async"
        className="block h-auto w-full object-contain"
        style={{ aspectRatio: `${imagen.ancho} / ${imagen.alto}` }}
      />
    </picture>
  );
}

export function AnuncioDirecto({ anuncio }: { anuncio: Anuncio }) {
  const url = urlAnuncio(anuncio.url);
  return (
    <div data-campana={anuncio.id} className="min-w-0 w-full" style={{ maxWidth: anuncio.anchoMaximo }}>
      {url ? (
          <a href={url} target="_blank" rel="sponsored noopener noreferrer" className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lago-600">
            <Creatividad anuncio={anuncio} />
          </a>
        ) : <Creatividad anuncio={anuncio} />}
    </div>
  );
}

// Servidor: HTML determinista. Sin campañas no hay reserva; picture funciona también sin JS.
export default function EspacioPublicitario({ id, className = "" }: { id: IdEspacio; className?: string }) {
  const anuncios = anunciosDelEspacio(id);
  if (anuncios.length === 0) return null;
  return (
    <aside aria-label="Publicidad" data-espacio-publicitario={id} className={`mx-auto w-full ${className}`}>
      <div className="flex flex-wrap items-start justify-center gap-8">
        {anuncios.map(anuncio => <AnuncioDirecto key={anuncio.id} anuncio={anuncio} />)}
      </div>
    </aside>
  );
}
