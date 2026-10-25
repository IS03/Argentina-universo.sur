# Argentina Universo Sur

Sitio web de **turismo en Argentina** que invita a descubrir destinos, provincias, actividades y escapadas en todo el país. Pensado para viajeros que buscan información práctica, mapas y guías para planificar su viaje.

---

## Qué es la web

**Argentina Universo Sur** es una guía turística online que reúne:

- **Provincias**: las 24 jurisdicciones con descripciones, fotos, capital y mapa.
- **Actividades**: qué hacer en cada provincia (cultural, naturaleza, aventura, etc.) con ubicación en mapa.
- **Escapadas**: guías en PDF por destino (rutas, duración, zona).
- **Seguridad**: consejos para viajeros (ruta, fuego, playas, áreas naturales, altura, salud, emergencias).

El contenido está orientado a SEO y enlazado interno (breadcrumbs, enlaces contextuales, sitemap, metadata por página).

---

## Secciones principales

### Inicio (`/`)
- Carrusel de imágenes del país.
- Acceso rápido a **provincias** y **actividades** (tarjetas con fotos y enlaces).
- Enlaces a escapadas y guía de seguridad.

### Viaja por Argentina (`/provincias`)
- **Mapa interactivo** de Argentina (SVG) con las 24 provincias, navegable con mouse o teclado.
- Cada provincia tiene ficha con: nombre, fotos, descripciones, capital (nombre, dirección, coordenadas), zona (Norte, Cuyo, Patagonia, etc.).
- Enlace a actividades filtradas por esa provincia.
- **Santa Fe** incluye subsecciones propias: noticias, planes, agencias, oficinas de información, eventos, preguntas frecuentes.

### Qué hacer (`/actividades`)
- Listado de **actividades turísticas** por provincia.
- **Filtro por provincia** (dropdown o query `?provincia=slug`).
- Cada actividad: nombre, ubicación, descripción, fotos y **mapa** con marcador (Leaflet).
- Enlace desde cada actividad a la provincia correspondiente.

### Escapadas (`/escapadas`)
- Listado de **escapadas** con título, provincia(s), duración (ej. 3 días), zona y **enlace a guía en PDF**.
- Pensado para viajes cortos y fines de semana (ej. El Calafate y El Chaltén, Puerto Iguazú, Pinamar, Puerto Madryn, etc.).

### Guía de seguridad (`/seguridad`)
- Consejos organizados por tema:
  - Durante el viaje (pertenencias, emergencias, clima, normas por actividad).
  - Uso responsable del fuego (fogatas, colillas, vehículos en pastizales).
  - Residuos y cuidado del entorno.
  - En la ruta (documentación, cinturón, velocidad, fauna, balizas).
  - Playas y balnearios (guardavidas, banderas, zonas habilitadas).
  - Áreas naturales (senderos, flora/fauna, mascotas en Parques Nacionales).
  - Destinos de altura (+2500 msnm) (aclimatación, hidratación, síntomas).
  - Salud y prevención (hidratación, sol, botiquín).
  - Emergencias (enlace a información oficial).

### Noticias
- Enlace en la navegación a noticias de turismo (sitio externo de Argentina.gob.ar).

---

## Navegación y enlaces

- **Navbar** fija: logo (inicio), Viaja por Argentina, Qué hacer, Escapadas, Guía de seguridad, Noticias (externo).
- **Footer** con enlaces internos a las mismas secciones.
- Rutas centralizadas en `lib/site-links.ts` (ROUTES, NAV_ANCHORS, INTERNAL_ANCHORS) para consistencia y SEO.

---

## Datos que usamos

La web consume datos estáticos en **JSON** servidos desde `public/`. Las fuentes originales pueden ser **Excel** (en `data/excel/`), que se exportan a JSON con scripts que usan la librería **xlsx**; el sitio solo lee los JSON.

| Dato | Archivo | Campos principales | Uso |
|------|---------|--------------------|-----|
| **Provincias** | `public/data/provincias.json` | PROVINCIA, SLUG, LAT, LON, FOTO_1/2/3, nombre_capital, dire_capital, lat_capital, lon_capital, des_1/2/3, ZONA | Mapa de provincias, fichas, breadcrumbs, filtros |
| **Actividades** | `public/data/actividades.json` | PROVINCIA, SLUG, ACTIVIDAD, LOCALIZACION, des_1/2, FOTO_1/2/3, LATITUD, LONGITUD | Listado, filtro por provincia, mapas con marcadores |
| **Escapadas** | `public/data/escapadas.json` | ID, TITULO, PROVINCIAS, DURACION, PDF, ZONA | Listado y enlaces a guías PDF |
| **Santa Fe** | `public/santa-fe/json/*.json` | noticias, planes, agencias, oficinas_informes, eventos, preguntas_frecuentes | Subsecciones de la provincia Santa Fe |

- **Imágenes:** en `public/` (carrusel home en `img/home/`, provincias en `provincias/img/`, actividades en `img/actividades/`, logos, etc.).
- **PDF:** guías de escapadas en `public/pdf/`; las rutas se referencian desde `escapadas.json` (campo `PDF`).
- **Excel:** quedan en `data/excel/` (fuente para generar JSON); no se sirven en la web ni se incluyen en el build.

---

## Tecnologías

| Área | Tecnología | Uso |
|------|------------|-----|
| **Framework** | Next.js 16 (App Router) | Rutas, SSR/estático, metadata, sitemap, robots |
| **UI** | React 19, TypeScript | Componentes y tipado |
| **Estilos** | Tailwind CSS 4, PostCSS | Utility-first, variables CSS, tema |
| **Mapas** | Leaflet, React-Leaflet | Mapas de ubicación de capitales y actividades (marcadores) |
| **Imágenes** | Sharp | Optimización de imágenes en build (Next.js) |
| **Datos (fuente)** | xlsx | Lectura de Excel para generar JSON (scripts en dev) |
| **Linting** | ESLint, eslint-config-next | Reglas y consistencia de código |
| **Fuentes** | Geist e Instrument Serif (next/font) | Texto y títulos del sitio |

El proyecto usa **Node.js 22.19+** (versión de CI en `.nvmrc`). No hay base de datos: todo el contenido se sirve desde archivos estáticos (JSON, imágenes, PDF).

---

## Diseño

Sistema visual **Universo Sur** (PR15), documentado en [docs/pr15/DESIGN-SYSTEM.md](docs/pr15/DESIGN-SYSTEM.md):

- **Tokens** en `app/globals.css` (`@theme` de Tailwind 4): fondo arena, tinta azul noche, lago andino para acciones, terracota para acentos y un color por región turística (Norte, Litoral, Centro, Cuyo, Buenos Aires y Patagonia). Todo color de texto supera 4,5:1.
- **Tipografía:** Instrument Serif para títulos y Geist para el texto, con `next/font` (archivos propios, sin pedidos a terceros) y escala fluida.
- **Componentes** en `components/ui/` (encabezados, botones, chips, avisos, estados vacíos, íconos, grillas con su `sizes`), `components/destinos/` (fichas futuras: fotos con crédito, fuentes, localidades, ubicaciones, atractivos, información práctica) y `components/publicidad/` (espacios reservados, hoy desactivados).
- **Navegación:** encabezado fijo con la sección activa, menú móvil accesible, ruta de navegación en las páginas interiores y pie con regiones.
- **Mapas (Leaflet):** el HTML trae una vista previa estática (las mismas teselas de OpenStreetMap y el mismo marcador) en un contenedor de alto fijo; Leaflet se descarga al tocar “Explorar mapa” o activarlo con el teclado. Así el mapa no desplaza el contenido ni retrasa el LCP. Detalles en [docs/PR-05-ESTABILIDAD.md](docs/PR-05-ESTABILIDAD.md).
- **Accesibilidad y SEO:** enlace para saltar al contenido, áreas táctiles de 44 px, foco visible, movimiento reducido respetado, textos alternativos y metadata por página.

---

## Cómo correr el proyecto

**Requisito:** Node.js 22.19+ (`nvm use`)

```bash
git clone https://github.com/IS03/Argentina-universo.sur.git
cd Argentina-universo.sur
npm install
```

- **Desarrollo:** `npm run dev` → http://localhost:3000
- **Producción:** `npm run build` y luego `npm start`

### Scripts

| Comando           | Uso                          |
|-------------------|------------------------------|
| `npm run dev`     | Servidor de desarrollo       |
| `npm run build`   | Build para producción        |
| `npm run start`   | Sirve el build (tras `build`)|
| `npm run lint`    | ESLint sin advertencias       |
| `npm run typecheck` | Tipos de rutas y TypeScript |
| `npm run validate` | Integridad de datos y assets |
| `npm test`        | Pruebas de regresión         |
| `npm run audit:seo` | Audita HTML de 106 páginas, sitemap, robots y redirects después del build |
| `npm run test:e2e` | E2E con Playwright (escritorio y móvil) sobre la build; usa Google Chrome del sistema |
| `npm run check`   | Lint, tipos, integridad, tests, build, auditoría SEO y E2E |

GitHub Actions ejecuta estos controles en cada PR y en `main`. Criterios de regiones,
compatibilidad de URLs, agenda y contrato de datos: [docs/DATA-ASSETS.md](docs/DATA-ASSETS.md).

---

## Estructura del repositorio

| Carpeta        | Contenido                                      |
|----------------|------------------------------------------------|
| `app/`         | Rutas y páginas (App Router): home, provincias, actividades, escapadas, seguridad, 404, sitemap, robots |
| `components/`  | Componentes React (Navbar, Footer, mapas, tarjetas, filtros, secciones Santa Fe, etc.) |
| `lib/`         | Utilidades, datos (getProvincias, getActividades, getEscapadas), `site-links.ts |
| `public/`      | Imágenes, JSON, PDF, assets estáticos          |
| `docs/`        | Documentación (SEO, imágenes, datos, indexación) |

---

## Documentación interna

En `docs/` hay notas sobre:

- SEO (enlazado interno, indexación, imágenes).
- Uso y convenciones de datos y assets.

Conviene mantener esa documentación al día cuando se cambien rutas, datos o criterios de SEO.

## SEO técnico y observabilidad

La identidad pública es **https://www.argentinauniversosur.com**, centralizada en
`lib/seo.ts`. Sitemap, canonical y Open Graph usan ese origen también en Preview,
donde se envían señales `noindex`. El sitemap no inventa fechas de modificación.
Catamarca usa `/provincias/catamarca` con redirección permanente desde la variante
histórica. Web Analytics y Speed Insights se integran en el layout raíz.

- [Indexación y pasos de Google Search Console](docs/SEO-INDEXACION.md).
- [Activaciones y comprobaciones en Vercel](docs/OBSERVABILIDAD-VERCEL.md).
