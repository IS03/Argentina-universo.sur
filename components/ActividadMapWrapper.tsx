"use client";

import dynamic from "next/dynamic";

const ActividadMap = dynamic(() => import("@/components/ActividadMap"), {
  ssr: false,
});

interface ActividadMapWrapperProps {
  lat: number;
  lon: number;
  actividad: string;
  localizacion: string;
}

export default function ActividadMapWrapper({
  lat,
  lon,
  actividad,
  localizacion,
}: ActividadMapWrapperProps) {
  return <ActividadMap lat={lat} lon={lon} actividad={actividad} localizacion={localizacion} />;
}
