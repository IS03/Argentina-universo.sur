"use client";

import { useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ICONO_MARCADOR, ICONO_MARCADOR_2X, SOMBRA_MARCADOR } from "@/components/mapa/iconos";
import { URL_TESELAS, ZOOM_MAPA } from "@/lib/mapa-teselas";

const icono = L.icon({
  iconUrl: ICONO_MARCADOR,
  iconRetinaUrl: ICONO_MARCADOR_2X,
  shadowUrl: SOMBRA_MARCADOR,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapaLeafletProps {
  lat: number;
  lon: number;
  titulo: string;
  detalle?: string;
  onListo: () => void;
}

export default function MapaLeaflet({ lat, lon, titulo, detalle, onListo }: MapaLeafletProps) {
  const mapaRef = useRef<L.Map | null>(null);
  const listo = useRef(false);
  // Sin animaciones de zoom ni fundidos si la persona pidió movimiento reducido.
  const [animar] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // Se monta encima de la vista previa con fondo transparente; cuando sus teselas cargaron,
  // la vista previa se retira y el foco pasa al mapa para usar flechas y +/−.
  const alCargarTeselas = () => {
    if (listo.current) return;
    listo.current = true;
    onListo();
    mapaRef.current?.getContainer().focus({ preventScroll: true });
  };

  return (
    <MapContainer
      ref={mapa => {
        mapaRef.current = mapa;
        mapa?.getContainer().setAttribute("aria-label", `Mapa interactivo: ${titulo}. Usá las flechas para desplazarte y las teclas + y − para acercar o alejar.`);
      }}
      center={[lat, lon]}
      zoom={ZOOM_MAPA}
      scrollWheelZoom={false}
      zoomControl={false}
      zoomAnimation={animar}
      fadeAnimation={animar}
      markerZoomAnimation={animar}
      className="absolute inset-0"
      style={{ background: "transparent" }}
    >
      <ZoomControl position="topleft" zoomInTitle="Acercar" zoomOutTitle="Alejar" />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={URL_TESELAS}
        eventHandlers={{ load: alCargarTeselas }}
      />
      <Marker position={[lat, lon]} icon={icono} alt={titulo} title={titulo}>
        <Popup>
          <div>
            <strong>{titulo}</strong>
            {detalle && (
              <>
                <br />
                {detalle}
              </>
            )}
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
