import type { EditorialDestinationPage, EditorialParagraph } from '@/lib/destinos/editorial-page';
import { ListaFuentes, ReferenciasFuentes } from '@/components/destinos/Fuentes';
import FotoConCredito from '@/components/destinos/FotoConCredito';
import { InfoPractica, Ubicaciones } from '@/components/destinos/Lugares';
import Icono from '@/components/ui/Icono';

// No data loading or approval logic. PR18 renders this only in a restricted loopback environment.
export default function DestinoEditorialArticle({ page }: { page: EditorialDestinationPage }) {
  const anchors = [
    ...page.sections.map(s => ({ id: s.id, label: s.title })),
    { id: 'atractivos', label: 'Qué conocer' }, { id: 'ubicaciones', label: 'Ubicaciones' },
    { id: 'practicos', label: 'Organizar la visita' }, { id: 'fuentes', label: 'Fuentes' },
  ];
  const paragraph = (p: EditorialParagraph, index: number) => (
    <div key={index} className="mt-5">
      <p className="text-base leading-8 text-tinta-700 sm:text-lg">{p.text}</p>
      <ReferenciasFuentes ids={p.sourceIds} fuentes={page.sources} compact />
    </div>
  );
  const cover = page.photos[0];
  return (
    <article>
      <header className="contenedor py-10 sm:py-16">
        <p className="antetitulo flex items-center gap-2 text-terracota-600"><Icono nombre="pin" />{page.provinceLabel} · {page.nombre}</p>
        <div className="mt-4 grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h1 className="font-display text-titulo text-tinta-900">{page.title}</h1>
            <p className="mt-5 text-lg leading-8 text-tinta-700 sm:text-xl">{page.resumen}</p>
            <ReferenciasFuentes ids={page.leadSourceIds} fuentes={page.sources} compact />
            <a href="#atractivos" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-lago-600 px-5 py-3 font-semibold text-white hover:bg-lago-700">Explorá los atractivos<Icono nombre="flecha" /></a>
          </div>
          {cover && <div>
            <FotoConCredito foto={cover.foto} sizes="(min-width: 1280px) 552px, (min-width: 1024px) calc((100vw - 112px) / 2), (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)" prioridad />
            <p className="mt-1 text-xs leading-5 text-tinta-500"><a href={cover.sourcePage} rel="noreferrer" className="underline">Original: {cover.originalTitle}</a> · {cover.modifications}</p>
          </div>}
        </div>
      </header>
      <nav aria-label="En esta ficha" className="border-y border-arena-300 bg-arena-100">
        <div className="contenedor flex gap-2 overflow-x-auto py-3">
          {anchors.map(a => <a key={a.id} href={'#' + a.id} className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-arena-400 bg-white px-4 text-sm font-medium text-tinta-700 hover:border-lago-600 hover:text-lago-700">{a.label}</a>)}
        </div>
      </nav>
      <div className="contenedor grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-14">
        <div className="min-w-0 max-w-3xl">
          <section aria-label="Introducción">{page.introduction.map(paragraph)}</section>
          {page.sections.map(section => <section key={section.id} id={section.id} className="mt-12 scroll-mt-6">
            <h2 className="font-display text-seccion text-tinta-900">{section.title}</h2>
            {section.paragraphs.map(paragraph)}
          </section>)}
          <section id="atractivos" className="mt-12 scroll-mt-6" aria-labelledby="titulo-atractivos">
            <h2 id="titulo-atractivos" className="font-display text-seccion text-tinta-900">Qué conocer</h2>
            <div className="mt-5 space-y-6">{page.attractions.map((attraction, index) => <article key={attraction.id} id={attraction.id} className="scroll-mt-6 rounded-tarjeta border border-arena-300 bg-white p-5 shadow-tarjeta sm:p-7">
              <p className="antetitulo text-terracota-600">{String(index + 1).padStart(2, '0')} · {attraction.tipo === 'patrimonio' ? 'Patrimonio' : attraction.tipo === 'actividad' ? 'Experiencia' : 'Cultura'}</p>
              <h3 className="mt-2 font-display text-2xl text-tinta-900">{attraction.nombre}</h3>
              {attraction.paragraphs.map(paragraph)}
            </article>)}</div>
          </section>
          <section id="ubicaciones" className="mt-12 scroll-mt-6" aria-labelledby="titulo-ubicaciones"><h2 id="titulo-ubicaciones" className="mb-5 font-display text-seccion text-tinta-900">Ubicaciones para orientarte</h2><Ubicaciones ubicaciones={page.locations} fuentes={page.sources} /></section>
          <section id="practicos" className="mt-12 scroll-mt-6" aria-labelledby="titulo-practicos"><h2 id="titulo-practicos" className="mb-5 font-display text-seccion text-tinta-900">Organizar la visita</h2><InfoPractica datos={page.practical} fuentes={page.sources} /></section>
        </div>
        <aside aria-label="Orientación de lectura" className="self-start rounded-tarjeta border border-arena-300 bg-white p-5 lg:sticky lg:top-6">
          <p className="antetitulo text-terracota-600">Tu próxima escapada</p>
          <h2 className="mt-2 font-display text-2xl text-tinta-900">{page.nombre}</h2>
          <p className="mt-3 text-sm leading-6 text-tinta-700">Elegí los lugares que te interesen y consultá las condiciones de cada institución para tu fecha de viaje.</p>
          <ul className="mt-4 list-none border-t border-arena-300 pt-3">{page.attractions.map(a => <li key={a.id}><a href={'#' + a.id} className="flex min-h-11 items-center gap-2 py-2 text-sm font-medium text-lago-600 underline underline-offset-4"><Icono nombre="pin" className="size-4" />{a.nombre}</a></li>)}</ul>
        </aside>
      </div>
      <footer className="contenedor pb-14">
        <section id="fuentes" className="scroll-mt-6 border-t border-arena-300 pt-10" aria-labelledby="titulo-fuentes"><h2 id="titulo-fuentes" className="mb-5 font-display text-seccion text-tinta-900">Fuentes de esta ficha</h2><ListaFuentes fuentes={page.sources} /></section>
        <nav aria-label="Contenido relacionado" className="mt-12"><h2 className="font-display text-2xl text-tinta-900">Seguí explorando</h2><ul className="mt-5 grid list-none gap-3 sm:grid-cols-3">{page.related.map(link => <li key={link.href}><a href={link.href} className="flex min-h-14 items-center justify-between gap-3 rounded-control border border-arena-300 bg-white p-4 font-medium text-lago-600 hover:border-lago-600">{link.label}<Icono nombre="flecha" /></a></li>)}</ul></nav>
      </footer>
    </article>
  );
}
