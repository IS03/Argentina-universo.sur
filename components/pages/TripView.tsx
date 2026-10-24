import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { tripPublishable, type Trip } from "@/lib/pages/trips";
export default function TripView({ trip }: { trip: Trip }) {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto pt-32 pb-16 px-6 text-[#5A4E3D]">
        {!tripPublishable(trip) && (
          <p className="border rounded p-4 mb-8">
            Borrador para revisión humana. La redacción de esta ficha nueva cuenta con autorización de publicación; la revisión final del texto se realiza en el PR.
          </p>
        )}
        <h1 className="text-4xl font-semibold mb-5">{trip.title}</h1>
        <p>
          {trip.destination} · {trip.province}
        </p>
        <p className="mt-4 text-lg">{trip.description}</p>
        {trip.sections.map((s) => (
          <section key={s.title} className="mt-8">
            <h2 className="text-2xl font-semibold mb-3">{s.title}</h2>
            {s.paragraphs.map((p) => (
              <p key={p} className="mb-4 leading-relaxed">
                {p}
              </p>
            ))}
            <p className="text-sm">
              Fuentes:{" "}
              {s.sourceIds
                .map(
                  (id) =>
                    trip.sources.find((source) => source.id === id)?.title,
                )
                .join(" · ")}
            </p>
          </section>
        ))}
        <section className="mt-8">
          <h2 className="text-2xl mb-3">Ubicación y mapa</h2>
          <p>{trip.address}</p>
          <a className="underline" href={trip.mapUrl} rel="noreferrer">
            Buscar el parque en OpenStreetMap
          </a>
          <p>
            La búsqueda del mapa es orientativa; confirmá el acceso con Parques
            Nacionales.
          </p>
        </section>
        <section className="mt-8">
          <h2 className="text-2xl mb-3">Fuentes y verificación</h2>
          <ul>
            {trip.sources.map((s) => (
              <li key={s.id}>
                <a className="underline" href={s.url} rel="noreferrer">
                  {s.title}
                </a>{" "}
                · consultada el {s.checkedAt}
              </li>
            ))}
          </ul>
          <p className="mt-4">
            Redacción original para Argentina Universo Sur. No se transcribió la
            guía PDF. No se incorporan fotografías sin derechos documentados.
          </p>
        </section>
        <nav
          aria-label="Contenido relacionado"
          className="flex flex-wrap gap-4 mt-8"
        >
          {trip.related.map((l) => (
            <a href={l.href} key={l.href} className="underline">
              {l.label}
            </a>
          ))}
        </nav>
      </main>
      <Footer />
    </>
  );
}
