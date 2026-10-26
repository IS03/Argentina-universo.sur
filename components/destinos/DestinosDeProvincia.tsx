import { publishedDestinations } from '@/lib/destinos/published';
import Icono from '@/components/ui/Icono';
export default function DestinosDeProvincia({ slug }: { slug: string }) {
  const pages = publishedDestinations.filter(page => page.provinceSlugs.includes(slug));
  if (!pages.length) return null;
  return <section aria-labelledby="titulo-destinos-editoriales" className="mt-14"><h2 id="titulo-destinos-editoriales" className="mb-6 font-display text-seccion text-tinta-900">Destinos para conocer</h2>{pages.map(page => <article key={page.id} className="grid overflow-hidden rounded-tarjeta border border-arena-300 bg-white shadow-tarjeta sm:grid-cols-[16rem_1fr]">
    <a href={'/destinos/' + page.slug} aria-label={page.title} className="self-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={page.photos[0].foto.src} srcSet={page.photos[0].foto.variantes.map(v => `${v.src} ${v.ancho}w`).join(', ')} sizes="(min-width: 640px) 256px, calc(100vw - 32px)" width={page.photos[0].foto.ancho} height={page.photos[0].foto.alto} alt={page.photos[0].foto.alt} loading="lazy" className="h-auto w-full" />
    </a>
    <div className="p-5 sm:p-7"><h3 className="font-display text-3xl text-tinta-900"><a href={'/destinos/' + page.slug} className="hover:text-lago-700">{page.title}</a></h3><p className="mt-3 leading-7 text-tinta-700">{page.resumen}</p><a href={'/destinos/' + page.slug} className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-lago-700">{page.nombre}<Icono nombre="flecha" className="size-4" /></a><p className="mt-2 text-xs leading-5 text-tinta-500">{page.photos[0].foto.credito.titular} · <a href={page.photos[0].foto.credito.urlLicencia} rel="noreferrer" className="underline underline-offset-4">{page.photos[0].foto.credito.licencia}</a> · <a href={page.photos[0].sourcePage} rel="noreferrer" className="underline underline-offset-4">{page.photos[0].originalTitle}</a> · {page.photos[0].modifications}</p></div>
  </article>)}</section>;
}
