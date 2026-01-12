"use client";

import { useState } from "react";
import Image from "next/image";

interface CarruselProps {
  fotos: string[];
  alt: string;
}

export default function Carrusel({ fotos, alt }: CarruselProps) {
  const [indiceActual, setIndiceActual] = useState(0);

  if (!fotos || fotos.length === 0) {
    return null;
  }

  const siguiente = () => {
    setIndiceActual((prev) => (prev + 1) % fotos.length);
  };

  const anterior = () => {
    setIndiceActual((prev) => (prev - 1 + fotos.length) % fotos.length);
  };

  const irA = (indice: number) => {
    setIndiceActual(indice);
  };

  return (
    <div className="relative w-full">
      {/* Imagen principal */}
      <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden rounded-lg bg-gray-900">
        <Image
          src={fotos[indiceActual]}
          alt={`${alt} - Imagen ${indiceActual + 1}`}
          fill
          className="object-cover"
          priority={indiceActual === 0}
          unoptimized
          onError={(e) => {
            console.error("Error cargando imagen:", fotos[indiceActual]);
          }}
        />
      </div>

      {/* Controles de navegación */}
      {fotos.length > 1 && (
        <>
          <button
            onClick={anterior}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
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
            onClick={siguiente}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
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

      {/* Indicadores */}
      {fotos.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {fotos.map((_, indice) => (
            <button
              key={indice}
              onClick={() => irA(indice)}
              className={`h-2 rounded-full transition-all ${
                indice === indiceActual
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
