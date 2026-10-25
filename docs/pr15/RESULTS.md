# Resultados de PR15

Fecha: 25/10/2026. macOS, Node 22.19.0, Chrome del sistema. Base `main` `d5dd5bf`.

## Pruebas y auditorías (todas locales, sobre el código final)

| Verificación | Resultado |
| --- | --- |
| `npm run lint` | Sin errores ni advertencias |
| `npm run typecheck` | OK |
| `npm run validate` (datos, Supabase, Pages, editorial PR12–PR14) | OK, 0 errores |
| `npm test` | **107/107** (6 nuevas en `tests/pr15-rediseno.test.mjs`; 2 retiradas, ver abajo) |
| `npm run build` | OK |
| `npm run editorial:check` | 24 borradores, 0 publicables, 0 redirects de PDF, 0 errores |
| `npm run editorial:audit-next` | 24 fichas retenidas; 132 HTML, 1.027 prerenderizados y 24 JS auditados; 0 errores |
| `npm run audit:seo` | **106 páginas, 0 errores** |
| `npm run test:e2e` | **109 aprobadas, 9 omitidas** (las mismas omisiones por perfil escritorio/móvil que en `main`) |
| `npm run build:pages -- --production-audit` + `audit.mjs production-audit` | 106 páginas canónicas, 126 recursos, 0 errores |
| `npm run build:pages -- --consent-test` + `audit.mjs consent-test` | 106 páginas canónicas, 126 recursos, 0 errores |
| `npm run build:pages` + `audit.mjs preview` | 106 páginas canónicas, 103 recursos, 0 errores; 24 fichas retenidas |
| `npm run test:pages` con los cinco servidores de `docs/pr11/README.md` (4401, 4402, 4403 con reglas de zona, 4404 y Wrangler 4410) | **70 aprobadas, 2 omitidas** |

Incidente durante la verificación: al reiniciar Wrangler, un proceso `workerd` anterior seguía
ocupando el puerto y 8 pruebas `wrangler-*` fallaron por falta de servidor. Se cerró ese proceso
(iniciado en esta misma sesión), se levantó Wrangler de nuevo y la corrida completa dio 70/2.

### Pruebas modificadas y por qué

No se cambió ninguna aserción para que pase sin que el comportamiento haya cambiado a propósito:

| Prueba | Cambio | Motivo |
| --- | --- | --- |
| `tests/rendering.test.mjs` «el estado del hero…» y `tests/integrity.test.mjs` «la opacidad del hero…» | Retiradas | Se eliminó a propósito el hero fijo con desenfoque y opacidad por scroll (`getHeroScrollState`, `getHeroOpacity`) |
| `tests/e2e/rendering.spec.ts` «el scroll difumina el hero…» | Reemplazada por «el CTA es un ancla a destacadas, también sin JavaScript» | El CTA pasó de botón con JS a ancla; la prueba nueva verifica el HTML sin JS, la navegación y que el encabezado fijo no tape el título |
| `tests/e2e/escapadas.spec.ts` filtro regional | Usa los chips en móvil y escritorio | El select móvil se reemplazó por chips (mismo nombre de grupo) |
| `tests/escapadas-editorial.test.mjs` | Solo el cargador: transpila también los componentes que importa `TripArticle` | Las aserciones (marcado de avisos operativos, fechas ISO, anclas, sin scripts ni anuncios) no cambiaron |

Pruebas nuevas: regiones (24 provincias, anclas, tokens), grillas y `sizes`, publicidad desactivada
y sin proveedores, peso de los PDF contra los archivos y el inventario de PR12, y nombre accesible
del menú que contiene el texto visible.

## Seguridad editorial y SEO

- Las 24 fichas de `content/escapadas/` siguen en `draft`, sin cambios de estado, permiso ni
  contenido. No aparecen en HTML, RSC ni JS públicos (Next, tres modos de Pages y E2E).
- Los 24 PDF originales no se tocaron; los 23 enlaces «Ver PDF» siguen apuntando a las mismas rutas
  (Preview: URLs vigentes de producción).
- 106 URL indexables, canonical, sitemap, robots y redirecciones (incluido `catarmaca`) sin cambios.
  No se agregaron rutas.
- Filtros sin JS: las 24 páginas provinciales de Pages entregan sus tres actividades y los chips
  son enlaces reales; en Vercel los chips llevan a `/actividades?provincia=…` (rewrite existente).
  El listado de provincias por región y la leyenda del mapa funcionan sin JS (anclas).
- GA4 y el consentimiento no cambiaron (`MedicionConConsentimiento`, `PagesConsent` y sus pruebas).

## Accesibilidad

| Página (Pages local) | Alto móvil antes → después | Objetivos < 24 px móvil antes → después | Escritorio antes → después |
| --- | ---: | ---: | ---: |
| Portada | 2.991 → 4.454 px | 9 → 0 | 14 → 0 |
| Provincias | 8.752 → 6.938 px | 10 → 0 | 15 → 0 |
| Mendoza | 2.756 → 3.378 px | 10 → 1 | 15 → 1 |
| Actividades | **22.007 → 11.388 px** | 10 → 0 | 15 → 0 |
| Actividades (Salta) | 2.549 → 2.440 px | 10 → 0 | 15 → 0 |
| Teatro Colón | 2.892 → 3.654 px | 9 → 0 | 15 → 1 |
| Escapadas | 6.018 → 7.657 px | 10 → 0 | 15 → 0 |
| Seguridad (etapa 2) | 4.812 → 5.261 px | 10 → 4 | 15 → 4 |

El objetivo chico restante en Mendoza y Teatro Colón es la atribución de OpenStreetMap dentro del
mapa (enlace en línea, excepción de WCAG 2.5.8). Los de Seguridad son su fila de enlaces internos,
que se rediseña en la etapa 2.

Además: «Saltar al contenido» en todas las páginas, `aria-current` en navegación y filtros, conteo
de resultados con `aria-live`, chips con `aria-pressed`, contraste de texto ≥ 4,5:1 medido para cada
token, foco visible de 3 px, movimiento reducido respetado, nombres accesibles verificados por E2E
en cinco rutas y nombre accesible del menú que incluye el texto visible (WCAG 2.5.3). No se usó un
lector de pantalla real: queda como tarea de la etapa 2.

## Rendimiento (laboratorio)

`scripts/pr15/benchmark.mjs`, misma metodología que PR11: contextos fríos, móvil Pixel 7 con
1,6 Mbps / 150 ms / CPU ×4, escritorio 20 Mbps / 40 ms, movimiento reducido, teselas simuladas y
Google bloqueado; mediana de 3 cargas; CLS hasta load + 1,8 s. «Antes» es el artefacto Preview de
`main` (`d5dd5bf`) y «después» el de esta rama, ambos servidos con `scripts/pages/serve.mjs`. No es
CrUX, Lighthouse ni medición del CDN.

| Página | Perfil | KB antes | KB después | Δ KB | FCP antes | FCP después | LCP antes | LCP después | CLS antes / después | Requests | JS KB |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| / | móvil | 913,7 | 902,9 | −1,2 % | 852 | 836 | 852 (P) | 836 (P) | 0 / 0 | 21 / 23 | 155,2 / 158,3 |
| /provincias | móvil | 1.206,9 | 681,8 | **−43,5 %** | 728 | 744 | 728 (H1) | 744 (P) | 0 / 0 | 35 / 27 | 189,7 / 160,2 |
| /provincias/santa_fe | móvil | 635,7 | 715,4 | +12,5 % | 784 | 768 | 784 (P) | 768 (P) | 0 / 0 | 45 / 46 | 195,7 / 170,6 |
| /actividades | móvil | 930,5 | 600,5 | **−35,5 %** | 732 | 736 | 732 (H1) | 736 (H1) | 0 / 0 | 35 / 32 | 189,7 / 162,0 |
| /actividades/vivir-la-magia-del-teatro-colon | móvil | 457,6 | 476,1 | +4,1 % | 756 | 732 | 756 (P) | 732 (P) | 0 / 0 | 21 / 22 | 167,4 / 163,2 |
| /escapadas | móvil | 436,1 | 367,2 | −15,8 % | 724 | 736 | 724 (P) | 736 (P) | 0 / 0 | 30 / 20 | 189,7 / 161,1 |
| / | escritorio | 671,0 | 625,7 | −6,8 % | 172 | 164 | 172 (P) | 164 (H1) | 0 / 0 | 38 / 38 | 189,7 / 166,7 |
| /provincias | escritorio | 1.082,0 | 556,9 | **−48,5 %** | 156 | 144 | 156 (H1) | 144 (H1) | 0 / 0 | 46 / 41 | 189,7 / 166,7 |
| /provincias/santa_fe | escritorio | 822,5 | 744,7 | −9,5 % | 160 | 164 | 160 (P) | 164 (P) | 0 / 0 | 73 / 67 | 230,3 / 179,1 |
| /actividades | escritorio | 819,2 | 692,1 | −15,5 % | 164 | 172 | 164 (H1) | 172 (H1) | 0 / 0 | 53 / 50 | 189,7 / 166,7 |
| /actividades/vivir-la-magia-del-teatro-colon | escritorio | 558,9 | 506,2 | −9,4 % | 148 | 156 | 148 (H1) | 156 (H1) | 0 / 0 | 50 / 49 | 201,9 / 171,6 |
| /escapadas | escritorio | 431,1 | 392,9 | −8,8 % | 152 | 164 | 152 (H1) | 164 (P) | 0 / 0 | 33 / 34 | 189,7 / 166,7 |

Lectura honesta:

- **CLS 0 en las 12 combinaciones** y ninguna carga con errores.
- FCP y LCP quedan dentro de ±16 ms de la base en todas las páginas (ruido de la medición).
- **Santa Fe móvil +12,5 % de bytes**: el carrusel ahora ocupa el ancho real del teléfono y pide la
  variante WebP de 1280 px en lugar de la de 960. Está bajo el pliegue y no cambia FCP ni LCP
  (784 → 768 ms). Teatro Colón móvil +4,1 % por la misma razón.
- JavaScript transferido baja en 11 de 12 combinaciones (portada móvil +3,1 KB).
- Se probaron y descartaron variantes en el camino: el menú móvil cerrado dentro del viewport hacía
  que Next precargara 4 rutas (12 pedidos extra en la portada); una grilla de fotos de dos columnas
  en /actividades móvil llevaba el LCP a 1.916 ms (948 ms con `preload`, a costa de +136 ms de FCP).
  La versión final usa menú fuera de pantalla sin prefetch y una lista con miniaturas de 320 px.

## Peso del artefacto Preview

| | Archivos | Bytes |
| --- | ---: | ---: |
| `main` (antes) | 2.038 | 101.810.311 |
| PR15 | 2.035 | 103.466.285 (+1,6 %) |

La diferencia viene del HTML y los datos RSC de las 134 páginas (encabezado, pie con regiones y
enlazado interno: +1,4 MB sin comprimir en total); las variantes WebP no cambiaron (80.004.852
bytes). Lo transferido por visita, comprimido, baja en la mayoría de las páginas (tabla anterior).
CSS: 95,7 → 102,0 KB sin comprimir. Fuentes: Instrument Serif (un archivo latino) reemplaza a Geist Mono, que no
se usaba; siguen siendo dos familias. Sin dependencias nuevas en `package.json`.
