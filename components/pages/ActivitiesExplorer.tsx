"use client";
import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import FiltroProvincias from "@/components/actividades/FiltroProvincias";
import GrillaActividades from "@/components/actividades/GrillaActividades";
import {
  filtrarActividades,
  TODAS_LAS_PROVINCIAS,
  type ActividadResumen,
  type Provincia,
} from "@/lib/catalog";
const subscribe = () => () => {};
// Export estático (Cloudflare Pages): cada provincia es una página HTML propia. El select navega
// y los chips son enlaces comunes, así el filtro funciona también sin JavaScript.
export default function ActivitiesExplorer({
  actividades,
  provincias,
  seleccionInicial,
}: {
  actividades: ActividadResumen[];
  provincias: Pick<Provincia, "slug" | "provincia">[];
  seleccionInicial: string;
}) {
  const router = useRouter();
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const path = (slug: string) =>
    slug === TODAS_LAS_PROVINCIAS
      ? "/actividades"
      : `/actividades/por-provincia/${slug}`;
  const filtradas = filtrarActividades(actividades, seleccionInicial);
  return (
    <>
      <FiltroProvincias
        provincias={provincias}
        seleccion={seleccionInicial}
        cantidad={filtradas.length}
        hrefDe={path}
        onElegir={(slug) =>
          router.push(
            path(slug) +
              (slug === TODAS_LAS_PROVINCIAS ? "" : "?provincia=" + slug),
          )
        }
        hidratado={ready}
      />
      <GrillaActividades actividades={filtradas} />
    </>
  );
}
