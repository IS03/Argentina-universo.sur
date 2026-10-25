"use client";

import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import FiltroProvincias, { type ProvinciaOpcion } from "@/components/actividades/FiltroProvincias";
import GrillaActividades from "@/components/actividades/GrillaActividades";
import { filtrarActividades, TODAS_LAS_PROVINCIAS } from "@/lib/catalog";
import type { ActividadResumen } from "@/lib/catalog";
import { ROUTES, seleccionDesdeParametro } from "@/lib/site-links";

interface ActividadesExplorerProps {
  actividades: ActividadResumen[];
  provincias: ProvinciaOpcion[];
  // Viene del servidor: el HTML ya llega filtrado (ver ACTIVIDADES_FILTRO_REWRITES).
  seleccionInicial: string;
}

const sinSuscripcion = () => () => {};

// Avisa cuando cambia ?provincia (atrás/adelante restauran el árbol cacheado de otra variante).
// Va en su propio Suspense: useSearchParams no puede prerenderizarse y así no arrastra a la grilla.
function SincronizarUrl({ onCambio }: { onCambio: (provincia: string) => void }) {
  const provincia = seleccionDesdeParametro(useSearchParams().get("provincia"));
  useLayoutEffect(() => onCambio(provincia), [provincia, onCambio]);
  return null;
}

// Filtra en memoria, sin pedir datos. La URL se actualiza con replaceState: el filtro se puede
// compartir y recargar sin navegar.
export default function ActividadesExplorer({ actividades, provincias, seleccionInicial }: ActividadesExplorerProps) {
  const [seleccion, setSeleccion] = useState(seleccionInicial);
  const selectRef = useRef<HTMLSelectElement>(null);
  // false en el HTML y durante la hidratación; true después. Lo usan las pruebas E2E.
  const hidratado = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  // true si este montaje hidrató HTML del servidor; false si React lo creó en el navegador.
  const [vinoDelServidor] = useState(!hidratado);
  const escritasEnUrl = useRef<string[]>([]);
  const reportesUrl = useRef(0);

  const seleccionar = (provincia: string) => {
    setSeleccion(provincia);
    escritasEnUrl.current.push(provincia);
    const params = new URLSearchParams(window.location.search);
    if (provincia === TODAS_LAS_PROVINCIAS) params.delete("provincia");
    else params.set("provincia", provincia);
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  };
  const seleccionarRef = useRef(seleccionar);

  const alCambiarUrl = useCallback((provincia: string) => {
    // Al hidratar, el HTML ya corresponde a la URL: el primer aviso no aporta nada.
    if (reportesUrl.current++ === 0 && vinoDelServidor) return;
    // Eco de un replaceState propio: ya está aplicado (y quizá superado por otro más nuevo).
    const propia = escritasEnUrl.current.indexOf(provincia);
    if (propia !== -1) {
      escritasEnUrl.current.splice(0, propia + 1);
      return;
    }
    setSeleccion(provincia);
  }, [vinoDelServidor]);

  useEffect(() => {
    // Si el usuario cambió el select antes de hidratar, React no reescribe su valor ni repite
    // el evento: la elección queda en el DOM y se adopta aquí. La referencia es la opción que el
    // servidor marcó como seleccionada (o la primera, si el valor inicial no tiene opción).
    const select = selectRef.current;
    if (!vinoDelServidor || !select) return;
    const opciones = [...select.options];
    const valorServidor = (opciones.find(o => o.defaultSelected) ?? opciones[0])?.value;
    if (select.value !== valorServidor) seleccionarRef.current(select.value);
  }, [vinoDelServidor]);

  const actividadesFiltradas = filtrarActividades(actividades, seleccion);

  return (
    <>
      <Suspense fallback={null}>
        <SincronizarUrl onCambio={alCambiarUrl} />
      </Suspense>

      <FiltroProvincias
        provincias={provincias}
        seleccion={seleccion}
        cantidad={actividadesFiltradas.length}
        hrefDe={slug => slug === TODAS_LAS_PROVINCIAS ? ROUTES.actividades : ROUTES.actividadesPorProvincia(slug)}
        onElegir={seleccionar}
        interceptarChips
        selectRef={selectRef}
        hidratado={hidratado}
      />
      <GrillaActividades actividades={actividadesFiltradas} />
    </>
  );
}
