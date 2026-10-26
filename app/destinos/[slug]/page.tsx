import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DestinoEditorialArticle from '@/components/destinos/DestinoEditorialArticle';
import { getPublishedDestination, publishedDestinations } from '@/lib/destinos/published';
import { SITE_NAME, SITE_URL } from '@/lib/seo';
export const dynamicParams = false;
export function generateStaticParams() { return publishedDestinations.map(p => ({ slug: p.slug })); }
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getPublishedDestination((await params).slug);
  if (!page) notFound();
  const image = { url: SITE_URL + page.photos[0].foto.src, alt: page.photos[0].foto.alt, width: page.photos[0].foto.ancho, height: page.photos[0].foto.alto };
  return {
    title: { absolute: page.seo.title }, description: page.seo.description,
    alternates: { canonical: page.seo.proposedCanonical },
    openGraph: { title: page.seo.title, description: page.seo.description, url: page.seo.proposedCanonical, type: 'website', locale: 'es_AR', siteName: SITE_NAME, images: [image] },
    twitter: { card: 'summary_large_image', title: page.seo.title, description: page.seo.description, images: [image.url] },
  };
}
export default async function DestinationPage({ params }: Props) {
  const page = getPublishedDestination((await params).slug);
  if (!page) notFound();
  return <DestinoEditorialArticle page={page} />;
}
