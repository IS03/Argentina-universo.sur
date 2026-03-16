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
- **Mapa interactivo** de Argentina (Leaflet) con las 24 provincias.
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
| **Mapas** | Leaflet, React-Leaflet | Mapa de Argentina, provincias, actividades (marcadores) |
| **Imágenes** | Sharp | Optimización de imágenes en build (Next.js) |
| **Datos (fuente)** | xlsx | Lectura de Excel para generar JSON (scripts en dev) |
| **Linting** | ESLint, eslint-config-next | Reglas y consistencia de código |
| **Fuentes** | Geist Sans, Geist Mono (Next/font) | Tipografía del sitio |

El proyecto usa **Node.js 18+**. No hay base de datos: todo el contenido se sirve desde archivos estáticos (JSON, imágenes, PDF).

---

## Diseño

La interfaz apuesta por una estética **clara y cálida**, inspirada en tonos tierra y crema, con buena legibilidad y jerarquía visual.

- **Paleta:** fondo crema/beige (`#FAF8F3`, `#F5F1E8`, `#E8DDD0`), marrones para texto y acentos (`#5A4E3D`, `#6B5D47`, `#A68B5B`, `#C9B99B`, `#D4C4B0`). Variables CSS en `app/globals.css` (`--background`, `--foreground`, `--primary`, `--accent`, etc.) para mantener consistencia.
- **Tipografía:** **Geist Sans** como fuente principal y **Geist Mono** para código o detalles; cargadas con `next/font` y `display: swap`.
- **Fondo:** gradiente suave en el `body` (crema a beige) con `background-attachment: fixed`. Scroll suave (`scroll-behavior: smooth`).
- **Navbar:** barra fija con gradiente horizontal (crema/beige), `backdrop-blur`, borde inferior discreto y sombra. Enlaces en mayúsculas con tracking ancho; hover con subrayado animado (gradiente dorado/marrón). Menú móvil a pantalla completa con el mismo estilo.
- **Contenido:** contenedores con `max-w-7xl` y padding responsive; títulos en mayúsculas con tracking; tarjetas (provincias, actividades, escapadas) con imágenes, texto y enlaces bien separados.
- **Mapas (Leaflet):** z-index ajustados en CSS para que no tapen la navbar; controles de zoom y popups visibles. Integración con el resto del diseño (bordes, sombras si aplican).
- **Responsive:** breakpoints de Tailwind (sm, md, lg); menú hamburguesa en móvil; grid y flex adaptados según ancho de pantalla.
- **Accesibilidad y SEO:** textos alternativos en imágenes, `aria-label` en navegación y enlaces, estructura de encabezados y metadata por página (título, descripción, Open Graph, Twitter).

---

## Cómo correr el proyecto

**Requisito:** Node.js 18+

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
| `npm run lint`    | ESLint                       |

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
