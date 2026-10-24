import { trips } from "@/content/escapadas";
import { tripPublishable } from "@/lib/pages/trips";
import { getActividades, getProvincias } from "@/lib/data";
import { canonicalUrl, createSitemap } from "@/lib/seo";

export default async function sitemap() {
  const [provincias, actividades] = await Promise.all([getProvincias(), getActividades()]);
  return [
    ...createSitemap(provincias, actividades),
    ...trips.filter(tripPublishable).map(trip => ({ url: canonicalUrl("/escapadas/" + trip.slug) })),
  ];
}
