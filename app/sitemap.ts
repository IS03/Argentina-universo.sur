import { publishedDestinations } from "@/lib/destinos/published";
import { publishedTrips } from "@/content/escapadas";
import { getActividades, getProvincias } from "@/lib/data";
import { canonicalUrl, createSitemap } from "@/lib/seo";

export default async function sitemap() {
  const [provincias, actividades] = await Promise.all([getProvincias(), getActividades()]);
  return [
    ...createSitemap(provincias, actividades),
    ...publishedDestinations.map(page => ({ url: page.seo.proposedCanonical })),
    ...publishedTrips.map(trip => ({ url: canonicalUrl("/escapadas/" + trip.slug) })),
  ];
}
