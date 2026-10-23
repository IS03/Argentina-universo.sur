"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import ProvinciaCard from "@/components/ProvinciaCard";
import ActividadCard from "@/components/ActividadCard";
import type { ProvinciaResumen, ActividadResumen } from "@/lib/catalog";
import { resolverVisitasRecientes, CLAVE_PROVINCIAS_VISITADAS, CLAVE_ACTIVIDADES_VISITADAS, URL_CATALOGO_RESUMEN } from "@/lib/recent-visits";

interface CatalogoResumen {
  provincias: ProvinciaResumen[];
  actividades: ActividadResumen[];
}

function suscribir(avisar: () => void) {
  window.addEventListener("storage", avisar);
  return () => window.removeEventListener("storage", avisar);
}

function leer(clave: string) {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null; // Almacenamiento bloqueado por el navegador.
  }
}

const sinHistorial = () => null;

// El historial vive en localStorage: el servidor no lo conoce, así que la sección aparece
// después de hidratar, como antes. Quien no tiene historial no descarga nada; quien lo tiene
// pide un resumen estático del catálogo en lugar de los JSON completos.
export default function ContinuarExplorando() {
  const provinciasJson = useSyncExternalStore(suscribir, () => leer(CLAVE_PROVINCIAS_VISITADAS), sinHistorial);
  const actividadesJson = useSyncExternalStore(suscribir, () => leer(CLAVE_ACTIVIDADES_VISITADAS), sinHistorial);
  const hayHistorial = Boolean(provinciasJson || actividadesJson);
  const [catalogo, setCatalogo] = useState<CatalogoResumen | null>(null);

  useEffect(() => {
    if (!hayHistorial || catalogo) return;
    let cancelado = false;
    fetch(URL_CATALOGO_RESUMEN)
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
      .then((data: CatalogoResumen) => { if (!cancelado) setCatalogo(data); })
      .catch(error => console.error("Error al cargar contenido:", error));
    return () => { cancelado = true; };
  }, [hayHistorial, catalogo]);

  const contenidoVisitado = useMemo(
    () => catalogo ? resolverVisitasRecientes(provinciasJson, actividadesJson, catalogo.provincias, catalogo.actividades) : [],
    [provinciasJson, actividadesJson, catalogo],
  );

  if (contenidoVisitado.length === 0) return null;

  return (
    <section className="relative bg-[#F5F1E8] py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 sm:mb-12 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold uppercase tracking-widest mb-4 text-[#5A4E3D]">
            Continuar explorando
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {contenidoVisitado.map((item, index) => item.tipo === "provincia" ? (
            <ProvinciaCard key={`provincia-${item.data.slug}-${index}`} provincia={item.data} />
          ) : (
            <ActividadCard key={`actividad-${item.data.actividadSlug}-${index}`} actividad={item.data} />
          ))}
        </div>
      </div>
    </section>
  );
}
