"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { anunciosDelEspacio, urlAnuncio, type IdEspacio, type AnuncioDirecto as Anuncio } from "@/lib/publicidad";

const pantallaChica = "(max-width: 639px)";
const suscribirPantalla = (avisar: () => void) => {
  const media = window.matchMedia(pantallaChica);
  media.addEventListener("change", avisar);
  return () => media.removeEventListener("change", avisar);
};

function CreatividadAmpliable({ anuncio, url }: { anuncio: Anuncio; url: string | null }) {
  const movil = useSyncExternalStore(suscribirPantalla, () => window.matchMedia(pantallaChica).matches, () => false);
  const [ampliado, setAmpliado] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);
  const recorrido = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ampliado || !movil) return;
    const elemento = dialogo.current!;
    elemento.showModal();
    // El mensaje está en el centro. Los extremos siguen accesibles mediante scroll y teclado.
    const visor = recorrido.current!;
    visor.scrollLeft = (visor.scrollWidth - visor.clientWidth) / 2;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      elemento.close();
      document.body.style.overflow = overflow;
    };
  }, [ampliado, movil]);

  if (!movil) return url ? (
    <a href={url} target="_blank" rel="sponsored noopener noreferrer" className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lago-600">
      <Creatividad anuncio={anuncio} />
    </a>
  ) : <Creatividad anuncio={anuncio} />;

  return (
    <>
      <button ref={disparador} type="button" aria-label="Ampliar banner de Octubre Rosa" aria-haspopup="dialog" onClick={() => setAmpliado(true)} className="block min-h-11 w-full cursor-zoom-in bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lago-600">
        <Creatividad anuncio={anuncio} />
      </button>
      {ampliado && (
        <dialog ref={dialogo} aria-label="Banner de Octubre Rosa ampliado" onClose={() => { setAmpliado(false); disparador.current?.focus({ preventScroll: true }); }} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-none bg-white p-4 text-tinta-900 backdrop:bg-tinta-900/70">
          <form method="dialog" className="mb-3 flex justify-end">
            <button autoFocus className="min-h-11 px-3 underline focus-visible:outline-2 focus-visible:outline-lago-600">Cerrar</button>
          </form>
          <p className="mb-3 text-sm">Deslizá para recorrer el banner completo.</p>
          <div ref={recorrido} tabIndex={0} role="region" aria-label="Banner completo; desplazamiento horizontal" className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-lago-600">
            <div style={{ width: anuncio.imagen.ancho }}>
              <Creatividad anuncio={anuncio} />
            </div>
          </div>
          {url && <a href={url} target="_blank" rel="sponsored noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center underline">Visitar al anunciante (abre otra pestaña)</a>}
        </dialog>
      )}
    </>
  );
}

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
      {anuncio.id === "mamografia" ? <CreatividadAmpliable anuncio={anuncio} url={url} /> : url ? (
          <a href={url} target="_blank" rel="sponsored noopener noreferrer" className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lago-600">
            <Creatividad anuncio={anuncio} />
          </a>
        ) : <Creatividad anuncio={anuncio} />}
    </div>
  );
}

// HTML inicial determinista; el navegador mejora la recuperación de espacio y la ampliación.
export default function EspacioPublicitario({ id, className = "" }: { id: IdEspacio; className?: string }) {
  const anuncios = anunciosDelEspacio(id);
  const espacio = useRef<HTMLElement>(null);

  useEffect(() => {
    const elemento = espacio.current;
    if (!elemento) return;
    const columna = elemento.closest<HTMLElement>("[data-publicidad-columna]");
    const grilla = columna?.parentElement;
    let retirado = false;
    const actualizar = () => {
      if (retirado) return;
      const campanas = [...elemento.querySelectorAll<HTMLElement>("[data-campana]")];
      for (const campana of campanas) {
        const imagen = campana.querySelector("img");
        if (imagen?.complete && !imagen.naturalWidth) campana.hidden = true;
      }
      const visible = elemento.isConnected && campanas.some(campana => {
        const imagen = campana.querySelector("img");
        return imagen && imagen.getBoundingClientRect().width > 0 && imagen.getBoundingClientRect().height > 0 && getComputedStyle(imagen).visibility === "visible";
      });
      if (visible) return;
      retirado = true;
      // No hay reintentos ni recursos alternativos para sortear el filtro del visitante.
      elemento.querySelectorAll<HTMLDialogElement>("dialog[open]").forEach(dialogo => dialogo.close());
      elemento.hidden = true;
      if (columna) columna.hidden = true;
      if (grilla) {
        for (const lado of ["izquierda", "derecha", "mapa"]) {
          grilla.toggleAttribute(`data-sin-${lado}`, !grilla.querySelector(`:scope > [data-publicidad-columna="${lado}"]:not([hidden])`));
        }
      }
    };
    // complete/naturalWidth también detectan los errores anteriores a la hidratación.
    elemento.addEventListener("error", actualizar, true);
    const tamanos = new ResizeObserver(actualizar);
    tamanos.observe(elemento);
    elemento.querySelectorAll("img").forEach(imagen => tamanos.observe(imagen));
    const cambios = new MutationObserver(actualizar);
    cambios.observe(elemento, { attributes: true, childList: true, subtree: true });
    cambios.observe(elemento.parentElement!, { attributes: true, childList: true });
    if (grilla) cambios.observe(grilla, { childList: true });
    cambios.observe(document.head, { childList: true, subtree: true, characterData: true });
    actualizar();
    return () => {
      elemento.removeEventListener("error", actualizar, true);
      tamanos.disconnect();
      cambios.disconnect();
    };
  }, [id]);

  if (anuncios.length === 0) return null;
  return (
    <aside ref={espacio} aria-label="Publicidad" data-espacio-publicitario={id} className={`mx-auto w-full ${className}`}>
      <div className="flex flex-wrap items-start justify-center gap-8">
        {anuncios.map(anuncio => <AnuncioDirecto key={anuncio.id} anuncio={anuncio} />)}
      </div>
    </aside>
  );
}
