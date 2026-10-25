import Link from "next/link";
import Image from "next/image";
import type { ActividadResumen } from "@/lib/catalog";
import { regionDeProvincia } from "@/lib/regiones";
import { SIZES_ACTIVIDADES, SIZES_TARJETAS } from "@/components/ui/grillas";
import Icono from "@/components/ui/Icono";

interface ActividadCardProps {
  actividad: ActividadResumen;
  // "lista": fila con miniatura en teléfonos y tarjeta desde 640 px (GRILLA_ACTIVIDADES).
  // "tarjeta": siempre tarjeta, para grillas mixtas de dos columnas (GRILLA_TARJETAS).
  variante?: "lista" | "tarjeta";
}

export default function ActividadCard({ actividad, variante = "lista" }: ActividadCardProps) {
  const imagenPortada = actividad.fotos[0] || "/img/logopng.png";
  const region = regionDeProvincia(actividad.slug);
  const lista = variante === "lista";

  return (
    // Sin prefetch: el listado completo tiene 72 tarjetas.
    <Link
      prefetch={false}
      href={`/actividades/${actividad.actividadSlug}`}
      aria-label={`Ver ${actividad.actividad} en ${actividad.localizacion}`}
      className={`group flex h-full overflow-hidden rounded-tarjeta ${lista ? "flex-row sm:flex-col" : "flex-col"} border border-arena-300/80 bg-white shadow-tarjeta transition-[box-shadow,border-color] duration-300 hover:border-arena-400 hover:shadow-elevada`}
    >
      <div className={`relative shrink-0 overflow-hidden bg-arena-200 ${lista ? "w-28 self-stretch sm:aspect-[4/3] sm:w-full" : "aspect-[4/3] w-full"}`}>
        <Image
          src={imagenPortada}
          alt={`${actividad.actividad} en ${actividad.localizacion} - Turismo Argentina`}
          fill
          sizes={lista ? SIZES_ACTIVIDADES : SIZES_TARJETAS}
          className="object-cover transition-transform duration-500 ease-suave group-hover:scale-[1.04] motion-reduce:transition-none"
        />
      </div>
      <div className={`flex min-w-0 flex-1 flex-col gap-1.5 p-3 sm:p-4 ${lista ? "min-h-28" : ""}`}>
        <p className={`antetitulo text-[0.625rem] sm:text-xs ${region?.texto ?? "text-terracota-600"}`}>{actividad.provincia}</p>
        <h3 className="line-clamp-3 text-[0.9375rem] font-semibold leading-snug text-tinta-900 group-hover:text-lago-700 sm:text-lg">
          {actividad.actividad}
        </h3>
        <p className="mt-auto flex items-start gap-1 pt-1 text-xs leading-snug text-tinta-500 sm:text-sm">
          <Icono nombre="pin" className="mt-px size-3.5 sm:size-4" />
          <span className="line-clamp-2">{actividad.localizacion}</span>
        </p>
      </div>
    </Link>
  );
}
