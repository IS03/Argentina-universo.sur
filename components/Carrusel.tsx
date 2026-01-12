"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface CarruselProps {
  fotos: string[];
  alt: string;
}

export default function Carrusel({ fotos, alt }: CarruselProps) {
  const [indiceActual, setIndiceActual] = useState(0);
  const [indiceAnterior, setIndiceAnterior] = useState(0);
  const [opacidad, setOpacidad] = useState(1);
  const intervaloRef = useRef<NodeJS.Timeout | null>(null);
  const pausadoRef = useRef(false);
  const timeoutReanudarRef = useRef<NodeJS.Timeout | null>(null);
  const indiceActualRef = useRef(0);
  const transicionandoRef = useRef(false);

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

    // Para cambios manuales, solo evitar si es la misma imagen (pero permitir cancelar transición)
    if (!esAutomatico) {
      if (indiceNormalizado === indiceActual && opacidad === 1 && !transicionandoRef.current) {
        return;
      }
    } else {
      // Para automático, usar el ref para comparar (más confiable)
      if (indiceNormalizado === indiceActualRef.current && opacidad === 1 && !transicionandoRef.current) {
        return;
      }
      // Si está transicionando, no permitir cambios automáticos (esperar a que termine)
      if (transicionandoRef.current) {
        return;
      }
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

    // Iniciar transición suave
    transicionandoRef.current = true;
    setIndiceAnterior(indiceActualRef.current);
    
    // Actualizar el ref inmediatamente para mantener sincronización
    indiceActualRef.current = indiceNormalizado;
    
    // Cambiar el índice
    setIndiceActual(indiceNormalizado);
    
    // Iniciar la transición de opacidad de forma suave y difuminada
    // Primero fade out de la imagen actual
    setOpacidad(0);
    
    // Después de un pequeño delay para que comience el fade out, hacer fade in de la nueva imagen
    // Esto crea un efecto de crossfade más suave
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setOpacidad(1);
      });
    });
    
    // Resetear el flag de transición después de que termine completamente la animación
    // Usar un tiempo ligeramente mayor que la duración de la transición CSS (2.5s)
    setTimeout(() => {
      transicionandoRef.current = false;
    }, 2800);
  };

  const iniciarAutoPlay = () => {
    if (fotos.length <= 1 || pausadoRef.current) return;

    // Limpiar intervalo anterior si existe
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
    }

    // Cambiar cada 3 segundos (3000ms)
    // El intervalo se ejecuta cada 3s, pero la transición dura 2.5s
    // Esto da tiempo suficiente entre cambios
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
    // Si está transicionando, cancelar la transición actual
    if (transicionandoRef.current) {
      transicionandoRef.current = false;
    }
    
    // Calcular siguiente con ciclo infinito
    const siguienteIndice = (indiceActual + 1) % fotos.length;
    cambiarImagen(siguienteIndice, false);
  };

  const anterior = () => {
    // Si está transicionando, cancelar la transición actual
    if (transicionandoRef.current) {
      transicionandoRef.current = false;
    }
    
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
        {/* Imagen anterior (fade out) */}
        {indiceAnterior !== indiceActual && (
          <div
            className="absolute inset-0"
            style={{
              opacity: 1 - opacidad,
              transition: "opacity 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              zIndex: opacidad < 1 ? 2 : 1,
              pointerEvents: "none",
            }}
          >
            <Image
              src={fotos[indiceAnterior]}
              alt={`${alt} - Imagen ${indiceAnterior + 1}`}
              fill
              className="object-cover"
              unoptimized
              onError={(e) => {
                console.error("Error cargando imagen:", fotos[indiceAnterior]);
              }}
            />
          </div>
        )}
        {/* Imagen actual (fade in) */}
        <div
          className="absolute inset-0"
          style={{
            opacity: opacidad,
            transition: "opacity 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            zIndex: opacidad >= 1 ? 2 : 1,
            pointerEvents: "none",
          }}
        >
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
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-20"
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
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-20"
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
