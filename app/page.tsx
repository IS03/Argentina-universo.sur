"use client";

import Navbar from "@/components/Navbar";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  // Array con las imágenes de home
  const imagenesHome = Array.from({ length: 10 }, (_, i) => `/img/home/${i + 1}.jpg`);
  const [indiceImagen, setIndiceImagen] = useState(0);
  const [indiceAnterior, setIndiceAnterior] = useState(0);
  const [opacidad, setOpacidad] = useState(1);
  const indiceImagenRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cambiar imagen automáticamente cada 5 segundos con transición suave
  useEffect(() => {
    const intervalo = setInterval(() => {
      // Limpiar timeout anterior si existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Capturar el índice actual ANTES de cualquier cambio
      const indiceActual = indiceImagenRef.current;
      const siguienteIndice = (indiceActual + 1) % imagenesHome.length;
      
      // Actualizar índice anterior INMEDIATAMENTE (antes del fade out)
      // Esto asegura que siempre muestre la imagen correcta durante la transición
      setIndiceAnterior(indiceActual);
      
      // Fade out suave
      setOpacidad(0);
      
      timeoutRef.current = setTimeout(() => {
        // Actualizar índices de forma sincronizada
        indiceImagenRef.current = siguienteIndice;
        setIndiceImagen(siguienteIndice);
        // Fade in suave
        setOpacidad(1);
        timeoutRef.current = null;
      }, 2500); // Duración del fade (debe coincidir con la transición CSS)
    }, 5000);

    return () => {
      clearInterval(intervalo);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [imagenesHome.length]);

  return (
    <>
      <Navbar />

      <main className="relative min-h-screen w-full overflow-hidden">
        {/* Carrusel de imágenes de fondo fullscreen con crossfade suave */}
        <div className="absolute inset-0 z-0">
          {/* Imagen anterior (fade out) */}
          <Image
            src={imagenesHome[indiceAnterior]}
            alt={`Paisaje argentino ${indiceAnterior + 1}`}
            fill
            className="object-cover"
            style={{ 
              opacity: 1 - opacidad, 
              transition: 'opacity 2.5s cubic-bezier(0.4, 0, 0.2, 1)' 
            }}
            quality={90}
          />
          {/* Imagen actual (fade in) */}
          <Image
            src={imagenesHome[indiceImagen]}
            alt={`Paisaje argentino ${indiceImagen + 1}`}
            fill
            className="object-cover"
            style={{ 
              opacity: opacidad, 
              transition: 'opacity 2.5s cubic-bezier(0.4, 0, 0.2, 1)' 
            }}
            priority
            quality={90}
          />
          {/* Overlay con gradiente colorido en lugar de solo oscuro */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-amber-900/20"></div>
          {/* Efecto de brillo sutil */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-blue-500/10"></div>
        </div>

        {/* Contenido editorial centrado */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center pt-20 pb-20">
          <div className="mb-8">
            <h1 
              className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-[0.1em] uppercase mb-4 text-transparent bg-clip-text drop-shadow-2xl transition-all duration-300 hover:drop-shadow-[0_0_40px_rgba(108,180,238,0.9)] cursor-default"
              style={{
                backgroundImage: 'linear-gradient(to right, #6CB4EE 0%, white 30%, rgba(255, 215, 0, 0.75) 50%, white 70%, #6CB4EE 100%)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundImage = 'linear-gradient(to right, #75AADB 0%, rgb(224, 242, 254) 30%, rgba(255, 223, 0, 0.85) 50%, rgb(224, 242, 254) 70%, #75AADB 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundImage = 'linear-gradient(to right, #6CB4EE 0%, white 30%, rgba(255, 215, 0, 0.75) 50%, white 70%, #6CB4EE 100%)';
              }}
            >
              Argentina
            </h1>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-light tracking-[0.2em] uppercase text-white/90 mb-8 drop-shadow-lg">
              Universo Sur
            </h2>
          </div>
          
          <p className="text-base md:text-lg text-gray-100 max-w-2xl font-light tracking-wide leading-relaxed drop-shadow-md">
            Descubrí los destinos más emblemáticos de Argentina
          </p>
        </div>
      </main>
    </>
  );
}