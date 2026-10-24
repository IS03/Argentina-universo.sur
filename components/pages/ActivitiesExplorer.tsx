"use client";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import ActividadCard from "@/components/ActividadCard";
import {
  filtrarActividades,
  TODAS_LAS_PROVINCIAS,
  type ActividadResumen,
  type Provincia,
} from "@/lib/catalog";
const subscribe = () => () => {};
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
  return (
    <>
      <label htmlFor="provincia-filtro" className="block mb-3 text-[#5A4E3D]">
        Filtrar por provincia
      </label>
      <select
        id="provincia-filtro"
        value={seleccionInicial}
        data-hidratado={ready ? "" : undefined}
        onChange={(e) =>
          router.push(
            path(e.target.value) +
              (e.target.value === "todas"
                ? ""
                : "?provincia=" + e.target.value),
          )
        }
        className="p-4 mb-6 bg-[#F5F1E8] text-[#5A4E3D] border rounded"
      >
        <option value="todas">Todas las provincias</option>
        {provincias.map((p) => (
          <option key={p.slug} value={p.slug}>
            {p.provincia}
          </option>
        ))}
      </select>
      <nav
        aria-label="Actividades por provincia"
        className="flex flex-wrap gap-3 mb-10 text-[#5A4E3D]"
      >
        <Link href="/actividades" prefetch={false}>
          Todas
        </Link>
        {provincias.map((p) => (
          <Link
            key={p.slug}
            prefetch={false}
            href={path(p.slug)}
            aria-current={p.slug === seleccionInicial ? "page" : undefined}
            className="underline"
          >
            {p.provincia}
          </Link>
        ))}
      </nav>
      <noscript>
        <p>
          Elegí una provincia mediante los enlaces. Las páginas de cada
          provincia funcionan sin JavaScript.
        </p>
      </noscript>
      <section aria-labelledby="actividades-por-provincia-heading">
        <h2
          id="actividades-por-provincia-heading"
          className="text-3xl mb-6 text-[#5A4E3D]"
        >
          Actividades por provincia
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {filtrarActividades(actividades, seleccionInicial).map((a) => (
            <ActividadCard key={a.actividadSlug} actividad={a} />
          ))}
        </div>
        {filtrarActividades(actividades, seleccionInicial).length === 0 && (
          <p>No se encontraron actividades para la provincia seleccionada.</p>
        )}
      </section>
    </>
  );
}
