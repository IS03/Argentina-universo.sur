"use client";

import { useEffect, useRef } from "react";

interface FilaDesplazableProps {
  children: React.ReactNode;
  className?: string;
  // Cambia cuando cambia el elemento activo: la fila vuelve a centrarlo.
  activo?: string;
}

// Lista de chips que en teléfonos se desplaza en horizontal (utilidad fila-desplazable) y centra el
// elemento marcado con aria-current o aria-pressed="true", para que la opción vigente siempre se vea.
// Sin JavaScript la fila funciona igual, solo que empieza desde el primer chip.
export default function FilaDesplazable({ children, className = "", activo }: FilaDesplazableProps) {
  const filaRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const fila = filaRef.current;
    const elegido = fila?.querySelector<HTMLElement>('[aria-current="page"], [aria-pressed="true"]');
    if (!fila || !elegido || fila.scrollWidth <= fila.clientWidth) return;
    fila.scrollLeft = elegido.offsetLeft - (fila.clientWidth - elegido.offsetWidth) / 2;
  }, [activo]);
  return (
    <ul ref={filaRef} className={`fila-desplazable relative list-none ${className}`}>
      {children}
    </ul>
  );
}
