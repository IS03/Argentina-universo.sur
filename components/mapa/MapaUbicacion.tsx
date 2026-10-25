"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ICONO_MARCADOR } from "@/components/mapa/iconos";
import { teselasVistaPrevia, TAMANO_TESELA, type AnchoMinimo } from "@/lib/mapa-teselas";

const cargarLeaflet = () => import("@/components/mapa/MapaLeaflet");
const MapaLeaflet = dynamic(cargarLeaflet, { ssr: false });

// Las teselas fuera de la pantalla quedan en display: none con loading="lazy", así el
// navegador no las descarga (el recorte de overflow no alcanza para evitarlo).
const MD = 768;
const VISIBLE_DESDE: Record<AnchoMinimo, string> = {
  0: "",
  420: "hidden min-[420px]:block",
  520: "hidden min-[520px]:block",
  640: "hidden sm:block",
  768: "hidden md:block",
  900: "hidden min-[900px]:block",
  1024: "hidden lg:block",
  1280: "hidden xl:block",
};

interface MapaUbicacionProps {
  lat: number;
  lon: number;
  titulo: string;
  detalle?: string;
  className?: string;
  /**
   * false cuando el mapa queda sobre el pliegue: en pantallas angostas la descripción visible es
   * más chica que una tesela, que pasaría a ser el LCP (~150 KB de imágenes de otro origen).
   * Allí se muestra un fondo liviano con el marcador hasta que la persona active el mapa.
   */
  teselasEnMovil?: boolean;
}

/**
 * Mapa de ubicación en dos tiempos, en un contenedor de alto fijo: nunca desplaza el contenido
 * (CLS). El HTML trae una vista previa estática con las mismas teselas y el mismo marcador que
 * mostrará Leaflet, sin esperar a hidratar. Leaflet (~45 KB) se descarga cuando la persona
 * quiere interactuar, así sus teselas no compiten como LCP ni atrapan el scroll en móvil.
 */
export default function MapaUbicacion({ lat, lon, titulo, detalle, className = "", teselasEnMovil = true }: MapaUbicacionProps) {
  const [estado, setEstado] = useState<"vista-previa" | "cargando" | "interactivo">("vista-previa");
  const activar = () => setEstado(actual => (actual === "vista-previa" ? "cargando" : actual));
  const precargar = () => { void cargarLeaflet(); };

  return (
    <div
      role="region"
      aria-label={`Mapa de ubicación: ${titulo}`}
      className={`relative w-full h-96 rounded-tarjeta overflow-hidden border border-arena-300/80 bg-arena-200 z-0 ${className}`}
    >
      {estado !== "interactivo" && (
        <>
          <button
            type="button"
            onClick={activar}
            onPointerEnter={precargar}
            onFocus={precargar}
            aria-label={`Explorar mapa interactivo: ${titulo}`}
            className="group absolute inset-0 w-full h-full cursor-pointer text-left focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-tinta-900"
          >
            {/* Fondo liviano (sin imágenes) visible mientras no hay teselas. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-arena-100"
              style={{ backgroundImage: "linear-gradient(var(--color-arena-200) 1px, transparent 1px), linear-gradient(90deg, var(--color-arena-200) 1px, transparent 1px)", backgroundSize: "40px 40px", backgroundPosition: "center" }}
            >
              {/* eslint-disable @next/next/no-img-element -- teselas de OSM y marcador de Leaflet: deben ser las mismas URLs que pide Leaflet, sin optimizar */}
              {teselasVistaPrevia(lat, lon).map(tesela => (
                <img
                  key={tesela.url}
                  src={tesela.url}
                  alt=""
                  width={TAMANO_TESELA}
                  height={TAMANO_TESELA}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className={`absolute max-w-none select-none ${VISIBLE_DESDE[teselasEnMovil ? tesela.anchoMinimo : Math.max(tesela.anchoMinimo, MD) as AnchoMinimo]}`}
                  style={{ left: `calc(50% + ${tesela.dx}px)`, top: `calc(50% + ${tesela.dy}px)` }}
                />
              ))}
              <img
                src={ICONO_MARCADOR}
                alt=""
                width={25}
                height={41}
                draggable={false}
                className="absolute max-w-none select-none"
                style={{ left: "calc(50% - 12px)", top: "calc(50% - 41px)" }}
              />
              {/* eslint-enable @next/next/no-img-element */}
            </span>
            <span className={`absolute top-3 right-3 ${teselasEnMovil ? "" : "max-md:top-[calc(50%+1rem)] max-md:right-auto max-md:left-1/2 max-md:-translate-x-1/2"} inline-flex items-center gap-2 rounded-full border border-arena-300/60 bg-arena-50/95 px-4 py-2 text-sm font-medium text-tinta-900 shadow-md transition-colors group-hover:bg-white motion-reduce:transition-none`}>
              <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {estado === "cargando" ? "Cargando mapa…" : "Explorar mapa"}
            </span>
          </button>
          <span className={`absolute bottom-0 right-0 bg-white/80 px-1.5 text-[11px] leading-5 text-[#333] ${teselasEnMovil ? "" : "max-md:hidden"}`}>
            &copy; <a href="https://www.openstreetmap.org/copyright" className="text-[#0078A8] hover:underline">OpenStreetMap</a> contributors
          </span>
        </>
      )}
      {estado !== "vista-previa" && (
        <MapaLeaflet lat={lat} lon={lon} titulo={titulo} detalle={detalle} onListo={() => setEstado("interactivo")} />
      )}
    </div>
  );
}
