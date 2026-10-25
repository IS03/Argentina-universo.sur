# Auditoría visual y funcional previa (25/10/2026)

Se revisaron https://www.argentinauniversosur.com (Vercel) y
https://argentina-universo-sur-preview.pages.dev (Cloudflare Pages, `main` con PR #14) en escritorio
(1440 × 900) y móvil (Pixel 7, 412 × 915), con movimiento reducido y sin cargar Google. Script:
`scripts/pr15/capture.mjs` (capturas y datos de cada página). Las dos versiones se ven igual salvo
el banner de cookies de producción y las rutas de filtro del export estático.

## Medidas de partida

| Página (Preview, móvil) | Alto del documento | Objetivos táctiles < 24 px | Enlace «saltar al contenido» |
| --- | ---: | ---: | --- |
| Portada | 2.991 px | 9 | No |
| Provincias | 8.752 px | 10 | No |
| Mendoza | 2.756 px | 10 | No |
| Actividades | 22.007 px | 10 | No |
| Actividades (Salta) | 2.549 px | 10 | No |
| Teatro Colón | 2.892 px | 9 | No |
| Escapadas | 6.018 px | 10 | No |

En escritorio, 14–15 objetivos chicos por página. Rendimiento de laboratorio en
[RESULTS.md](RESULTS.md).

## Problemas principales y solución aplicada

| # | Problema | Evidencia | Solución en PR15 |
| --- | --- | --- | --- |
| 1 | **Identidad débil**: el encabezado solo muestra el escudo, sin el nombre del sitio; paleta marrón monocroma; títulos en mayúsculas con tracking amplio en todas las páginas | Capturas `antes-*` | Marca tipográfica «Argentina / Universo Sur», serif de títulos, colores por región y mayúsculas solo en antetítulos |
| 2 | **H1 de portada con poco contraste**: texto con degradado beige recortado sobre fotos claras, y un brillo azul al pasar el mouse | Portada escritorio y móvil | Texto blanco sólido sobre un velo que garantiza 4,5:1 en cualquier foto |
| 3 | **Hero fijo de 100vh con desenfoque y opacidad por scroll**: JavaScript en cada frame y filtros sobre una foto de pantalla completa (costoso en teléfonos); el CTA era un botón que solo funciona con JS | `HomeScrollStage` | Hero en flujo normal (80svh máx.), CTA como ancla real; el carrusel pausa fuera de pantalla con `IntersectionObserver` |
| 4 | **Navegación sin contexto**: sin sección activa, sin ruta de navegación, sin enlace para saltar al contenido; menú móvil en mayúsculas alineado a la derecha | Todas las páginas | `aria-current`, migas, «Saltar al contenido», menú con descripciones y foco gestionado |
| 5 | **Nombre accesible distinto del texto visible**: «Viaja por Argentina» se anunciaba como «Viajar por provincias de Argentina» (WCAG 2.5.3) | `NAV_ANCHORS` | «Viaja por Argentina: provincias y destinos» + prueba unitaria |
| 6 | **Provincias sin estructura**: 24 tarjetas en una sola grilla, mapa beige pequeño, filtro por región solo en estado del navegador (sin URL ni funcionamiento sin JS) | /provincias | Listado agrupado por región en el HTML, leyenda del mapa con anclas (`#region-norte`…) y mapa coloreado por región |
| 7 | **Actividades interminable en móvil**: H1 de tres líneas ocupa la primera pantalla y 72 tarjetas en una columna (22.007 px); en Pages, 25 enlaces subrayados en bloque | /actividades móvil | Lista compacta con miniatura, filtro con conteo (`aria-live`) y chips desplazables que funcionan sin JS |
| 8 | **Tarjetas con texto sobre foto** sin control de contraste (título blanco sobre degradado variable) en actividades | Tarjetas | Actividades con texto debajo de la foto; provincias con degradado inferior fijo |
| 9 | **Escapadas sin jerarquía**: 23 cajas iguales con «Ver PDF» y sin advertir que cada guía pesa entre 14 y 57 MB; filtro distinto en móvil (select) y escritorio (chips) | /escapadas | Tarjetas por región con provincia y duración, peso de cada PDF, aviso de datos móviles y chips en todos los anchos |
| 10 | **Contraste insuficiente**: `#A68B5B` como texto/hover (3,0:1) y la ubicación de las actividades en `text-gray-400` (≈2,5:1) | Detalle de actividad | Tokens con contraste medido; `#A68B5B` reemplazado por `lago-600` en todo el sitio |
| 11 | **Objetivos táctiles chicos**: enlaces internos de 20 px de alto en filas | Auditoría | Botones, chips y enlaces de 44 px; migas de 24 px |
| 12 | **Fondo con degradado fijo** (`background-attachment: fixed`): franjas visibles y repintado al desplazar | Capturas completas | Fondo plano `arena-50` |
| 13 | **Pie genérico** dominado por el logo de Santa Fe y tres columnas con texto de relleno | Pie | Pie oscuro con marca, enlaces rápidos, regiones y el logo en una placa |
| 14 | **`sizes` de imágenes solo correctos en Pages** (los inyectaba `scripts/pages/build.mjs` con reemplazos de texto) | `build.mjs` | `sizes` en el código fuente junto a cada grilla (`components/ui/grillas.ts`), compartidos por Vercel y Pages |

## Observaciones que no se corrigieron (fuera de alcance)

- Algunas actividades tienen en `LOCALIZACION` un lema en lugar de la ubicación (p. ej. Teatro Colón,
  Bañado La Estrella). Es un dato del catálogo: no se modificó.
- `/seguridad`, `/privacidad` y las subpáginas de Santa Fe solo recibieron los tokens de color y el
  nuevo encabezado y pie; su maquetación queda para la etapa 2 ([PROPUESTA.md](PROPUESTA.md)).
- Los derechos de las fotografías existentes siguen pendientes de acreditación (PR11).
