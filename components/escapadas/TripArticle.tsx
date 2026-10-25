import { ROUTES } from "@/lib/site-links";
import type { PublishedTrip, PublicTripPhoto } from "@/lib/pages/trips";

function relatedHref(href: string): string {
  const source = new URL(href, "https://www.argentinauniversosur.com");
  const province = source.searchParams.get("provincia");
  if (source.pathname !== "/actividades" || !province) return href;
  // Pages' shared route adapter selects a prefiltered HTML page; Vercel keeps legacy query URLs.
  const target = new URL(ROUTES.actividadesPorProvincia(province), source.origin);
  for (const [key, value] of source.searchParams) if (key !== "provincia") target.searchParams.append(key, value);
  target.hash = source.hash;
  return target.pathname + target.search + target.hash;
}

function TripPhoto({ photo }: { photo: PublicTripPhoto }) {
  return (
    <figure className="my-8">
      {/* All variants are licensed, prebuilt files. No runtime image transformation or third-party embed. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.src}
        srcSet={photo.variants.map(v => `${v.src} ${v.width}w`).join(", ")}
        sizes="(max-width: 895px) calc(100vw - 48px), 848px"
        width={photo.width}
        height={photo.height}
        alt={photo.alt}
        loading="lazy"
        decoding="async"
        className="w-full h-auto rounded-lg"
      />
      <figcaption className="mt-2 text-sm">
        {photo.caption} · {photo.attribution.holder} ·{" "}
        <a className="underline" href={photo.attribution.licenseUrl} rel="noreferrer">
          {photo.attribution.licenseName}
        </a>
      </figcaption>
    </figure>
  );
}

// This component accepts the public projection only. It never imports the editorial catalog.
export default function TripArticle({ trip }: { trip: PublishedTrip }) {
  const sectionId = (index: number) => "escapada-" + (trip.sections[index].id || `seccion-${index + 1}`);
  const references = (ids: string[]) => (
    <span>
      Fuentes: {ids.map((id, index) => {
        const source = trip.sources.find(source => source.id === id);
        return <span key={id}>{index > 0 ? " · " : ""}<a className="underline" href={`#fuente-${id}`}>{source?.title}</a></span>;
      })}
    </span>
  );
  return (
    <article aria-labelledby="escapada-titulo">
      <header>
        <h1 id="escapada-titulo" className="text-4xl font-semibold mb-5">{trip.title}</h1>
        <p>{trip.destination} · {trip.province}</p>
        {trip.geography && <p className="mt-2">Localidades de referencia: {trip.geography.localities.map(l => l.name).join(" · ")}</p>}
        <p className="mt-4 text-lg leading-relaxed">{trip.description}</p>
        {trip.introductionSourceIds && <p className="mt-2 text-sm">{references(trip.introductionSourceIds)}</p>}
      </header>
      <nav aria-label="En esta escapada" className="my-8">
        <ul className="flex flex-wrap gap-x-6 gap-y-3">
          {trip.sections.map((s, index) => <li key={sectionId(index)}><a className="underline" href={`#${sectionId(index)}`}>{s.title}</a></li>)}
          <li><a className="underline" href="#escapada-ubicacion">Ubicación y mapas</a></li>
          <li><a className="underline" href="#escapada-fuentes">Fuentes y verificación</a></li>
        </ul>
      </nav>
      {trip.photos?.map(photo => <TripPhoto key={photo.src} photo={photo} />)}
      {trip.sections.map((section, index) => (
        <section key={sectionId(index)} aria-labelledby={sectionId(index)} className="mt-8">
          <h2 id={sectionId(index)} className="text-2xl font-semibold mb-3 scroll-mt-28">{section.title}</h2>
          {section.paragraphs.map((paragraph, n) => <p key={n} className="mb-4 leading-relaxed">{paragraph}</p>)}
          {trip.operationalNotices?.filter(notice => notice.sectionId === section.id).map(notice => (
            <aside key={notice.id} aria-label="Estado operativo" className="mb-4 rounded-lg border border-[#C9B99B] p-4">
              <p className="font-semibold">Estado verificado el <time dateTime={notice.verifiedAt}>{notice.verifiedAt}</time></p>
              <p className="mt-1">{notice.text}</p>
              <p className="mt-1 text-sm">{references(notice.sourceIds)}</p>
            </aside>
          ))}
          <p className="text-sm">{references(section.sourceIds)}</p>
        </section>
      ))}
      <section className="mt-8" aria-labelledby="escapada-ubicacion">
        <h2 id="escapada-ubicacion" className="text-2xl font-semibold mb-3 scroll-mt-28">Ubicación y mapas</h2>
        {(trip.locations || [{id: "destino", label: trip.destination, description: trip.address, mapUrl: trip.mapUrl, sourceIds: []}]).map(location => (
          <div key={location.id} className="mb-5">
            <h3 className="text-lg font-semibold">{location.label}</h3>
            <p>{location.description}</p>
            <a className="underline" href={location.mapUrl} rel="noreferrer">Buscar {location.label} en OpenStreetMap</a>
            {location.sourceIds.length > 0 && <p className="text-sm">{references(location.sourceIds)}</p>}
          </div>
        ))}
        <p>Los mapas son referencias de ubicación. Confirmá accesos y condiciones con las fuentes oficiales antes de viajar.</p>
      </section>
      <section className="mt-8" aria-labelledby="escapada-fuentes">
        <h2 id="escapada-fuentes" className="text-2xl font-semibold mb-3 scroll-mt-28">Fuentes y verificación</h2>
        <ul className="space-y-3">
          {trip.sources.map(source => (
            <li key={source.id} id={`fuente-${source.id}`} className="scroll-mt-28">
              <a className="underline" href={source.url} rel="noreferrer">{source.title}</a>{" "}
              · consultada el <time dateTime={source.checkedAt}>{source.checkedAt}</time>
            </li>
          ))}
        </ul>
        <p className="mt-4">Redacción original para Argentina Universo Sur. Los horarios, las tarifas y la disponibilidad deben comprobarse para la fecha de la visita.</p>
      </section>
      <nav aria-label="Contenido relacionado" className="flex flex-wrap gap-4 mt-8">
        {trip.related.map(link => <a href={relatedHref(link.href)} key={link.href} className="underline">{link.label}</a>)}
      </nav>
    </article>
  );
}
