import type { Foto, FuenteOficial, DatoPractico, UbicacionMapa, TipoAtractivo } from './modelo.ts';

// Tourist presentation only. Original research IDs, decisions and evidence remain outside this shape.
export interface EditorialParagraph { text: string; sourceIds: string[] }
export interface EditorialPhoto {
  foto: Foto;
  originalTitle: string;
  sourcePage: string;
  modifications: string;
}
export interface EditorialDestinationPage {
  id: string;
  slug: string;
  nombre: string;
  title: string;
  provinceLabel: string;
  provinceSlugs: string[];
  resumen: string;
  leadSourceIds: string[];
  introduction: EditorialParagraph[];
  sections: { id: string; title: string; paragraphs: EditorialParagraph[] }[];
  attractions: { id: string; nombre: string; tipo: TipoAtractivo; paragraphs: EditorialParagraph[] }[];
  practical: DatoPractico[];
  locations: UbicacionMapa[];
  photos: EditorialPhoto[];
  sources: FuenteOficial[];
  related: { href: string; label: string }[];
  checkedAt: string;
  seo: { title: string; description: string; proposedCanonical: string };
}
