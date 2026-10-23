import type { Metadata, MetadataRoute } from "next";
import type { Provincia, Actividad } from "./catalog";

// Identidad pública fija, también en Preview. Nunca derivar canonical del host o del build.
export const SITE_URL = "https://www.argentinauniversosur.com";
export const SITE_NAME = "Argentina Universo Sur";

export function canonicalUrl(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error(`Ruta canónica inválida: ${path}`);
  const url = new URL(path, SITE_URL);
  if (url.origin !== SITE_URL) throw new Error(`Origen canónico inválido: ${path}`);
  url.search = "";
  url.hash = "";
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.href;
}

export const STATIC_PAGES = [
  { path: "/", title: "Turismo en Argentina", description: "Descubrí los destinos más emblemáticos de Argentina. Guía completa de provincias, actividades turísticas, escapadas y experiencias únicas en todo el país." },
  { path: "/provincias", title: "Provincias de Argentina | Turismo", description: "Explorá todas las provincias argentinas. Descubrí destinos, paisajes y experiencias únicas en cada región del país. Mapa interactivo y guía completa de turismo." },
  { path: "/actividades", title: "Actividades turísticas en Argentina | Qué hacer", description: "Descubrí las mejores actividades turísticas en cada provincia de Argentina. Qué hacer, dónde ir y experiencias únicas. Filtrá por provincia y encontrá tu próxima aventura." },
  { path: "/escapadas", title: "Escapadas Argentina | Guías PDF", description: "Descargá nuestras guías de escapadas en PDF. Rutas turísticas, viajes cortos y fin de semana en diferentes provincias de Argentina. Planificá tu próxima escapada." },
  { path: "/seguridad", title: "Seguridad para viajeros en Argentina | Consejos", description: "Consejos de seguridad para viajeros en Argentina. Recomendaciones durante el viaje, uso responsable del fuego, cuidado del entorno y seguridad en la ruta." },
  { path: "/provincias/santa_fe/agencias", title: "Agencias de viajes en Santa Fe", description: "Encontrá agencias de viajes en Santa Fe. Consultá localidades, contactos, teléfonos y correos para planificar tu viaje por la provincia." },
  { path: "/provincias/santa_fe/eventos", title: "Eventos Santa Fe | Calendario", description: "Consultá los próximos eventos y actividades en curso de Santa Fe, y explorá el archivo de eventos anteriores de la provincia." },
  { path: "/provincias/santa_fe/noticias", title: "Noticias de turismo en Santa Fe", description: "Consultá las noticias de turismo en Santa Fe: novedades, actividades y actualidad turística de la provincia, con sus fechas y fuentes." },
  { path: "/provincias/santa_fe/oficinas", title: "Oficinas de información turística en Santa Fe", description: "Encontrá oficinas de información turística en Santa Fe. Consultá localidades, direcciones, horarios y contactos para organizar tu visita." },
  { path: "/provincias/santa_fe/planes", title: "Planes e ideas para visitar Santa Fe", description: "Explorá planes e ideas para visitar Santa Fe. Propuestas de cultura, gastronomía, naturaleza y actividades para recorrer la provincia." },
];

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function metaDescription(text: string): string {
  const clean = cleanText(text);
  if (clean.length <= 160) return clean;
  return clean.slice(0, 157).replace(/\s+\S*$/, "").replace(/[.,;:]$/, "") + "…";
}

export function pageMetadata(path: string, title: string, description: string, image = "/img/home/1.jpg"): Metadata {
  const fullTitle = `${cleanText(title)} | Universo Sur`;
  const summary = metaDescription(description);
  const url = canonicalUrl(path);
  const imageUrl = new URL(image, SITE_URL).href;
  return {
    title: { absolute: fullTitle },
    description: summary,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle, description: summary, url, siteName: SITE_NAME,
      type: "website", locale: "es_AR",
      images: [{ url: imageUrl, alt: cleanText(title) }],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description: summary, images: [imageUrl] },
  };
}

export function staticPageMetadata(path: string): Metadata {
  const page = STATIC_PAGES.find(page => page.path === path);
  if (!page) throw new Error(`Falta metadata para ${path}`);
  const image = path.startsWith("/provincias/santa_fe/") ? "/img/provincias/santa-fe/1.jpg" : "/img/home/1.jpg";
  return pageMetadata(path, page.title, page.description, image);
}

export function provinciaMetadata(provincia: Provincia): Metadata {
  return pageMetadata(`/provincias/${provincia.slug}`, `Turismo en ${provincia.provincia} | Qué hacer`, provincia.des_1, provincia.fotos[0]);
}

export function actividadMetadata(actividad: Actividad): Metadata {
  // Mantener el nombre completo: una ubicación larga nunca debe borrar la actividad.
  return pageMetadata(`/actividades/${actividad.actividadSlug}`, `${actividad.actividad} | ${actividad.provincia}`, actividad.des_1, actividad.fotos[0]);
}

export function createSitemap(provincias: Provincia[], actividades: Actividad[]): MetadataRoute.Sitemap {
  // Sin lastModified: la fuente no tiene fechas editoriales verificables.
  // No usar Date.now(), fechas de build, mtime ni fechas del evento como sustituto.
  return [
    ...STATIC_PAGES.map(page => ({ url: canonicalUrl(page.path) })),
    ...provincias.map(p => ({ url: canonicalUrl(`/provincias/${p.slug}`) })),
    ...actividades.map(a => ({ url: canonicalUrl(`/actividades/${a.actividadSlug}`) })),
  ];
}

export function createRobots(preview = false): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", ...(preview ? { disallow: "/" } : { allow: "/", disallow: ["/api/", "/private/"] }) },
    // /_next/ permanece rastreable para que Google pueda renderizar JS, CSS e imágenes.
    ...(preview ? {} : { sitemap: `${SITE_URL}/sitemap.xml` }),
  };
}

export const PUBLIC_REDIRECTS = [
  { source: "/provincias/catarmaca", destination: "/provincias/catamarca", permanent: true },
  // Hosts de producción conocidos: no capturar dominios de Preview con una regla comodín.
  ...["argentinauniversosur.com", "argentina-universosur.vercel.app"].map(host => ({
    source: "/:path*", has: [{ type: "host" as const, value: host }],
    destination: `${SITE_URL}/:path*`, permanent: true,
  })),
];
