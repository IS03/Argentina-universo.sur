import { getActividades, getProvincias } from "@/lib/data";
import { createSitemap } from "@/lib/seo";

export default async function sitemap() {
  const [provincias, actividades] = await Promise.all([getProvincias(), getActividades()]);
  return createSitemap(provincias, actividades);
}
