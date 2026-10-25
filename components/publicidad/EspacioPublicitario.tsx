import { ESPACIOS, FORMATOS, ANUNCIO_DE_EJEMPLO, modoEspacio, type IdEspacio, type AnuncioDirecto as Anuncio } from "@/lib/publicidad";

// Rótulo común: la publicidad nunca se presenta como contenido editorial.
function Rotulo() {
  return <p className="antetitulo mb-2 text-[0.625rem] text-tinta-500">Publicidad</p>;
}

export function AnuncioDirecto({ anuncio }: { anuncio: Anuncio }) {
  return (
    <a
      href={anuncio.href}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className="flex h-full w-full flex-col justify-center rounded-control border border-sol-400 bg-white p-4 text-left hover:bg-arena-50"
    >
      <span className="text-xs font-semibold text-tinta-500">{anuncio.anunciante}</span>
      <span className="mt-1 font-semibold text-tinta-900">{anuncio.titulo}</span>
      <span className="mt-1 line-clamp-2 text-sm text-tinta-700">{anuncio.texto}</span>
    </a>
  );
}

// Servidor: decide en el build. Hoy siempre devuelve null fuera de la vista previa local.
export default function EspacioPublicitario({ id, className = "" }: { id: IdEspacio; className?: string }) {
  if (modoEspacio() === "oculto") return null;
  const espacio = ESPACIOS[id];
  const formato = FORMATOS[espacio.formato];
  return (
    <aside aria-label="Publicidad" data-espacio-publicitario={id} className={`mx-auto w-full ${className}`}>
      <div className={`mx-auto ${formato.claseAncho}`}>
        <Rotulo />
        <div className={`mx-auto flex w-full items-center justify-center rounded-control border border-dashed border-arena-400 bg-arena-100 ${formato.claseAlto}`}>
          {espacio.formato === "rectangulo" ? (
            <AnuncioDirecto anuncio={ANUNCIO_DE_EJEMPLO} />
          ) : (
            <p className="px-4 text-center text-xs text-tinta-500">
              Espacio reservado {formato.movil.ancho} × {formato.movil.alto} / {formato.escritorio.ancho} × {formato.escritorio.alto} · {espacio.descripcion}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
