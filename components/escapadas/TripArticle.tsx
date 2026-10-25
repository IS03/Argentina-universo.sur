import { ROUTES } from "@/lib/site-links";
import type { PublishedTrip, PublicTripPhoto, TripSectionKind } from "@/lib/pages/trips";
import type { Foto, FuenteOficial } from "@/lib/destinos/modelo";
import FotoConCredito from "@/components/destinos/FotoConCredito";
import { ListaFuentes, ReferenciasFuentes } from "@/components/destinos/Fuentes";
import { Localidades, Ubicaciones } from "@/components/destinos/Lugares";
import Icono, { type NombreIcono } from "@/components/ui/Icono";

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

// Adaptadores de la proyección pública al contrato visual de components/destinos.
const aFuente = (source: PublishedTrip["sources"][number]): FuenteOficial =>
  ({ id: source.id, titulo: source.title, url: source.url, consultadaEl: source.checkedAt, publicadaEl: source.publishedAt });
const aFoto = (photo: PublicTripPhoto): Foto => ({
  src: photo.src, alt: photo.alt, ancho: photo.width, alto: photo.height, leyenda: photo.caption,
  variantes: photo.variants.map(v => ({ src: v.src, ancho: v.width })),
  credito: { titular: photo.attribution.holder, licencia: photo.attribution.licenseName, urlLicencia: photo.attribution.licenseUrl },
});

const ICONO_SECCION: Record<TripSectionKind, NombreIcono> = {
  highlights: "montana", activities: "brujula", nature: "montana", culture: "fuente", practical: "info",
};

const TITULO_H2 = "font-display text-seccion text-tinta-900 flex items-center gap-3";
// Columna principal: 1152 px útiles menos la lateral de 17 rem y el espacio entre columnas.
const SIZES_COLUMNA = "(min-width: 1280px) 824px, (min-width: 1024px) calc(100vw - 392px), (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)";
const SIZES_PORTADA = "(min-width: 1280px) 520px, (min-width: 1024px) calc((100vw - 64px) * 0.45), (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)";

interface TripArticleProps {
  trip: PublishedTrip;
  // Ranuras de la página contenedora (ruta de navegación, espacios laterales). El artículo en sí
  // no importa publicidad ni el catálogo editorial.
  migas?: React.ReactNode;
  lateral?: React.ReactNode;
}

// This component accepts the public projection only. It never imports the editorial catalog.
export default function TripArticle({ trip, migas, lateral }: TripArticleProps) {
  const fuentes = trip.sources.map(aFuente);
  const [portada, ...galeria] = (trip.photos ?? []).map(aFoto);
  const sectionId = (index: number) => "escapada-" + (trip.sections[index].id || `seccion-${index + 1}`);
  const indice = [
    ...trip.sections.map((s, index) => ({ href: `#${sectionId(index)}`, titulo: s.title })),
    { href: "#escapada-ubicacion", titulo: "Ubicación y mapas" },
    { href: "#escapada-fuentes", titulo: "Fuentes y verificación" },
  ];
  return (
    <article aria-labelledby="escapada-titulo" className="pb-4">
      <header className="border-b border-arena-300/70 bg-arena-100">
        <div className={`contenedor grid gap-8 pt-6 pb-10 sm:pb-14 ${portada ? "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] lg:items-end lg:gap-12" : ""}`}>
          <div className="max-w-3xl">
            {migas}
            <p className="antetitulo mt-8 text-terracota-600">{trip.destination} · {trip.province}</p>
            <h1 id="escapada-titulo" className="mt-2 font-display text-titulo text-tinta-900">{trip.title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-tinta-700 sm:text-xl">{trip.description}</p>
            {trip.introductionSourceIds && <ReferenciasFuentes ids={trip.introductionSourceIds} fuentes={fuentes} />}
            {trip.geography && <div className="mt-5"><Localidades localidades={trip.geography.localities.map(l => ({ id: l.id, nombre: l.name }))} /></div>}
          </div>
          {portada && <FotoConCredito foto={portada} sizes={SIZES_PORTADA} prioridad />}
        </div>
      </header>

      <div className="contenedor mt-8 grid gap-10 sm:mt-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-14">
        <aside className="min-w-0 lg:order-2">
          <div className="lg:sticky lg:top-[calc(var(--alto-encabezado)+1.5rem)]">
            <nav aria-label="En esta escapada">
              <p className="antetitulo mb-3 text-tinta-500">En esta escapada</p>
              <ul className="fila-desplazable -mx-4 list-none px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:border-l lg:border-arena-300 lg:px-0">
                {indice.map(item => (
                  <li key={item.href}>
                    <a className="inline-flex min-h-11 items-center rounded-full border border-arena-400 bg-white px-4 text-sm font-medium text-tinta-900 hover:border-lago-600 hover:text-lago-700 lg:-ml-px lg:rounded-none lg:border-0 lg:border-l-2 lg:border-transparent lg:bg-transparent lg:px-4 lg:hover:border-lago-600" href={item.href}>
                      {item.titulo}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            {lateral && <div className="mt-8 hidden lg:block">{lateral}</div>}
          </div>
        </aside>

        <div className="min-w-0 lg:order-1">
          {trip.sections.map((section, index) => (
            <section key={sectionId(index)} aria-labelledby={sectionId(index)} className="mb-12">
              <h2 id={sectionId(index)} className={TITULO_H2}>
                {section.kind && <Icono nombre={ICONO_SECCION[section.kind]} className="size-6 text-terracota-600" />}
                {section.title}
              </h2>
              <div className="prosa mt-4">
                {section.paragraphs.map((paragraph, n) => <p key={n}>{paragraph}</p>)}
              </div>
              {trip.operationalNotices?.filter(notice => notice.sectionId === section.id).map(notice => {
                const official = trip.sources.find(source => source.id === notice.officialStatusSourceId);
                return (
                  // Static HTML may stay online long after a build: the guidance is timeless and the observation
                  // is past tense with its dates visible, so the page stays truthful without JavaScript.
                  // Markup pinned by tests/escapadas-editorial.test.mjs: the guidance is the first paragraph.
                  <aside key={notice.id} aria-label="Estado operativo" className="relative mt-5 max-w-[68ch] rounded-control border border-aviso-700/30 bg-aviso-50 py-4 pr-4 pl-12 text-tinta-900">
                    <p>{notice.guidance}{" "}{official && <a className="underline" href={official.url} rel="noreferrer">{official.title}</a>}</p>
                    {notice.observation && (
                      <div className="mt-3 border-t border-aviso-700/20 pt-3 text-sm">
                        <p className="font-semibold">
                          Registro verificado el <time dateTime={notice.observation.verifiedAt}>{notice.observation.verifiedAt}</time>,
                          publicado el <time dateTime={notice.observation.publishedAt}>{notice.observation.publishedAt}</time>.
                          Vale como referencia hasta el <time dateTime={notice.observation.expiresAt}>{notice.observation.expiresAt}</time>;
                          después puede no reflejar el estado actual.
                        </p>
                        <p className="mt-1">{notice.observation.text}</p>
                        <ReferenciasFuentes ids={notice.observation.sourceIds} fuentes={fuentes} />
                      </div>
                    )}
                    <Icono nombre="alerta" className="absolute top-4 left-4 size-5 text-aviso-700" />
                  </aside>
                );
              })}
              <ReferenciasFuentes ids={section.sourceIds} fuentes={fuentes} />
            </section>
          ))}

          {galeria.length > 0 && (
            <div className="mb-12 grid gap-8">
              {galeria.map(foto => <FotoConCredito key={foto.src} foto={foto} sizes={SIZES_COLUMNA} />)}
            </div>
          )}

          <section className="mb-12" aria-labelledby="escapada-ubicacion">
            <h2 id="escapada-ubicacion" className={TITULO_H2}>
              <Icono nombre="mapa" className="size-6 text-terracota-600" />
              Ubicación y mapas
            </h2>
            <div className="mt-4">
              <Ubicaciones
                fuentes={fuentes}
                ubicaciones={(trip.locations || [{ id: "destino", label: trip.destination, description: trip.address, mapUrl: trip.mapUrl, sourceIds: [] }])
                  .map(l => ({ id: l.id, etiqueta: l.label, descripcion: l.description, mapaUrl: l.mapUrl, fuenteIds: l.sourceIds }))}
              />
            </div>
            <p className="mt-4 text-sm text-tinta-500">Los mapas son referencias de ubicación. Confirmá accesos y condiciones con las fuentes oficiales antes de viajar.</p>
          </section>

          <section className="mb-12" aria-labelledby="escapada-fuentes">
            <h2 id="escapada-fuentes" className={TITULO_H2}>
              <Icono nombre="fuente" className="size-6 text-terracota-600" />
              Fuentes y verificación
            </h2>
            <div className="mt-4"><ListaFuentes fuentes={fuentes} /></div>
            <p className="mt-4 text-sm text-tinta-500">Redacción original para Argentina Universo Sur. Los horarios, las tarifas y la disponibilidad deben comprobarse para la fecha de la visita.</p>
          </section>

          <nav aria-label="Contenido relacionado" className="border-t border-arena-300/80 pt-6">
            <p className="antetitulo text-terracota-600">Seguí explorando</p>
            <ul className="mt-3 flex list-none flex-wrap gap-2">
              {trip.related.map(link => (
                <li key={link.href}>
                  <a href={relatedHref(link.href)} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-arena-400 bg-white px-4 text-sm font-medium text-tinta-900 hover:border-lago-600 hover:text-lago-700">
                    {link.label}
                    <Icono nombre="flecha" className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </article>
  );
}
