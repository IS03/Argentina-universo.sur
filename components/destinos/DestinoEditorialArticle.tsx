import type { EditorialDestinationPage, EditorialParagraph } from '@/lib/destinos/editorial-page';
import Icono from '@/components/ui/Icono';

// Server-rendered tourist content only: no master, private decisions, client fetching or image service.
export default function DestinoEditorialArticle({ page }: { page: EditorialDestinationPage }) {
  const sourceIndex = new Map(page.sources.map((source, index) => [source.id, index + 1]));
  const references = [
    { key: 'portada', ids: page.leadSourceIds },
    ...page.introduction.map((p, i) => ({ key: `intro-${i}`, ids: p.sourceIds })),
    ...page.sections.flatMap(s => s.paragraphs.map((p, i) => ({ key: `${s.id}-${i}`, ids: p.sourceIds }))),
    ...page.attractions.flatMap(a => a.paragraphs.map((p, i) => ({ key: `${a.id}-${i}`, ids: p.sourceIds }))),
    ...page.practical.map(p => ({ key: p.id, ids: p.fuenteIds })),
    ...page.locations.map(l => ({ key: l.id, ids: l.fuenteIds })),
  ];
  const firstReference = new Map<string, string>();
  for (const ref of references) for (const id of ref.ids) if (!firstReference.has(id)) firstReference.set(id, `cita-${ref.key}-${id}`);
  const citations = (ids: string[], context: string) => (
    <div className="mt-2 flex flex-wrap gap-1 text-sm" role="group" aria-label="Fuentes de este texto">
      {ids.map(id => <a key={id} id={`cita-${context}-${id}`} href={`#fuente-${id}`} aria-label={`Fuente [${sourceIndex.get(id)}]: ${page.sources.find(s => s.id === id)?.titulo}`} className="inline-flex min-h-8 min-w-8 scroll-mt-28 items-center justify-center rounded-full text-lago-700 underline decoration-lago-600/40 underline-offset-4 hover:bg-lago-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lago-700">[{sourceIndex.get(id)}]</a>)}
    </div>
  );
  const paragraph = (p: EditorialParagraph, key: string) => <div key={key}><p data-editorial-text className="leading-8 text-tinta-700">{p.text}</p>{citations(p.sourceIds, key)}</div>;
  const cover = page.photos[0];
  const links = [{ id: page.sections[0].id, label: 'Para elegir' }, { id: 'atractivos', label: 'Qué conocer' }, { id: 'practicos', label: 'Información práctica' }, { id: 'ubicaciones', label: 'Ubicaciones' }, { id: 'fuentes', label: 'Fuentes' }];
  return (
    <article>
      <header className="bg-arena-100 pb-8 pt-5 sm:pb-12 sm:pt-8">
        <div className="contenedor">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Native links also support the offline review renderer. */}
          <nav aria-label="Ruta de navegación" className="mb-7 text-sm text-tinta-500"><a href="/provincias" className="underline underline-offset-4">Provincias</a><span aria-hidden="true"> / </span><a href={`/provincias/${page.provinceSlugs[0]}`} className="underline underline-offset-4">{page.provinceLabel}</a><span aria-hidden="true"> / </span><span>{page.nombre}</span></nav>
          <div className="grid items-center gap-6 lg:grid-cols-[5fr_7fr] lg:gap-10">
            <div className="contents lg:block">
              <p className="antetitulo order-0 text-terracota-600">{page.provinceLabel} · {page.nombre}</p>
              <h1 className="order-1 font-display text-titulo text-tinta-900 lg:mt-4">{page.title}</h1>
              <div className="order-3 lg:mt-6"><p data-editorial-text className="text-lg leading-8 text-tinta-700">{page.resumen}</p>{citations(page.leadSourceIds, 'portada')}</div>
            </div>
            {cover && <figure className="order-2 min-w-0 lg:order-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover.foto.src} srcSet={cover.foto.variantes.map(v => `${v.src} ${v.ancho}w`).join(', ')} sizes="(min-width: 1216px) 648px, (min-width: 1024px) calc((100vw - 104px) * .5833), (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)" width={cover.foto.ancho} height={cover.foto.alto} alt={cover.foto.alt} loading="eager" fetchPriority="high" decoding="async" className="h-auto w-full rounded-tarjeta bg-arena-200 shadow-tarjeta" />
              <figcaption className="mt-3 text-xs leading-5 text-tinta-500">
                <p>{cover.foto.leyenda}</p>
                <p className="mt-1"><span className="font-semibold">{cover.foto.credito.titular}</span> · <a href={cover.foto.credito.urlLicencia} rel="noreferrer" className="inline-flex min-h-6 items-center underline underline-offset-4">{cover.foto.credito.licencia}</a> · <a href={cover.sourcePage} rel="noreferrer" className="underline underline-offset-4">{cover.originalTitle}</a></p>
                <p>{cover.modifications}</p>
              </figcaption>
            </figure>}
          </div>
        </div>
      </header>
      <nav aria-label="En esta ficha" className="border-y border-arena-300 bg-white"><div className="contenedor grid grid-cols-2 gap-2 py-4 sm:flex sm:flex-wrap">{links.map(link => <a key={link.id} href={'#' + link.id} className="inline-flex min-h-11 items-center justify-center rounded-full border border-arena-400 px-4 py-2 text-sm font-medium text-lago-700 hover:border-lago-600 hover:bg-lago-100">{link.label}</a>)}</div></nav>
      <div className="contenedor py-9 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
          <section aria-label="Introducción" className="space-y-5 text-lg">{page.introduction.map((p, i) => paragraph(p, `intro-${i}`))}</section>
          <div className="space-y-6 rounded-tarjeta border border-arena-300 bg-arena-100 p-6 sm:p-8">{page.sections.map(section => <section key={section.id} id={section.id} className="scroll-mt-28"><h2 className="mb-5 font-display text-3xl text-tinta-900">{section.title}</h2><div className="space-y-5">{section.paragraphs.map((p, i) => paragraph(p, `${section.id}-${i}`))}</div></section>)}</div>
        </div>
        <section id="atractivos" className="scroll-mt-28 pt-12 sm:pt-16" aria-labelledby="titulo-atractivos">
          <h2 id="titulo-atractivos" className="mb-6 font-display text-seccion text-tinta-900">Qué conocer</h2>
          <div className="grid gap-5 lg:grid-cols-2">{page.attractions.map((attraction, index) => <article key={attraction.id} id={attraction.id} className={`min-w-0 scroll-mt-28 overflow-hidden rounded-tarjeta border border-arena-300 bg-white shadow-tarjeta ${index === 0 ? 'lg:col-span-2' : ''}`}>
            <div className="flex items-center justify-between border-b border-arena-300 bg-arena-100 px-6 py-4 sm:px-8"><span className="font-display text-4xl text-terracota-600" aria-hidden="true">0{index + 1}</span><span className="antetitulo text-tinta-500">{attraction.tipo === 'patrimonio' ? 'Patrimonio' : attraction.tipo === 'actividad' ? 'Experiencia' : 'Cultura'}</span></div>
            <div className="p-6 sm:p-8"><h3 className="mb-5 font-display text-3xl text-tinta-900">{attraction.nombre}</h3><div className={`grid gap-5 ${index === 0 ? 'lg:grid-cols-2 lg:gap-10' : ''}`}>{attraction.paragraphs.map((p, i) => paragraph(p, `${attraction.id}-${i}`))}</div></div>
          </article>)}</div>
        </section>
        <section id="practicos" className="scroll-mt-28 pt-12 sm:pt-16" aria-labelledby="titulo-practicos"><h2 id="titulo-practicos" className="font-display text-seccion text-tinta-900">Organizar la visita</h2><p className="mb-6 mt-2 text-sm text-tinta-500">Consulta documental: <time dateTime={page.checkedAt}>{page.checkedAt}</time></p><dl className="grid gap-4 lg:grid-cols-3">{page.practical.map(item => <div key={item.id} className="rounded-tarjeta border border-arena-300 bg-arena-100 p-5 sm:p-6"><dt className="mb-3 font-semibold text-tinta-900">{item.etiqueta}</dt><dd><p data-editorial-text className="leading-7 text-tinta-700">{item.valor}</p>{citations(item.fuenteIds, item.id)}</dd></div>)}</dl></section>
        <section id="ubicaciones" className="scroll-mt-28 pt-12 sm:pt-16" aria-labelledby="titulo-ubicaciones"><h2 id="titulo-ubicaciones" className="mb-6 font-display text-seccion text-tinta-900">Ubicaciones</h2><div className="divide-y divide-arena-300 rounded-tarjeta border border-arena-300 bg-white px-5 sm:px-8">{page.locations.map(location => <div key={location.id} className="grid gap-4 py-6 sm:grid-cols-[1fr_auto] sm:items-center"><div><h3 className="font-semibold text-tinta-900">{location.etiqueta}</h3><p data-editorial-location className="mt-2 max-w-2xl leading-7 text-tinta-700">{location.descripcion}</p>{citations(location.fuenteIds, location.id)}</div><a href={location.mapaUrl} rel="noreferrer" aria-label={`Ver en el mapa: ${location.etiqueta} (OpenStreetMap)`} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full border border-lago-600 px-5 py-3 text-sm font-semibold text-lago-700 hover:bg-lago-100"><Icono nombre="mapa" className="size-4" />Ver en el mapa</a></div>)}</div></section>
        <section id="fuentes" className="scroll-mt-28 pt-12 sm:pt-16" aria-labelledby="titulo-fuentes"><h2 id="titulo-fuentes" className="mb-6 font-display text-seccion text-tinta-900">Fuentes de esta ficha</h2><ol className="grid list-none gap-3 md:grid-cols-2">{page.sources.map((source, i) => <li key={source.id} id={`fuente-${source.id}`} className="scroll-mt-28 rounded-control border border-arena-300 p-4 target:border-lago-600 target:bg-lago-100"><div className="flex items-start gap-3"><span aria-hidden="true" className="font-display text-2xl text-terracota-600">{i + 1}</span><div className="min-w-0"><a href={source.url} rel="noreferrer" className="font-medium text-lago-700 underline underline-offset-4">{source.titulo}</a><p className="mt-2 text-sm leading-6 text-tinta-500">{source.organismo} · Consulta: <time dateTime={source.consultadaEl}>{source.consultadaEl}</time></p>{source.publicadaEl && <p className="text-sm text-tinta-500">Publicación: <time dateTime={source.publicadaEl}>{source.publicadaEl}</time></p>}<a href={'#' + firstReference.get(source.id)} className="mt-1 inline-flex min-h-8 items-center text-sm text-lago-700 underline underline-offset-4">Volver a la primera cita</a></div></div></li>)}</ol></section>
        <nav aria-label="Contenido relacionado" className="pt-12 sm:pt-16"><h2 className="mb-5 font-display text-3xl text-tinta-900">Seguí explorando</h2><div className="grid gap-3 sm:grid-cols-3">{page.related.map(link => <a key={link.href} href={link.href} className="flex min-h-16 items-center justify-between gap-4 rounded-control border border-arena-300 bg-arena-100 p-5 font-medium text-lago-700 hover:border-lago-600">{link.label}<Icono nombre="flecha" className="size-4 shrink-0" /></a>)}</div></nav>
      </div>
    </article>
  );
}
