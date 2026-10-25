import Link from "next/link";
import Image from "next/image";
import type { ProvinciaResumen } from "@/lib/catalog";
import { regionDeProvincia } from "@/lib/regiones";
import { SIZES_TARJETAS } from "@/components/ui/grillas";
import Icono from "@/components/ui/Icono";

interface ProvinciaCardProps {
  provincia: ProvinciaResumen;
  // Debe describir la grilla real en la que se muestra la tarjeta (ver components/ui/grillas.ts).
  sizes?: string;
  destacada?: boolean;
}

export default function ProvinciaCard({ provincia, sizes = SIZES_TARJETAS, destacada = false }: ProvinciaCardProps) {
  const imagenPortada = provincia.fotos[0] || "/img/logopng.png";
  const region = regionDeProvincia(provincia.slug);

  return (
    // Sin prefetch: una grilla de 24 tarjetas precargaría 24 rutas en cada visita.
    <Link
      prefetch={false}
      href={`/provincias/${provincia.slug}`}
      aria-label={`Ver turismo y destinos en ${provincia.provincia}`}
      className="group relative block overflow-hidden rounded-tarjeta bg-tinta-900 shadow-tarjeta transition-shadow duration-300 hover:shadow-elevada"
    >
      <div className={`relative w-full ${destacada ? "aspect-[4/3] sm:aspect-[3/4]" : "aspect-[4/5]"}`}>
        <Image
          src={imagenPortada}
          alt={`Paisaje de ${provincia.provincia} - Turismo Argentina Universo Sur`}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-500 ease-suave group-hover:scale-[1.04] motion-reduce:transition-none"
        />
        {/* Degradado solo en la base: el nombre siempre se lee, la foto queda limpia arriba. */}
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-tinta-900/90 via-tinta-900/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:p-4">
          <div className="min-w-0">
            {region && <p className="antetitulo text-[0.625rem] text-arena-200 sm:text-xs">{region.nombre}</p>}
            <h3 className={`mt-0.5 font-display leading-tight text-white ${destacada ? "text-3xl" : "text-xl sm:text-2xl"}`}>
              {provincia.provincia}
            </h3>
          </div>
          <span className="mb-1 hidden size-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition-colors group-hover:bg-white group-hover:text-tinta-900 sm:flex">
            <Icono nombre="flecha" className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
