"use client";

import { useEffect, useRef } from "react";
import { getHeroScrollState } from "@/lib/home-images";

interface HomeScrollStageProps {
  hero: React.ReactNode;
  children: React.ReactNode;
}

// Hero sticky de 100vh con el contenido superpuesto que sube al hacer scroll.
// El layout es CSS puro (el contenido va en el flujo, debajo del hero), así que no hay que
// medir alturas ni esperar a JavaScript para ubicar el footer. El scroll solo escribe, una vez
// por frame, variables CSS en el hero y el transform del contenido: React no vuelve a renderizar.
export default function HomeScrollStage({ hero, children }: HomeScrollStageProps) {
  const heroRef = useRef<HTMLElement>(null);
  const contenidoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const heroEl = heroRef.current;
    const contenidoEl = contenidoRef.current;
    if (!heroEl || !contenidoEl) return;
    let frame = 0;
    let ultimo = "";

    const aplicar = () => {
      frame = 0;
      const estado = getHeroScrollState(window.scrollY, window.innerHeight);
      const clave = JSON.stringify(estado);
      if (clave === ultimo) return;
      ultimo = clave;
      heroEl.style.setProperty("--hero-opacity", String(estado.opacity));
      heroEl.style.setProperty("--hero-blur", `${estado.blur}px`);
      heroEl.style.setProperty("--hero-overlay", String(estado.overlay));
      heroEl.style.setProperty("--hero-overlay-opacity", String(estado.overlayOpacity));
      contenidoEl.style.transform = `translateY(${estado.contenidoY}px)`;
    };
    const programar = () => {
      if (!frame) frame = requestAnimationFrame(aplicar);
    };

    aplicar();
    window.addEventListener("scroll", programar, { passive: true });
    window.addEventListener("resize", programar);
    return () => {
      window.removeEventListener("scroll", programar);
      window.removeEventListener("resize", programar);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="relative w-full">
      <section
        ref={heroRef}
        className="sticky top-0 w-full h-screen z-0 overflow-hidden"
        style={{ opacity: "var(--hero-opacity, 1)", transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
      >
        {hero}
      </section>
      <div
        ref={contenidoRef}
        className="relative z-10"
        style={{ transform: "translateY(50px)", transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
      >
        {children}
      </div>
    </div>
  );
}
