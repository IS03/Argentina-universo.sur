"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import { SIZES_ANCHO_COMPLETO } from "@/components/ui/grillas";

// Movimiento reducido: sin rotación automática. En el servidor se asume que no (no cambia el HTML).
const CONSULTA_MOVIMIENTO = "(prefers-reduced-motion: reduce)";
const suscribirMovimiento = (avisar: () => void) => {
  const consulta = window.matchMedia(CONSULTA_MOVIMIENTO);
  consulta.addEventListener("change", avisar);
  return () => consulta.removeEventListener("change", avisar);
};
const movimientoReducido = () => window.matchMedia(CONSULTA_MOVIMIENTO).matches;

interface CarruselProps {
  fotos: string[];
  alt: string;
  // Ancho real del carrusel en la página (por defecto, el ancho completo del contenedor).
  sizes?: string;
}

export default function Carrusel({ fotos, alt, sizes = SIZES_ANCHO_COMPLETO }: CarruselProps) {
  const [indiceActual, setIndiceActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  // También se detiene mientras el puntero o el foco están sobre el carrusel.
  const [enUso, setEnUso] = useState(false);
  const reducido = useSyncExternalStore(suscribirMovimiento, movimientoReducido, () => false);
  const timeoutReanudarRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cantidad = fotos.length;
  const indiceVisible = cantidad > 0 ? indiceActual % cantidad : 0;

  useEffect(() => {
    if (cantidad <= 1 || pausado || enUso || reducido) return;
    const intervalo = setInterval(() => {
      setIndiceActual(indice => (indice + 1) % cantidad);
    }, 3000);
    return () => clearInterval(intervalo);
  }, [cantidad, pausado, enUso, reducido]);

  useEffect(() => () => {
    if (timeoutReanudarRef.current) clearTimeout(timeoutReanudarRef.current);
  }, []);

  // Todos los hooks se ejecutan incluso cuando la lista está vacía.
  if (cantidad === 0) return null;

  const irA = (indice: number) => {
    setIndiceActual(((indice % cantidad) + cantidad) % cantidad);
    setPausado(true);
    if (timeoutReanudarRef.current) clearTimeout(timeoutReanudarRef.current);
    timeoutReanudarRef.current = setTimeout(() => setPausado(false), 4000);
  };
  const siguiente = () => irA(indiceVisible + 1);
  const anterior = () => irA(indiceVisible - 1);

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setEnUso(true)}
      onMouseLeave={() => setEnUso(false)}
      onFocus={() => setEnUso(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setEnUso(false); }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-tarjeta bg-tinta-900 sm:aspect-[16/9]">
        {/* Imagen actual - sin animaciones */}
        <div className="absolute inset-0">
          {/* Sin priority: en los detalles el carrusel queda debajo del pliegue (descripción y mapa)
              y su precarga de alta prioridad competía con el contenido visible. */}
          <Image
            src={fotos[indiceVisible]}
            alt={`${alt} - Imagen ${indiceVisible + 1} de ${fotos.length}`}
            fill
            sizes={sizes}
            className="object-cover"
            quality={85}
            onError={() => {
              console.error("Error cargando imagen:", fotos[indiceVisible]);
            }}
          />
        </div>
      </div>

      {fotos.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              anterior();
            }}
            className="absolute left-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-tinta-900 shadow-tarjeta hover:bg-white"
            aria-label="Imagen anterior"
          >
            <svg
              aria-hidden="true"
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              siguiente();
            }}
            className="absolute right-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-tinta-900 shadow-tarjeta hover:bg-white"
            aria-label="Imagen siguiente"
          >
            <svg
              aria-hidden="true"
              className="size-5"
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
          </button>
        </>
      )}

      {fotos.length > 1 && (
        <div className="mt-3 flex justify-center gap-1">
          {fotos.map((_, indice) => (
            // Área táctil de 24 px alrededor del punto visible; colores con contraste sobre el fondo crema.
            <button
              key={indice}
              type="button"
              onClick={() => irA(indice)}
              className="group flex h-6 min-w-6 items-center justify-center rounded-full"
              aria-label={`Ir a imagen ${indice + 1}`}
              aria-current={indice === indiceVisible ? "true" : undefined}
            >
              <span
                aria-hidden="true"
                className={`h-2 rounded-full ${
                  indice === indiceVisible
                    ? "w-8 bg-tinta-900"
                    : "w-2 bg-arena-400 group-hover:bg-lago-600"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
