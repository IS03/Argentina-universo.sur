import Link from "next/link";
import type { PublishedTrip } from "@/lib/pages/trips";

export default function PublishedTrips({ trips }: { trips: PublishedTrip[] }) {
  if (!trips.length) return null;
  return (
    <section aria-labelledby="escapadas-html-heading" className="mb-12">
      <h2 id="escapadas-html-heading" className="text-2xl font-semibold mb-6 text-[#5A4E3D]">Destinos para descubrir</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {trips.map(trip => (
          <article key={trip.id} className="rounded-lg border border-[#C9B99B] p-6 text-[#5A4E3D]">
            <p className="text-sm mb-2">{trip.province}</p>
            <h3 className="text-xl font-semibold mb-3"><Link href={`/escapadas/${trip.slug}`} prefetch={false} className="underline">{trip.title}</Link></h3>
            <p>{trip.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
