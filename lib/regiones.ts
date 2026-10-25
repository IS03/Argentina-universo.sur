import { REGIONES, REGION_POR_PROVINCIA, createSlug } from "./catalog.ts";

// Presentación de las seis regiones turísticas del catálogo (lib/catalog.ts define cuáles son).
// Las clases van completas para que Tailwind las detecte; el color de cada región supera 4,5:1
// como texto sobre arena-50 y como fondo de texto blanco.
export interface RegionVisual {
  nombre: string;
  ancla: string;
  lema: string;
  texto: string;
  fondo: string;
  borde: string;
  relleno: string;
}

const VISUAL: Record<string, Omit<RegionVisual, "nombre" | "ancla">> = {
  Norte: { lema: "Quebradas, puna y pueblos andinos", texto: "text-region-norte", fondo: "bg-region-norte", borde: "border-region-norte", relleno: "fill-region-norte" },
  Litoral: { lema: "Ríos, selva y esteros", texto: "text-region-litoral", fondo: "bg-region-litoral", borde: "border-region-litoral", relleno: "fill-region-litoral" },
  Centro: { lema: "Sierras, valles y estancias", texto: "text-region-centro", fondo: "bg-region-centro", borde: "border-region-centro", relleno: "fill-region-centro" },
  Cuyo: { lema: "Viñedos, cordillera y desierto", texto: "text-region-cuyo", fondo: "bg-region-cuyo", borde: "border-region-cuyo", relleno: "fill-region-cuyo" },
  "Buenos Aires": { lema: "Ciudad, llanura y costa atlántica", texto: "text-region-buenos-aires", fondo: "bg-region-buenos-aires", borde: "border-region-buenos-aires", relleno: "fill-region-buenos-aires" },
  Patagonia: { lema: "Lagos, glaciares, estepa y mar", texto: "text-region-patagonia", fondo: "bg-region-patagonia", borde: "border-region-patagonia", relleno: "fill-region-patagonia" },
};

export function anclaRegion(nombre: string): string {
  return "region-" + createSlug(nombre);
}

export const REGIONES_VISUALES: RegionVisual[] = REGIONES.map(nombre => ({ nombre, ancla: anclaRegion(nombre), ...VISUAL[nombre] }));

export function regionVisual(nombre: string): RegionVisual | undefined {
  return REGIONES_VISUALES.find(region => region.nombre === nombre);
}

export function regionDeProvincia(slug: string): RegionVisual | undefined {
  return regionVisual(REGION_POR_PROVINCIA[slug]);
}

// Agrupa respetando el orden de REGIONES y, dentro de cada región, el orden recibido.
export function agruparPorRegion<T>(items: T[], region: (item: T) => string): { region: RegionVisual; items: T[] }[] {
  return REGIONES_VISUALES
    .map(visual => ({ region: visual, items: items.filter(item => region(item) === visual.nombre) }))
    .filter(grupo => grupo.items.length > 0);
}
