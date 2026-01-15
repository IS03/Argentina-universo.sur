"use client";

import { useRouter } from "next/navigation";
import { Provincia } from "@/lib/data";
import { useState, useEffect, useRef, useMemo } from "react";

interface MapaArgentinaProps {
  provincias: Provincia[];
  zonaActiva: string;
}

// Mapeo de slugs a IDs del SVG (formato AR-X)
const SLUG_TO_SVG_ID: Record<string, string> = {
  buenos_aires: "AR-B",
  caba: "AR-C",
  catarmaca: "AR-K",
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

  const handleProvinciaClick = (slug: string) => {
    router.push(`/provincias/${slug}`);
  };

  // Función helper para obtener provincia por SVG ID
  const getProvinciaBySvgId = (svgId: string): Provincia | undefined => {
    return provincias.find((p) => SLUG_TO_SVG_ID[p.slug] === svgId);
  };

  // Cargar el SVG solo una vez
  useEffect(() => {
    if (!svgRef.current || svgRef.current.children.length > 0) return;

    fetch("/argentina.svg")
      .then((res) => res.text())
      .then((text) => {
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
          clonedSvg.setAttribute("viewBox", "0 0 361.54608 792.57880");
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

          // Aplicar estilos iniciales inmediatamente
          const perteneceZona = zonaActiva === "Todas" || provincia.zona === zonaActiva;
          const opacity = perteneceZona ? 1 : 0.3;
          const fill = perteneceZona ? "#C9B99B" : "#D4C4B0";
          const stroke = perteneceZona ? "#A68B5B" : "#C9B99B";
          const strokeWidth = perteneceZona ? 2 : 1;

          path.setAttribute("fill", fill);
          path.setAttribute("stroke", stroke);
          path.setAttribute("stroke-width", String(strokeWidth));
          path.setAttribute("opacity", String(opacity));
          path.setAttribute("style", `cursor: pointer; transition: all 0.3s ease`);
          path.setAttribute("title", provincia.provincia);

          // Agregar event listeners una sola vez
          path.addEventListener("mouseenter", () => setHoveredSlug(provincia.slug));
          path.addEventListener("mouseleave", () => setHoveredSlug(null));
          path.addEventListener("click", () => handleProvinciaClick(provincia.slug));
        });

        // Agregar el SVG al DOM
        svgRef.current.appendChild(clonedSvg);
      })
      .catch((err) => console.error("Error cargando SVG:", err));
  }, [provincias, zonaActiva]);

  // Actualizar estilos cuando cambia el filtro o el hover
  useEffect(() => {
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
  }, [zonaActiva, hoveredSlug, provincias]);

  return (
    <div className="w-full flex justify-center mb-8">
      <div className="w-full max-w-4xl">
        <div className="bg-gradient-to-br from-[#F5F1E8] to-[#E8DDD0] rounded-xl p-6 shadow-lg border border-[#C9B99B]/30 overflow-hidden">
          <div
            ref={svgRef}
            className="w-full h-auto flex justify-center items-center"
            style={{ maxHeight: "600px", overflow: "hidden" }}
          />
        </div>
      </div>
    </div>
  );
}
