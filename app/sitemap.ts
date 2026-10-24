import { publishedTrips } from "@/content/escapadas";
import { getActividades, getProvincias } from "@/lib/data";
import { canonicalUrl, createSitemap } from "@/lib/seo";

export default async function sitemap() {
  const [provincias, actividades] = await Promise.all([getProvincias(), getActividades()]);
  return [
    ...createSitemap(provincias, actividades),
    ...publishedTrips.map(trip => ({ url: canonicalUrl("/escapadas/" + trip.slug) })),
  ];
}
