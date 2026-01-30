import type { MetadataRoute } from "next";
import { getActividades, getProvincias } from "@/lib/data";
import { ROUTES } from "@/lib/site-links";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://argentina-universo-sur.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [actividades, provincias] = await Promise.all([
    getActividades(),
    getProvincias(),
  ]);

  const lastModified = new Date();

  // Rutas estáticas principales
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL + ROUTES.home, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: BASE_URL + ROUTES.provincias, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: BASE_URL + ROUTES.actividades, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: BASE_URL + ROUTES.escapadas, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: BASE_URL + ROUTES.seguridad, lastModified, changeFrequency: "monthly", priority: 0.8 },
  ];

  // Páginas de provincias dinámicas
  const provinciaRoutes: MetadataRoute.Sitemap = provincias.map((p) => ({
    url: BASE_URL + ROUTES.provincia(p.slug),
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // Páginas de actividades dinámicas
  const actividadRoutes: MetadataRoute.Sitemap = actividades.map((a) => ({
    url: BASE_URL + ROUTES.actividad(a.actividadSlug),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Subpáginas Santa Fe (rutas estáticas bajo /provincias/santa_fe/...)
  const santaFeSubRoutes: MetadataRoute.Sitemap = [
    "/agencias",
    "/eventos",
    "/noticias",
    "/oficinas",
    "/planes",
  ].map((path) => ({
    url: `${BASE_URL}/provincias/santa_fe${path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...provinciaRoutes,
    ...actividadRoutes,
    ...santaFeSubRoutes,
  ];
}
