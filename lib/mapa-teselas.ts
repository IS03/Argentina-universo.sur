/**
 * Vista previa estática de un mapa Leaflet. El servidor calcula las mismas teselas de
 * OpenStreetMap que pedirá Leaflet para centro y zoom dados y las coloca en el HTML, de modo
 * que el mapa ocupa su espacio y se ve desde el primer pintado, sin esperar el JavaScript.
 *
 * El ancho del contenedor no se conoce en el servidor: cada tesela se posiciona respecto del
 * centro (calc(50% ± n px)), así la vista previa coincide con Leaflet en cualquier ancho.
 */

export const TAMANO_TESELA = 256;
export const ZOOM_MAPA = 13;
export const ALTO_MAPA = 384; // h-96
// URL recomendada por OSM (sin subdominios a/b/c). Leaflet usa la misma: reaprovecha la caché.
export const URL_TESELAS = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
// Los contenedores llegan a 1216 px de ancho (max-w-7xl): se cubren ±640 px desde el centro.
const MEDIO_ANCHO_MAXIMO = 640;
// Una tesela a d px del centro solo se ve si el contenedor (más angosto que la ventana) mide
// más de 2·d. Se agrupa en estos anchos de ventana, redondeando hacia abajo: nunca falta una
// tesela visible y un móvil no descarga las de escritorio. Las de 0 se ven en cualquier ancho.
export const ANCHOS_MINIMOS = [0, 420, 520, 640, 768, 900, 1024, 1280] as const;
export type AnchoMinimo = (typeof ANCHOS_MINIMOS)[number];

export interface Tesela {
  url: string;
  /** Desplazamiento del borde izquierdo respecto del centro horizontal del contenedor. */
  dx: number;
  /** Desplazamiento del borde superior respecto del centro vertical del contenedor. */
  dy: number;
  /** Ancho de ventana desde el que la tesela puede verse. */
  anchoMinimo: AnchoMinimo;
}

// Proyección Web Mercator (EPSG:3857), la misma de L.CRS.EPSG3857.
export function proyectar(lat: number, lon: number, zoom: number) {
  const escala = TAMANO_TESELA * 2 ** zoom;
  const sen = Math.sin((Math.max(Math.min(lat, 85.0511287798), -85.0511287798) * Math.PI) / 180);
  return {
    x: ((lon + 180) / 360) * escala,
    y: (0.5 - Math.log((1 + sen) / (1 - sen)) / (4 * Math.PI)) * escala,
  };
}

export function teselasVistaPrevia(lat: number, lon: number, zoom = ZOOM_MAPA, alto = ALTO_MAPA): Tesela[] {
  const centro = proyectar(lat, lon, zoom);
  const indice = (px: number) => Math.floor(px / TAMANO_TESELA);
  const teselas: Tesela[] = [];
  for (let ty = indice(centro.y - alto / 2); ty <= indice(centro.y + alto / 2); ty++) {
    for (let tx = indice(centro.x - MEDIO_ANCHO_MAXIMO); tx <= indice(centro.x + MEDIO_ANCHO_MAXIMO); tx++) {
      const izquierda = tx * TAMANO_TESELA - centro.x;
      const distancia = Math.max(0, izquierda, -(izquierda + TAMANO_TESELA));
      teselas.push({
        url: URL_TESELAS.replace("{z}", String(zoom)).replace("{x}", String(tx)).replace("{y}", String(ty)),
        dx: Math.round(izquierda * 100) / 100,
        dy: Math.round((ty * TAMANO_TESELA - centro.y) * 100) / 100,
        anchoMinimo: ANCHOS_MINIMOS.findLast(ancho => ancho <= 2 * distancia) ?? 0,
      });
    }
  }
  return teselas;
}
