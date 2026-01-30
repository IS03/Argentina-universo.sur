# SEO – Indexación (técnico)

Checklist de indexación para que los buscadores descubran y rastreen bien el sitio.

## ✅ Sitemap.xml

- **Ubicación:** generado por Next.js en `/sitemap.xml`.
- **Origen:** `app/sitemap.ts` (sitemap dinámico).
- **Contenido:** Todas las URLs públicas: home, provincias, actividades, escapadas, seguridad, páginas de provincia, páginas de actividad y subpáginas Santa Fe (agencias, eventos, noticias, oficinas, planes).
- **Base URL:** `NEXT_PUBLIC_SITE_URL` o fallback a `https://argentina-universo-sur.vercel.app`.
- **Prioridad y frecuencia:** home (1, weekly), secciones principales (0.9), provincias (0.85), actividades (0.7), subpáginas Santa Fe (0.6).

## ✅ Robots.txt

- **Ubicación:** generado por Next.js en `/robots.txt`.
- **Origen:** `app/robots.ts`.
- **Reglas:** `allow: /` para todos los bots; `disallow: /api/`, `/_next/`, `/private/`.
- **Sitemap:** Incluye `Sitemap: {BASE_URL}/sitemap.xml`.
- **Host:** Incluye `Host: {BASE_URL}` (opcional pero recomendado).

## ✅ Páginas no bloqueadas por error

- **Layout raíz** (`app/layout.tsx`): `robots: { index: true, follow: true }` y configuración para Googlebot (max-image-preview, etc.).
- **404** (`app/not-found.tsx`): `robots: { index: false, follow: true }` para que las páginas no encontradas no se indexen pero los enlaces se sigan.
- Las páginas que llaman a `notFound()` devuelven 404 y no están en el sitemap, por lo que no se indexan como contenido válido.

## ✅ Canonical bien definido

- **Base:** `metadataBase` en `app/layout.tsx` con `NEXT_PUBLIC_SITE_URL` (o fallback). Todas las URLs canónicas se resuelven como absolutas.
- **Páginas con canonical explícito:**
  - Home: `alternates.canonical: "/"`.
  - Actividades (listado y layout): `"/actividades"`.
  - Actividad (detalle): `"/actividades/{slug}"`.
  - Provincias (listado): `"/provincias"`.
  - Provincia (detalle): `"/provincias/{slug}"`.
  - Santa Fe (agencias, eventos, noticias, oficinas, planes): `"/provincias/santa_fe/..."`.
  - Escapadas: `"/escapadas"`.
  - Seguridad: `"/seguridad"`.

## 12. Google Search Console (obligatorio)

**Es el panel de control del SEO.** Aquí se monitorea indexación, errores y rendimiento en Google.

### Checklist GSC

- ✔ **Dominio verificado** — Propiedad del sitio añadida y verificada (DNS o HTML).
- ✔ **Sitemap enviado** — Añadir la URL del sitemap (ej. `https://tu-dominio.com/sitemap.xml`) en *Sitemaps*.
- ✔ **Errores corregidos** — Revisar *Cobertura* / *Páginas* y solucionar URLs con error (404, bloqueadas, etc.).
- ✔ **Ver consultas reales** — En *Rendimiento* > *Consultas* ver qué búsquedas llevan tráfico y con qué páginas.
- ✔ **Optimizar páginas que ya aparecen** — Mejorar títulos, descripciones y contenido de las URLs que ya tienen impresiones/clics para subir posiciones.

### Dónde actuar según GSC

| Sección GSC | Para qué usarla |
|-------------|-----------------|
| **Cobertura / Páginas** | Ver qué URLs están indexadas, excluidas o con error. Corregir errores antes de escalar contenido. |
| **Sitemaps** | Confirmar que el sitemap se ha descubierto y no hay fallos. |
| **Rendimiento** | Consultas, páginas, países, dispositivos. Priorizar optimización en lo que ya genera impresiones. |
| **Mejoras** | Core Web Vitals, móvil, etc. Revisar avisos y corregir. |

---

## Verificación rápida

1. **Sitemap:** `https://tu-dominio.com/sitemap.xml`
2. **Robots:** `https://tu-dominio.com/robots.txt`
3. **Canonical:** Inspeccionar `<link rel="canonical" href="...">` en el HTML de cada tipo de página.
4. **Google Search Console:** Dominio verificado, sitemap enviado, cobertura y rendimiento revisados (ver sección 12).
