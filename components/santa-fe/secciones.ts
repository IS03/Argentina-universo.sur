import type { NombreIcono } from "@/components/ui/Icono";

export type IdSeccionSantaFe = "resumen" | "planes" | "eventos" | "oficinas" | "agencias" | "noticias" | "preguntas-frecuentes";

// Única lista de secciones de Santa Fe: la usan la navegación por chips y la grilla de la provincia.
export const SECCIONES_SANTA_FE: { id: IdSeccionSantaFe; etiqueta: string; href: string; icono: NombreIcono }[] = [
  { id: "resumen", etiqueta: "Santa Fe", href: "/provincias/santa_fe", icono: "casa" },
  { id: "planes", etiqueta: "Planes e ideas", href: "/provincias/santa_fe/planes", icono: "idea" },
  { id: "eventos", etiqueta: "Eventos", href: "/provincias/santa_fe/eventos", icono: "calendario" },
  { id: "oficinas", etiqueta: "Oficinas de información", href: "/provincias/santa_fe/oficinas", icono: "pin" },
  { id: "agencias", etiqueta: "Agencias de viajes", href: "/provincias/santa_fe/agencias", icono: "maleta" },
  { id: "noticias", etiqueta: "Noticias", href: "/provincias/santa_fe/noticias", icono: "noticia" },
  { id: "preguntas-frecuentes", etiqueta: "Preguntas frecuentes", href: "/provincias/santa_fe#preguntas-frecuentes", icono: "pregunta" },
];
