import { anunciosDelEspacio, urlAnuncio, type IdEspacio, type ImagenAnuncio, type AnuncioDirecto as Anuncio } from "@/lib/publicidad";

function Creatividad({ imagen }: { imagen: ImagenAnuncio }) {
  return (
    <>
      {/* WebP local ya optimizado: mismo recurso en Next y Pages, sin servidor de imágenes. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imagen.src}
        alt={imagen.alt}
        width={imagen.ancho}
        height={imagen.alto}
        loading="lazy"
        decoding="async"
        className="block h-auto w-full object-contain"
        style={{ aspectRatio: `${imagen.ancho} / ${imagen.alto}` }}
      />
      {/* Las bandas muy panorámicas conservan su proporción. Su texto también es legible en móvil. */}
      {imagen.ancho / imagen.alto > 5 && <p className="mt-2 text-sm leading-relaxed text-tinta-700">{imagen.alt}</p>}
    </>
  );
}

export function AnuncioDirecto({ anuncio }: { anuncio: Anuncio }) {
  const url = urlAnuncio(anuncio.url);
  return (
    <div data-campana={anuncio.id} className="min-w-0 w-full" style={{ maxWidth: anuncio.anchoMaximo }}>
      <p className="antetitulo mb-2 text-[0.625rem] text-tinta-500">Publicidad</p>
      <div className="rounded-control border border-arena-300 bg-white p-2 sm:p-3">
        {url ? (
          <a href={url} target="_blank" rel="sponsored noopener noreferrer" className="block rounded-control focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lago-600">
            <Creatividad imagen={anuncio.imagen} />
          </a>
        ) : <Creatividad imagen={anuncio.imagen} />}
        <p className="mt-3 text-xs leading-relaxed text-tinta-500">{anuncio.anunciante}</p>
        {anuncio.secuencia && anuncio.secuencia.length > 0 && (
          <details className="mt-2 border-t border-arena-300">
            <summary className="min-h-11 cursor-pointer py-3 text-xs font-medium text-tinta-700 hover:text-lago-700">
              Ver secuencia de la campaña
            </summary>
            <ol className="grid list-none gap-4 pb-2" aria-label={`Imágenes de la campaña de ${anuncio.anunciante}`}>
              {anuncio.secuencia.map(imagen => <li key={imagen.src}><Creatividad imagen={imagen} /></li>)}
            </ol>
          </details>
        )}
      </div>
    </div>
  );
}

// Servidor: HTML determinista desde la configuración. Sin campañas no hay reserva ni rótulo vacío.
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
