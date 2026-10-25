// Contrato visual de las fichas turísticas futuras (destinos, atractivos y localidades).
//
// Solo tipos: no lee ni publica el Google Sheets maestro. PR17 prepara su revisión privada offline.
// Los componentes de components/destinos/ reciben estas formas, así una ficha del maestro se
// conecta escribiendo un adaptador, sin rediseñar la página. Reglas:
// - id es el identificador estable del maestro tal como esté registrado: nunca se deriva del slug
//   ni del nombre, y no cambia si cambia el título.
// - las relaciones se expresan por id (provinciaSlug, localidadId, fuenteIds), no por texto.
// - toda afirmación verificable cita fuenteIds; las fechas son AAAA-MM-DD.
// - referenciasMaestro se completa solo con una conciliación autorizada (ver lib/pages/trips.ts,
//   editorial.origin.masterRefs).

export type IdEstable = string;

export interface ReferenciaMaestro {
  hoja: string;
  idOriginal: string;
}

export interface FuenteOficial {
  id: IdEstable;
  titulo: string;
  url: string;
  organismo?: string;
  consultadaEl: string;
  publicadaEl?: string;
}

export interface CreditoFoto {
  titular: string;
  licencia: string;
  urlLicencia: string;
}

// Variantes locales ya optimizadas (sin transformación en tiempo de ejecución).
export interface Foto {
  src: string;
  alt: string;
  ancho: number;
  alto: number;
  variantes: { src: string; ancho: number }[];
  leyenda?: string;
  credito: CreditoFoto;
}

export interface Localidad {
  id: IdEstable;
  nombre: string;
  provinciaSlug: string;
  fuenteIds: IdEstable[];
}

export type TipoAtractivo = "naturaleza" | "cultura" | "patrimonio" | "actividad" | "gastronomia";

export interface Atractivo {
  id: IdEstable;
  nombre: string;
  tipo: TipoAtractivo;
  descripcion: string;
  localidadId?: IdEstable;
  foto?: Foto;
  mapaUrl?: string;
  fuenteIds: IdEstable[];
}

export interface DatoPractico {
  id: IdEstable;
  etiqueta: string;
  valor: string;
  fuenteIds: IdEstable[];
  verificadoEl?: string;
}

// Mapas como enlaces a búsquedas o coordenadas públicas: sin iframes ni scripts de terceros.
export interface UbicacionMapa {
  id: IdEstable;
  etiqueta: string;
  descripcion: string;
  mapaUrl: string;
  fuenteIds: IdEstable[];
}

export interface Destino {
  id: IdEstable;
  slug: string;
  nombre: string;
  provinciaSlugs: string[];
  resumen: string;
  localidades: Localidad[];
  atractivos: Atractivo[];
  practicos: DatoPractico[];
  ubicaciones: UbicacionMapa[];
  fotos: Foto[];
  fuentes: FuenteOficial[];
  referenciasMaestro: ReferenciaMaestro[];
}
