import type { ReactNode } from 'react';
import type { EditorialDestinationPage, EditorialParagraph } from '@/lib/destinos/editorial-page';
import Icono from '@/components/ui/Icono';

// All approved tourist copy stays on the server; optional tools receive only public names/anchors.
export default function DestinoEditorialArticle({ page, planningTools }: { page: EditorialDestinationPage; planningTools?: ReactNode }) {
  const sources = new Map(page.sources.map((source, index) => [source.id, { ...source, number: index + 1 }]));
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
    <div className="destination-citations" role="group" aria-label="Fuentes de este texto">
      {ids.map(id => <a key={id} id={`cita-${context}-${id}`} href={`#fuente-${id}`} aria-label={`Fuente [${sources.get(id)?.number}]: ${sources.get(id)?.titulo}`}>[{sources.get(id)?.number}]</a>)}
    </div>
  );
  const paragraph = (p: EditorialParagraph, key: string) => <div key={key} className="destination-paragraph"><p data-editorial-text>{p.text}</p>{citations(p.sourceIds, key)}</div>;
  const cover = page.photos[0];
  const links = [{ id: page.sections[0].id, label: 'Para elegir', key: 'discovery' }, { id: 'atractivos', label: 'Qué conocer', key: 'attractions' }, { id: 'practicos', label: 'Información práctica', key: 'practical' }, { id: 'ubicaciones', label: 'Ubicaciones', key: 'locations' }, { id: 'mi-visita', label: 'Mi lista', key: 'plan' }, { id: 'fuentes', label: 'Fuentes', key: 'sources' }];
  return (
    <article className="destination-page">
      <header className="destination-hero">
        <div className="contenedor">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Native links also support the offline review renderer. */}
          <nav aria-label="Ruta de navegación" className="destination-breadcrumb"><a href="/provincias">Provincias</a><span aria-hidden="true"> / </span><a href={`/provincias/${page.provinceSlugs[0]}`}>{page.provinceLabel}</a><span aria-hidden="true"> / </span><span>{page.nombre}</span></nav>
          <div className="destination-hero-grid">
            <div className="destination-hero-copy">
              <p className="destination-label">{page.provinceLabel} · {page.nombre}</p>
              <h1>{page.title}</h1>
              <div className="destination-hero-lead"><p data-editorial-text>{page.resumen}</p>{citations(page.leadSourceIds, 'portada')}</div>
            </div>
            {cover && <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover.foto.src} srcSet={cover.foto.variantes.map(v => `${v.src} ${v.ancho}w`).join(', ')} sizes="(min-width: 1216px) 648px, (min-width: 1024px) calc((100vw - 104px) * .5833), (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)" width={cover.foto.ancho} height={cover.foto.alto} alt={cover.foto.alt} loading="eager" fetchPriority="high" decoding="async" />
              <figcaption>
                <p>{cover.foto.leyenda}</p>
                <p><span className="font-semibold">{cover.foto.credito.titular}</span> · <a href={cover.foto.credito.urlLicencia} rel="noreferrer">{cover.foto.credito.licencia}</a> · <a href={cover.sourcePage} rel="noreferrer">{cover.originalTitle}</a></p>
                <p>{cover.modifications}</p>
              </figcaption>
            </figure>}
          </div>
        </div>
      </header>
      <nav aria-label="En esta ficha" className="destination-index"><ol className="contenedor">{links.map((link, index) => <li key={link.id}><a href={'#' + link.id} data-section-link={link.key}><span aria-hidden="true">0{index + 1}</span><span>{link.label}</span><Icono nombre="flecha" className="size-4" /></a></li>)}</ol></nav>
      <section aria-label="Introducción" className="destination-intro contenedor"><div>{page.introduction.map((p, i) => paragraph(p, `intro-${i}`))}</div></section>
      {page.sections.map(section => <section key={section.id} id={section.id} className="destination-discovery" aria-labelledby={'titulo-' + section.id}>
        <div className="contenedor">
          <div className="destination-section-heading"><p className="destination-label">01 / Para elegir</p><h2 id={'titulo-' + section.id}>{section.title}</h2></div>
          <div className="destination-discovery-copy">{section.paragraphs.map((p, i) => paragraph(p, `${section.id}-${i}`))}</div>
          <nav aria-label="Descubrir los atractivos" className="destination-discovery-links">{page.attractions.map((attraction, i) => <a key={attraction.id} href={'#' + attraction.id}><span aria-hidden="true">0{i + 1}</span><span>{attraction.nombre}</span><Icono nombre="flecha" /></a>)}</nav>
        </div>
      </section>)}
      <div className="contenedor destination-body">
        <section id="atractivos" className="destination-attractions" aria-labelledby="titulo-atractivos">
          <div className="destination-section-heading"><p className="destination-label">02 / Los lugares</p><h2 id="titulo-atractivos">Qué conocer</h2><a className="destination-text-link" href="#mi-visita">Elegir para mi lista<Icono nombre="flecha" /></a></div>
          {page.attractions.map((attraction, index) => <article key={attraction.id} id={attraction.id} className="destination-attraction">
            <header><span className="destination-attraction-number" aria-hidden="true">0{index + 1}</span><p className="destination-label">{attraction.tipo === 'patrimonio' ? 'Patrimonio' : attraction.tipo === 'actividad' ? 'Experiencia' : 'Cultura'}</p><h3>{attraction.nombre}</h3></header>
            <div className="destination-attraction-copy">{attraction.paragraphs.map((p, i) => paragraph(p, `${attraction.id}-${i}`))}</div>
          </article>)}
        </section>
        <section id="practicos" className="destination-practical" aria-labelledby="titulo-practicos">
          <div className="destination-section-heading"><p className="destination-label">03 / Antes de salir</p><h2 id="titulo-practicos">Organizar la visita</h2><p className="destination-meta">Consulta documental: <time dateTime={page.checkedAt}>{page.checkedAt}</time></p></div>
          <dl>{page.practical.map(item => <div key={item.id}><dt>{item.etiqueta}</dt><dd><p data-editorial-text>{item.valor}</p>{citations(item.fuenteIds, item.id)}</dd></div>)}</dl>
        </section>
        <section id="ubicaciones" className="destination-locations" aria-labelledby="titulo-ubicaciones">
          <div className="destination-section-heading"><p className="destination-label">04 / En el mapa</p><h2 id="titulo-ubicaciones">Ubicaciones</h2></div>
          <div>{page.locations.map(location => <div key={location.id} className="destination-location"><Icono nombre="pin" className="size-6" /><div><h3>{location.etiqueta}</h3><p data-editorial-location>{location.descripcion}</p>{citations(location.fuenteIds, location.id)}</div><a href={location.mapaUrl} rel="noreferrer" aria-label={`Ver en el mapa: ${location.etiqueta} (OpenStreetMap)`} className="destination-text-link">Ver en el mapa<Icono nombre="externo" /></a></div>)}</div>
        </section>
        <section id="mi-visita" className="destination-plan" aria-labelledby="titulo-mi-visita"><div className="destination-section-heading"><p className="destination-label">05 / A tu manera</p><h2 id="titulo-mi-visita">Tu lista de lugares</h2></div>{planningTools ?? <p>Los nombres y enlaces de los atractivos están disponibles en esta ficha. Podés imprimirla desde el menú de tu navegador.</p>}</section>
        <section id="fuentes" className="destination-sources" aria-labelledby="titulo-fuentes"><div className="destination-section-heading"><p className="destination-label">06 / Para consultar</p><h2 id="titulo-fuentes">Fuentes de esta ficha</h2></div><ol>{page.sources.map((source, i) => <li key={source.id} id={`fuente-${source.id}`}><span aria-hidden="true" className="destination-source-number">{i + 1}</span><div><a href={source.url} rel="noreferrer" className="destination-source-title">{source.titulo}<Icono nombre="externo" className="size-4" /></a><p className="destination-meta">{source.organismo} · Consulta: <time dateTime={source.consultadaEl}>{source.consultadaEl}</time></p>{source.publicadaEl && <p className="destination-meta">Publicación: <time dateTime={source.publicadaEl}>{source.publicadaEl}</time></p>}<a href={'#' + firstReference.get(source.id)} className="destination-source-return">Volver a la primera cita</a></div></li>)}</ol></section>
        <nav aria-label="Contenido relacionado" className="destination-related"><h2>Seguí explorando</h2><div>{page.related.map(link => <a key={link.href} href={link.href}>{link.label}<Icono nombre="flecha" /></a>)}</div></nav>
      </div>
    </article>
  );
}
