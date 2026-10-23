# PR 03 — Rendimiento estructural y Server Components

## Arquitectura

| Ruta | Antes | Después |
| --- | --- | --- |
| `/` | `HomeContent` cliente (26 KB de fuente): `fetch` de `provincias.json` y `actividades.json`, estado “Cargando…”, re-render completo en cada evento de scroll, altura medida con `ResizeObserver`. | `HomeContent` es Server Component. Islas cliente: `HeroCarousel`, `HomeScrollStage`, `ExplorarDestinosButton`, `ContinuarExplorando`. |
| `/actividades` | `ActividadesContent` cliente dentro de `Suspense`: el HTML estático solo tenía “Cargando actividades…”; luego `fetch` de ambos JSON. | `ActividadesContent` es Server Component, prerenderizado una vez por filtro (ver “Filtro por URL”). El HTML de `/actividades` incluye las 72 tarjetas y el de `?provincia=…`, solo las de esa provincia. `ActividadesExplorer` (cliente) solo cambia el filtro en memoria. |

### Qué pasó de cliente a servidor

- Lectura y normalización de catálogos: `lib/data.ts` en el build, sin `fetch` desde el navegador.
- Provincias destacadas, CTA final, enlazado interno, `<h1>` y textos del hero.
- El hover del `<h1>` pasó de `onMouseEnter`/`onMouseLeave` a clases CSS.
- Encabezado, navegación interna y grilla inicial de `/actividades`.

### Qué queda en el cliente y por qué

| Componente | Motivo |
| --- | --- |
| `HeroCarousel` | Temporizador del carrusel. Monta como máximo 3 capas (anterior, actual, siguiente); la siguiente se descarga después del evento `load` y solo se avanza cuando ya cargó. No rota si la pestaña está oculta, si el hero ya no se ve o con `prefers-reduced-motion: reduce`. |
| `HomeScrollStage` | Efectos de scroll. Escribe variables CSS (`--hero-*`) y el `transform` del contenido una vez por frame (`requestAnimationFrame`), sin estado de React. El layout es CSS puro (hero `sticky` + contenido en el flujo), así que no se miden alturas. |
| `ExplorarDestinosButton` | Desplazamiento suave con compensación del navbar. |
| `ContinuarExplorando` | Lee `localStorage`. Solo si hay historial pide `/api/catalogo-resumen` (JSON estático del build, 4 KB gzip, `noindex`). |
| `ActividadesExplorer` | Recibe la selección inicial del servidor, filtra en memoria y sincroniza la URL con `history.replaceState`, sin navegar ni pedir datos. Un componente mínimo (`SincronizarUrl`, en su propio `Suspense`) mantiene la URL como fuente de verdad en atrás/adelante. |

### Imágenes del hero

- Se eliminó la precarga manual con `new window.Image()`, que descargaba los JPG originales (~290 KB cada uno) además de las versiones optimizadas.
- Solo la primera foto tiene `preload` y `fetchPriority="high"` (antes, dos imágenes eran `priority`). Las demás son `fetchPriority="low"`.
- Se conservan las nueve fotografías, el intervalo de 5 s, el fundido de 1,5 s y el efecto de desenfoque. El desenfoque se aplica una vez al contenedor y no a cada imagen.

## Medición

Build de producción (`next build` + `next start`) de `main` (f161df2) y de esta rama, en la misma
máquina y con las mismas condiciones. Herramientas: Lighthouse 13 (Chrome 154, headless), Playwright
1.64 con Chrome del sistema y Chrome DevTools Protocol.

**Limitaciones.** Servidor local: el TTFB no representa Vercel. Lighthouse en modo simulado (lantern)
estima a partir del grafo de pedidos y es pesimista con imágenes que compiten por ancho de banda. Los
scripts de Vercel Analytics y Speed Insights responden 404 fuera de Vercel en ambas versiones.

### Lighthouse simulado (mediana de 7 corridas, `/` y `/actividades`)

| Página | Perfil | Score | FCP (ms) | LCP (ms) | TBT (ms) | CLS | Hilo principal (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Móvil | 95 → 94 | 758 → 758 | 2.924 → 3.077 | 8 → 8 | 0 → 0 | 414 → 342 |
| `/` | Escritorio | 100 → 100 | 207 → 207 | 628 → 806 | 0 → 0 | 0 → 0 | 118 → 106 |
| `/actividades` | Móvil | 97 → 99 | 757 → 906 | 2.549 → 2.114 | 12 → 11 | 0 → 0 | 546 → 523 |
| `/actividades` | Escritorio | 99 → 99 | 206 → 245 | 838 → 889 | 0 → 0 | 0 → 0 | 165 → 168 |

En ambas versiones el elemento LCP de la portada es el párrafo del hero, no la foto. La diferencia
simulada se debe a que las tres fotos de “Provincias destacadas” ahora están en el HTML inicial y el
simulador las cuenta como competencia; la medición observada (abajo) no reproduce esa regresión. En
`/actividades`, el HTML gzip pasa de 6 KB a 23 KB (las 72 tarjetas) y supera la primera ventana TCP,
lo que explica el FCP simulado de +150 ms.

### Medición observada con limitaciones reales (mediana de 7, versiones alternadas)

Móvil: Pixel 7 emulado, red 150 ms RTT y 1,6 Mbps, CPU 4× más lenta, caché deshabilitada.

| Página | Perfil | FCP (ms) | LCP (ms) | Contenido turístico en el DOM (ms) | Evento load (ms) | CLS |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | Móvil | 856 → 840 | 856 → 840 | 3.362 → **790** | 8.405 → 4.207 | 0 → 0 |
| `/actividades` | Móvil | 808 → 784 | 1.752 → **784** | 2.271 → **761** | 1.665 → 4.152 | 0 → 0 |
| `/` | Escritorio | 44 → 44 | 44 → 44 | 87 → 17 | 61 → 63 | 0 → 0 |
| `/actividades` | Escritorio | 48 → 56 | 120 → 100 | 90 → 32 | 55 → 66 | 0 → 0 |

El `load` de `/actividades` llega después porque las fotos de las tarjetas ahora forman parte de la
carga inicial; antes se pedían después del `load`, cuando terminaba el `fetch` de los JSON.

### Red durante la carga (Playwright, Chrome sin limitaciones, 4 s después de `load`)

| Página | Perfil | Pedidos | JS (KB transferidos) | Imágenes (KB) | Total (KB) | `fetch` a `/data/*.json` | JPG originales del hero |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Móvil | 33 → 28 | 148,3 → 145,2 | 1.297 → 722 | 1.669 → 1.070 | 2 → 0 | 2 → 0 |
| `/` | Escritorio | 52 → 48 | 157,9 → 152,6 | 1.378 → 810 | 1.789 → 1.203 | 2 → 0 | 2 → 0 |
| `/actividades` | Móvil | 53 → 50 | 160,7 → 155,4 | 447 → 439 | 864 → 846 | 2 → 0 | — |
| `/actividades` | Escritorio | 103 → 100 | 160,7 → 155,4 | 765 → 758 | 1.232 → 1.221 | 2 → 0 | — |

El JavaScript descargado baja poco (−2 % a −3 %): la mayor parte es el runtime de React/Next.js,
común a todas las páginas. La reducción importante está en el trabajo que ese JavaScript hace.

### Trabajo del navegador durante el scroll de la portada

120 eventos de rueda (60 hacia abajo y 60 hacia arriba), métricas de CDP `Performance.getMetrics`.

| Perfil | Script (ms) | Recálculos de estilo | Tiempo total de tareas (ms) |
| --- | --- | --- | --- |
| Escritorio | 106,7 → 22,8 (−79 %) | 281 → 149 | 304 → 230 |
| Móvil | 177,0 → 38,8 (−78 %) | 341 → 139 | 422 → 303 |

### HTML inicial (sin JavaScript)

| Página | Enlaces a actividades | Enlaces a provincias | “Cargando…” | Tamaño gzip |
| --- | --- | --- | --- | --- |
| `/` | 0 → 0 | 0 → 3 | sí → no | 7,3 → 9,0 KB |
| `/actividades` | 0 → 72 | 0 → 0 | sí → no | 6,2 → 23,1 KB |

### Páginas sin cambios de código

`/provincias`, `/provincias/santa_fe` y el detalle de actividad no se modificaron. Sus métricas no
cambian dentro del margen de variación. El CLS preexistente (`/provincias` 0,19 en móvil, detalle de
actividad 0,31) queda documentado en “Pendientes”.

## Filtro por URL (revisión posterior al merge del PR 03)

### Problema

`/actividades` es estática y el servidor no ve `?provincia`. En el PR 03, el HTML de
`/actividades?provincia=santa_fe` traía las 72 tarjetas y el filtro se aplicaba al hidratar.
Mediana de 5 corridas en móvil lento (Pixel 7, 150 ms RTT, 1,6 Mbps, CPU 4×):

| Escenario | PR 03 (main) | Corrección |
| --- | --- | --- |
| Carga directa `?provincia=santa_fe` | 72 tarjetas y “Todas las provincias” durante ~1,4 s | 3 tarjetas correctas desde el primer pintado (0 ms incorrectos) |
| Carga directa `?provincia=catarmaca` | ~1,4 s de contenido incorrecto | 3 tarjetas de Catamarca desde el primer pintado |
| CLS en esas cargas | 0–0,001 | 0–0,001 |
| Elección en el select antes de hidratar | Se perdía (3 de 3): volvía a “todas” | Se conserva y se aplica (3 de 3) |
| Enlace “Ver qué hacer en …” desde la provincia | Correcto (navegación cliente) | Correcto |
| Atrás/adelante y recarga tras cambiar el filtro | Correcto | Correcto (igual que main) |

No había saltos de diseño medibles: el problema era contenido incorrecto visible y la elección perdida.

### Solución

- `app/actividades/por-provincia/[provincia]` prerenderiza 25 variantes estáticas en el build: las 24
  provincias y una sin resultados.
- Los rewrites `beforeFiles` de `next.config.ts` (`ACTIVIDADES_FILTRO_REWRITES` en
  `lib/site-links.ts`) sirven cada variante bajo la URL pública. La URL no cambia y la página sigue en
  CDN (`s-maxage`). El alias `catarmaca` va a Catamarca; un valor desconocido muestra el listado vacío,
  como antes; un valor vacío muestra todas.
- La ruta interna redirige (308) a `/actividades?provincia=…`. La metadata y el canonical siguen
  siendo los de `/actividades`.
- El explorador ya no usa `useSearchParams` sobre la grilla: React hidrata el HTML existente en lugar
  de reemplazarlo. React 19 no reescribe el valor de un `<select>` al hidratar, así que una elección
  hecha antes se adopta al montar.
- `seleccionDesdeParametro` replica en el navegador la resolución de los rewrites. Una prueba unitaria
  verifica que ambas coincidan para cada valor posible.

Lighthouse móvil, mediana de 5, PR 03 → corrección: `?provincia=santa_fe` FCP 907 → 756 ms, hilo
principal 543 → 461 ms, imágenes pedidas 16 → 5, HTML gzip 23,1 → 13,9 KB. `/actividades` sin filtro:
TBT 14 → 9 ms, hilo principal 538 → 501 ms, JS +0,7 KB.

## Pruebas

- `npm test`: 30 pruebas (23 previas + 7 nuevas en `tests/rendering.test.mjs`).
- `npm run test:e2e`: 22 escenarios × escritorio y móvil (Playwright, Chrome del sistema). Fallan si hay
  errores de consola o de hidratación, o pedidos a `/data/*.json`. Contra la base del PR 03 fallan 14;
  contra el main posterior al merge fallan las 4 pruebas del filtro por URL que cubren el problema
  (×2 perfiles). Las otras 3 de ese bloque protegen comportamiento que ya era correcto.
- `npm run audit:seo`: 106 páginas, 0 errores.

## Pendientes detectados (fuera del alcance)

1. **Menú móvil (bug preexistente):** los enlaces son `inline` con `py-6` y el relleno de cada uno tapa
   el texto del anterior. Tocar “Qué hacer” abre “Escapadas”. Está documentado con un `test.fixme`.
2. **CLS del detalle de actividad (0,31 en móvil):** el mapa Leaflet (`ssr: false`) aparece sin espacio
   reservado y empuja la descripción. Reservar el espacio deja el CLS en 0, pero el LCP pasa a ser una
   tesela de OpenStreetMap: 2,7 s → 5,7 s en Lighthouse móvil. Requiere una decisión de diseño, por
   ejemplo una vista previa estática del mapa o mover la descripción.
3. **CLS de `/provincias` (0,19 en móvil):** el SVG del mapa se descarga con `fetch` y se inserta sin
   relación de aspecto reservada.
4. **`/provincias`:** `ViajeArgentina` recibe las descripciones completas de las 24 provincias, que no
   usa. Se pueden reducir con los mismos resúmenes de este PR.
5. **Error de hidratación intermitente en `/provincias/santa_fe`** (React #418, ~1 de 20 cargas). Ocurre
   igual en main antes y después de este cambio y no afecta a `/actividades` (0 de 20).
