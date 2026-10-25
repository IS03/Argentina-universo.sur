"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { imagenesHome, altImagenesHome, HERO_INTERVALO_MS } from "@/lib/home-images";

// Fundido cruzado entre capas que nunca deja ver el fondo: la imagen entrante sube de 0 a 1
// por encima de la anterior, que permanece opaca debajo. Solo se montan tres capas
// (anterior, actual y siguiente); la siguiente se descarga después del evento load, así no
// compite con la imagen LCP, y solo se avanza cuando ya terminó de cargar.
export default function HeroCarousel() {
  const [{ actual, anterior }, setEstado] = useState<{ actual: number; anterior: number | null }>({ actual: 0, anterior: null });
  const [precargar, setPrecargar] = useState(false);
  const actualRef = useRef(0);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);
  const cargadas = useRef(new Set<number>());
  const siguiente = (actual + 1) % imagenesHome.length;

  useEffect(() => {
    const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducirMovimiento.matches) return;
    // Fuera de la pantalla el carrusel no avanza.
    const observador = new IntersectionObserver(([entrada]) => { visibleRef.current = entrada.isIntersecting; });
    if (contenedorRef.current) observador.observe(contenedorRef.current);
    const iniciar = () => setPrecargar(true);
    if (document.readyState === "complete") iniciar();
    else window.addEventListener("load", iniciar, { once: true });

    const intervalo = setInterval(() => {
      // Sin trabajo ni descargas nuevas si la pestaña está oculta o el hero ya no se ve.
      if (document.hidden || reducirMovimiento.matches) return;
      if (!visibleRef.current) return;
      const proxima = (actualRef.current + 1) % imagenesHome.length;
      if (!cargadas.current.has(proxima)) return;
      actualRef.current = proxima;
      setEstado(previo => ({ actual: proxima, anterior: previo.actual }));
    }, HERO_INTERVALO_MS);

    return () => {
      window.removeEventListener("load", iniciar);
      clearInterval(intervalo);
      observador.disconnect();
    };
  }, []);

  const capas = [anterior, actual, precargar ? siguiente : null]
    .filter((indice, i, todas): indice is number => indice !== null && todas.indexOf(indice) === i);

  return (
    <div ref={contenedorRef} className="absolute inset-0">
      {capas.map(indice => (
        <div
          key={indice}
          className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
          style={{
            opacity: indice === actual || indice === anterior ? 1 : 0,
            zIndex: indice === actual ? 2 : indice === anterior ? 1 : 0,
          }}
          aria-hidden={indice !== actual}
        >
          <Image
            src={imagenesHome[indice]}
            alt={altImagenesHome[indice]}
            fill
            sizes="100vw"
            className="object-cover"
            quality={85}
            preload={indice === 0}
            fetchPriority={indice === 0 ? "high" : "low"}
            onLoad={() => cargadas.current.add(indice)}
          />
        </div>
      ))}
    </div>
  );
}
