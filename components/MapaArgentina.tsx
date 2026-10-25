"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { regionDeProvincia } from "@/lib/regiones";

interface MapaArgentinaProps {
  // Solo nombre y slug: el mapa no necesita descripciones ni fotos en el navegador.
  provincias: { provincia: string; slug: string }[];
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

// Cada provincia se pinta con el color de su región. El realce de hover y foco es CSS
// (.mapa-provincias en globals.css): mover el puntero no vuelve a renderizar React.
export default function MapaArgentina({ provincias }: MapaArgentinaProps) {
  const router = useRouter();
  const [senalada, setSenalada] = useState<string | null>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = svgRef.current;
    if (!container || container.children.length > 0) return;
    let isMounted = true;
    const porId = new Map(provincias.map(p => [SLUG_TO_SVG_ID[p.slug], p]));

    fetch("/argentina.svg")
      .then((res) => res.text())
      .then((text) => {
        if (!isMounted || container.children.length > 0) return;
        const svgElement = new DOMParser().parseFromString(text, "image/svg+xml").querySelector("svg");
        if (!svgElement) return;
        const clonedSvg = svgElement.cloneNode(true) as SVGElement;
        clonedSvg.removeAttribute("width");
        clonedSvg.removeAttribute("height");
        if (!clonedSvg.getAttribute("viewBox")) clonedSvg.setAttribute("viewBox", `0 0 ${ANCHO_SVG} ${ALTO_SVG}`);
        clonedSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        clonedSvg.setAttribute("class", "mapa-provincias h-full w-full");

        for (const path of clonedSvg.querySelectorAll("path")) {
          const provincia = porId.get(path.getAttribute("id") ?? "");
          if (!provincia) {
            path.style.display = "none";
            continue;
          }
          path.removeAttribute("title");
          path.setAttribute("class", regionDeProvincia(provincia.slug)?.relleno ?? "fill-arena-400");
          // Cada provincia es un enlace accesible con teclado (Tab, Enter o Espacio).
          path.setAttribute("tabindex", "0");
          path.setAttribute("role", "link");
          path.setAttribute("aria-label", `Ver turismo en ${provincia.provincia}`);
          const ir = () => router.push(`/provincias/${provincia.slug}`);
          path.addEventListener("mouseenter", () => setSenalada(provincia.provincia));
          path.addEventListener("focus", () => setSenalada(provincia.provincia));
          path.addEventListener("mouseleave", () => setSenalada(null));
          path.addEventListener("blur", () => setSenalada(null));
          path.addEventListener("click", ir);
          path.addEventListener("keydown", (e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            ir();
          });
        }
        clonedSvg.setAttribute("role", "group");
        clonedSvg.setAttribute("aria-label", "Mapa de provincias de Argentina");
        container.appendChild(clonedSvg);
      })
      .catch((err) => console.error("Error cargando SVG:", err));

    return () => {
      isMounted = false;
      container.replaceChildren();
    };
  }, [provincias, router]);

  return (
    <figure className="relative">
      {/* El SVG llega por fetch después de hidratar: el contenedor ya reserva su alto y el
          contenido siguiente no se desplaza (CLS). */}
      <div
        ref={svgRef}
        className="mx-auto h-[24rem] w-full sm:h-[32rem] lg:h-[36rem]"
        style={{ maxWidth: `calc(36rem * ${ANCHO_SVG} / ${ALTO_SVG})` }}
      />
      <figcaption className="mt-3 min-h-6 text-center text-sm text-tinta-700" aria-hidden="true">
        {senalada ?? "Tocá una provincia para ver su ficha"}
      </figcaption>
    </figure>
  );
}
