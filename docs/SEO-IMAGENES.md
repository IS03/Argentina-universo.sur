# Guía SEO: Imágenes optimizadas

Convenciones para que todas las imágenes de la web cumplan con SEO y rendimiento.

## 1. Nombre del archivo descriptivo

- **Usar**: minúsculas, guiones, sin espacios ni caracteres especiales.
- **Ejemplos**:
  - `paisaje-cataratas-iguazu.jpg`
  - `santa-fe-rosario-costanera.jpg`
  - `actividad-cabalgata-patagonia.jpg`
- **Evitar**: `1.jpg`, `IMG_1234.png`, `foto (copia).jpg`.

Si mantenés nombres genéricos (ej. `1.jpg`, `2.jpg`) en carpetas ya usadas, asegurate de que el **alt text** en el código sea siempre descriptivo.

## 2. ALT text en todas las imágenes

- **Todas** las imágenes deben tener el atributo `alt` descriptivo.
- Incluir contexto: lugar, actividad o propósito.
- **Ejemplos**:
  - `Paisaje de Santa Fe - Turismo Argentina Universo Sur`
  - `Cataratas del Iguazú - Turismo Argentina`
  - `Logo Argentina Universo Sur - Turismo en Argentina`

En el proyecto ya se usa:
- Hero home: alt por imagen del carrusel.
- Cards (provincias/actividades): alt con nombre de provincia/actividad y contexto.
- Carrusel: alt con título del destino + “Imagen X de N”.
- Logo navbar y footer: alt descriptivo del sitio/marca.

## 3. Tamaño optimizado

- **No subir imágenes enormes “al pedo”**: comprimir y redimensionar antes de subir.
- **Recomendaciones**:

| Uso              | Ancho máximo | Formato   | Peso orientativo |
|------------------|--------------|----------|-------------------|
| Hero / carrusel  | 1920 px      | JPG/WebP | &lt; 300 KB       |
| Cards (portadas) | 800 px       | JPG/WebP | &lt; 150 KB       |
| Logo             | según diseño | SVG/PNG  | &lt; 50 KB        |

- Next.js **Image** optimiza en build/servicio (redimensiona, puede servir WebP/AVIF). No usar `unoptimized` salvo que sea necesario.
- Indicar `sizes` en las imágenes con `fill` para que el navegador elija el tamaño correcto y mejore LCP/CLS.

## 4. Dónde se aplica en el código

- **Hero (home)**: `app/page.tsx` — array `altImagenesHome`, `sizes="100vw"`, `quality={85}`.
- **Cards**: `ProvinciaCard.tsx`, `ActividadCard.tsx` — alt descriptivo, `sizes` para grid responsive.
- **Carrusel**: `Carrusel.tsx` — alt con posición, `sizes` y `quality={85}`.
- **Logos**: `Navbar.jsx`, `Footer.tsx` — alt descriptivo; Footer usa `next/image` para el logo.

Al añadir nuevas imágenes (páginas de provincia, actividades, etc.), seguir estas reglas: nombre descriptivo, alt en todas, tamaño adecuado y sin `unoptimized` innecesario.
