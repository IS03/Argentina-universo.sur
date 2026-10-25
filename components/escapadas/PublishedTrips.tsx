import Link from "next/link";
import type { PublishedTrip } from "@/lib/pages/trips";
import { regionDeProvincia } from "@/lib/regiones";
import Icono from "@/components/ui/Icono";

// Fichas HTML aprobadas. Hoy no hay ninguna: la sección no se renderiza.
export default function PublishedTrips({ trips }: { trips: PublishedTrip[] }) {
  if (!trips.length) return null;
  return (
    <section aria-labelledby="escapadas-html-heading" className="mb-14">
      <p className="antetitulo text-terracota-600">Fichas completas</p>
      <h2 id="escapadas-html-heading" className="mt-1 mb-6 font-display text-seccion text-tinta-900">Destinos para descubrir</h2>
      <ul className="grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {trips.map(trip => {
          const region = regionDeProvincia(trip.geography?.provinceSlugs[0] ?? "");
          return (
            <li key={trip.id}>
              {/* Enlace extendido: toda la tarjeta es clicable, pero el nombre accesible es solo el título. */}
              <article className="group relative flex h-full flex-col rounded-tarjeta border border-arena-300/80 bg-white p-5 shadow-tarjeta transition-shadow hover:shadow-elevada">
                <p className={`antetitulo ${region?.texto ?? "text-terracota-600"}`}>{trip.province}</p>
                <h3 className="mt-1 font-display text-[1.75rem] leading-tight text-tinta-900">
                  <Link href={`/escapadas/${trip.slug}`} prefetch={false} className="after:absolute after:inset-0 after:rounded-tarjeta group-hover:text-lago-700">
                    {trip.title}
                  </Link>
                </h3>
                <p className="mt-2 line-clamp-3 text-tinta-700">{trip.description}</p>
                <span aria-hidden="true" className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-lago-600">
                  Leer la escapada <Icono nombre="flecha" className="size-4" />
                </span>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
