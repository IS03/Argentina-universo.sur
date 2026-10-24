import type { StaticImageData } from "next/image";
import marcador from "leaflet/dist/images/marker-icon.png";
import marcador2x from "leaflet/dist/images/marker-icon-2x.png";
import sombra from "leaflet/dist/images/marker-shadow.png";

// Íconos de Leaflet servidos por el propio sitio (antes, desde unpkg.com: un origen externo más).
// Turbopack resuelve los PNG de node_modules como URL y los del proyecto como StaticImageData.
const url = (imagen: string | StaticImageData) => (typeof imagen === "string" ? imagen : imagen.src);

export const ICONO_MARCADOR = url(marcador);
export const ICONO_MARCADOR_2X = url(marcador2x);
export const SOMBRA_MARCADOR = url(sombra);
