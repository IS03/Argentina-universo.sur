"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface CarruselProps {
  fotos: string[];
  alt: string;
}

export default function Carrusel({ fotos, alt }: CarruselProps) {
  const [indiceActual, setIndiceActual] = useState(0);
  const intervaloRef = useRef<NodeJS.Timeout | null>(null);
  const pausadoRef = useRef(false);
  const timeoutReanudarRef = useRef<NodeJS.Timeout | null>(null);
  const indiceActualRef = useRef(0);

  useEffect(() => {
    indiceActualRef.current = indiceActual;
  }, [indiceActual]);

  if (!fotos || fotos.length === 0) {
    return null;
  }

  const cambiarImagen = (nuevoIndice: number, esAutomatico: boolean = false) => {
    // Normalizar el índice correctamente para ciclo infinito
    let indiceNormalizado: number;
    if (nuevoIndice >= 0) {
      indiceNormalizado = nuevoIndice % fotos.length;
    } else {
      indiceNormalizado = ((nuevoIndice % fotos.length) + fotos.length) % fotos.length;
    }

    // Evitar cambiar si es la misma imagen
    if (indiceNormalizado === indiceActualRef.current) {
      return;
    }

    if (!esAutomatico) {
      // Pausar el autoplay cuando el usuario interactúa manualmente
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
        intervaloRef.current = null;
      }
      pausadoRef.current = true;

      // Limpiar timeout anterior si existe
      if (timeoutReanudarRef.current) {
        clearTimeout(timeoutReanudarRef.current);
      }

      // Reanudar después de 4 segundos
      timeoutReanudarRef.current = setTimeout(() => {
        pausadoRef.current = false;
        iniciarAutoPlay();
      }, 4000);
    }

    // Actualizar el ref inmediatamente
    indiceActualRef.current = indiceNormalizado;
    
    // Cambiar el índice directamente sin animaciones
    setIndiceActual(indiceNormalizado);
  };

  const iniciarAutoPlay = () => {
    if (fotos.length <= 1 || pausadoRef.current) return;

    // Limpiar intervalo anterior si existe
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
    }

    // Cambiar cada 3 segundos (3000ms)
    intervaloRef.current = setInterval(() => {
      if (pausadoRef.current) return;
      
      // Calcular el siguiente índice con ciclo infinito
      // Usar el ref directamente para asegurar que siempre tenemos el valor más actualizado
      const indiceActual = indiceActualRef.current;
      const siguienteIndice = (indiceActual + 1) % fotos.length;
      
      // Cambiar la imagen - ahora el módulo ya está aplicado aquí también
      cambiarImagen(siguienteIndice, true);
    }, 3000);
  };

  useEffect(() => {
    iniciarAutoPlay();

    return () => {
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
      }
      if (timeoutReanudarRef.current) {
        clearTimeout(timeoutReanudarRef.current);
      }
    };
  }, [fotos.length]);

  const siguiente = () => {
    // Calcular siguiente con ciclo infinito
    const siguienteIndice = (indiceActual + 1) % fotos.length;
    cambiarImagen(siguienteIndice, false);
  };

  const anterior = () => {
    // Calcular anterior con ciclo infinito (si es -1, se normaliza a la última)
    const anteriorIndice = ((indiceActual - 1) + fotos.length) % fotos.length;
    cambiarImagen(anteriorIndice, false);
  };

  const irA = (indice: number) => {
    cambiarImagen(indice, false);
  };

  return (
    <div className="relative w-full">
      <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden rounded-lg bg-gray-900">
        {/* Imagen actual - sin animaciones */}
        <div className="absolute inset-0">
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
