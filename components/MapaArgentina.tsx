"use client";

import { useRouter } from "next/navigation";
import { Provincia } from "@/lib/data";
import { useState, useEffect, useRef, useCallback, useEffectEvent } from "react";

interface MapaArgentinaProps {
  provincias: Provincia[];
  zonaActiva: string;
}

// Dimensiones de public/argentina.svg (atributos width y height del archivo).
const ANCHO_SVG = 361.54608;
const ALTO_SVG = 792.5788;

// Mapeo de slugs a IDs del SVG (formato AR-X)
const SLUG_TO_SVG_ID: Record<string, string> = {
  buenos_aires: "AR-B",
  caba: "AR-C",
  catamarca: "AR-K",
  chaco: "AR-H",
  chubut: "AR-U",
  cordoba: "AR-X",
  corrientes: "AR-W",
  entre_rios: "AR-E",
  formosa: "AR-P",
  jujuy: "AR-Y",
  la_pampa: "AR-L",
  la_rioja: "AR-F",
  mendoza: "AR-M",
  misiones: "AR-N",
  neuquen: "AR-Q",
  rio_negro: "AR-R",
  salta: "AR-A",
  san_juan: "AR-J",
  san_luis: "AR-D",
  santa_cruz: "AR-Z",
  santa_fe: "AR-S",
  santiago_del_estero: "AR-G",
  tierra_del_fuego: "AR-V",
  tucuman: "AR-T",
};

export default function MapaArgentina({ provincias, zonaActiva }: MapaArgentinaProps) {
  const router = useRouter();
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  const handleProvinciaClick = useCallback((slug: string) => {
    router.push(`/provincias/${slug}`);
  }, [router]);

  // Función helper para obtener provincia por SVG ID
  const getProvinciaBySvgId = useCallback((svgId: string): Provincia | undefined => {
    return provincias.find((p) => SLUG_TO_SVG_ID[p.slug] === svgId);
  }, [provincias]);

  // Función para actualizar estilos de los paths
  const actualizarEstilosPaths = useCallback(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current.querySelector("svg");
    if (!svg) return;

    const paths = svg.querySelectorAll("path");
    paths.forEach((path) => {
      const svgId = path.getAttribute("id");
      if (!svgId) return;

      const provincia = getProvinciaBySvgId(svgId);
      if (!provincia) return;

      const isHovered = hoveredSlug === provincia.slug;
      const perteneceZona = zonaActiva === "Todas" || provincia.zona === zonaActiva;
      const opacity = perteneceZona ? 1 : 0.3;
      const fill = isHovered
        ? "#A68B5B"
        : perteneceZona
        ? "#C9B99B"
        : "#D4C4B0";
      const stroke = isHovered
        ? "#8B7355"
        : perteneceZona
        ? "#A68B5B"
        : "#C9B99B";
      const strokeWidth = isHovered ? 3 : perteneceZona ? 2 : 1;

      // Actualizar estilos
      path.setAttribute("fill", fill);
      path.setAttribute("stroke", stroke);
      path.setAttribute("stroke-width", String(strokeWidth));
      path.setAttribute("opacity", String(opacity));
    });
  }, [getProvinciaBySvgId, hoveredSlug, zonaActiva]);
  const aplicarEstilosIniciales = useEffectEvent(actualizarEstilosPaths);

  // Cargar el SVG solo una vez (sin zonaActiva en dependencias)
  useEffect(() => {
    const container = svgRef.current;
    if (!container) return;
    
    // Prevenir carga múltiple
    if (container.children.length > 0) return;

    let isMounted = true;

    fetch("/argentina.svg")
      .then((res) => res.text())
      .then((text) => {
        if (!isMounted || !svgRef.current) return;
        
        // Verificar nuevamente después de la carga asíncrona
        if (container.children.length > 0) return;

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(text, "image/svg+xml");
        const svgElement = svgDoc.querySelector("svg");

        if (!svgElement || !svgRef.current) return;

        // Clonar el SVG
        const clonedSvg = svgElement.cloneNode(true) as SVGElement;
        
        // Asegurar que el SVG se ajuste al contenedor
        clonedSvg.removeAttribute("width");
        clonedSvg.removeAttribute("height");
        if (!clonedSvg.getAttribute("viewBox")) {
          clonedSvg.setAttribute("viewBox", `0 0 ${ANCHO_SVG} ${ALTO_SVG}`);
        }
        clonedSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        clonedSvg.setAttribute("style", "width: 100%; height: auto; max-height: 600px;");
        
        // Procesar cada path y agregar event listeners
        const paths = clonedSvg.querySelectorAll("path");
        paths.forEach((path) => {
          const svgId = path.getAttribute("id");
          if (!svgId) return;

          const provincia = getProvinciaBySvgId(svgId);
          if (!provincia) {
            path.style.display = "none";
            return;
          }

          // Estilos base
          path.setAttribute("style", `cursor: pointer; transition: all 0.3s ease`);
          path.setAttribute("title", provincia.provincia);
          // Cada provincia es un enlace accesible con teclado (Tab, Enter o Espacio).
          path.setAttribute("tabindex", "0");
          path.setAttribute("role", "link");
          path.setAttribute("aria-label", `Ver turismo en ${provincia.provincia}`);

          // Agregar event listeners una sola vez
          path.addEventListener("mouseenter", () => setHoveredSlug(provincia.slug));
          path.addEventListener("mouseleave", () => setHoveredSlug(null));
          path.addEventListener("focus", () => setHoveredSlug(provincia.slug));
          path.addEventListener("blur", () => setHoveredSlug(null));
          path.addEventListener("click", () => handleProvinciaClick(provincia.slug));
          path.addEventListener("keydown", (e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            handleProvinciaClick(provincia.slug);
          });
        });
        clonedSvg.setAttribute("role", "group");
        clonedSvg.setAttribute("aria-label", "Mapa de provincias de Argentina");

        // Agregar el SVG al DOM
        svgRef.current.appendChild(clonedSvg);
        
        // Aplicar estilos inmediatamente después de cargar
        aplicarEstilosIniciales();
      })
      .catch((err) => console.error("Error cargando SVG:", err));

    // Función de limpieza
    return () => {
      isMounted = false;
      container.replaceChildren();
    };
  }, [getProvinciaBySvgId, handleProvinciaClick]);

  // Actualizar estilos cuando cambia el filtro o el hover
  useEffect(() => {
    actualizarEstilosPaths();
  }, [actualizarEstilosPaths]);

  return (
    <div className="w-full flex justify-center mb-8">
      <div className="w-full max-w-4xl">
        <div className="bg-gradient-to-br from-[#F5F1E8] to-[#E8DDD0] rounded-xl p-6 shadow-lg border border-[#C9B99B]/30 overflow-hidden">
          {/* El SVG llega por fetch después de hidratar: el contenedor ya reserva su alto
              (misma relación de aspecto y tope de 600 px) y la grilla no se desplaza (CLS). */}
          <div
            ref={svgRef}
            className="w-full flex justify-center items-center"
            style={{ aspectRatio: `${ANCHO_SVG} / ${ALTO_SVG}`, maxHeight: "600px", overflow: "hidden" }}
          />
        </div>
      </div>
    </div>
  );
}
