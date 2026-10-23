"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface CarruselProps {
  fotos: string[];
  alt: string;
}

export default function Carrusel({ fotos, alt }: CarruselProps) {
  const [indiceActual, setIndiceActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const timeoutReanudarRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cantidad = fotos.length;
  const indiceVisible = cantidad > 0 ? indiceActual % cantidad : 0;

  useEffect(() => {
    if (cantidad <= 1 || pausado) return;
    const intervalo = setInterval(() => {
      setIndiceActual(indice => (indice + 1) % cantidad);
    }, 3000);
    return () => clearInterval(intervalo);
  }, [cantidad, pausado]);

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
    <div className="relative w-full">
      <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden rounded-lg bg-gray-900">
        {/* Imagen actual - sin animaciones */}
        <div className="absolute inset-0">
          <Image
            src={fotos[indiceVisible]}
            alt={`${alt} - Imagen ${indiceVisible + 1} de ${fotos.length}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
            className="object-cover"
            priority={indiceVisible === 0}
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              anterior();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-20"
            aria-label="Imagen anterior"
          >
            <svg
              className="w-6 h-6"
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              siguiente();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-20"
            aria-label="Imagen siguiente"
          >
            <svg
              className="w-6 h-6"
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
        <div className="flex justify-center gap-2 mt-4">
          {fotos.map((_, indice) => (
            <button
              key={indice}
              onClick={() => irA(indice)}
              className={`h-2 rounded-full ${
                indice === indiceVisible
                  ? "w-8 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Ir a imagen ${indice + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
