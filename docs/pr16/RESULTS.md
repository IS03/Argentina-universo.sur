# Resultados de PR16

Fecha: 25/10/2026. macOS, Node 22.19.0, Chrome del sistema. Base `main` `92d4880` (PR #15).

## Pruebas y auditorías (sobre el código final)

| Verificación | Resultado |
| --- | --- |
| `npm run lint` | Sin errores ni advertencias |
| `npm run typecheck` | OK |
| `npm run validate` | OK, 0 errores |
| `npm test` | **112/112** (5 nuevas en `tests/pr16-rediseno.test.mjs`) |
| `npm run build` | OK |
| `npm run editorial:check` | 24 borradores, 0 publicables, 0 redirects de PDF, 0 errores |
| `npm run editorial:audit-next` | 24 fichas retenidas; 132 HTML, 1.027 prerenderizados y 24 JS; 0 errores |
| `npm run audit:seo` | **106 páginas, 0 errores** |
| `npm run test:e2e` | **119 aprobadas, 9 omitidas** (10 nuevas en `tests/e2e/pr16.spec.ts`; omisiones por perfil, como en `main`) |
| `build:pages` + `audit.mjs` preview / production-audit / consent-test | 106 páginas canónicas, 0 errores en los tres; 24 fichas retenidas |
| `npm run test:pages` (4401, 4402, 4403 con reglas de zona, 4404, Wrangler 4410) | **70 aprobadas, 2 omitidas** |

La batería completa se corrió cuatro veces: cada corrección posterior a una medición (CLS de Eventos
y de la 404, encaje de las filas de chips, peso de la 404) obligó a repetirla entera sobre el código
nuevo. Los números de esta página son los de la última corrida.

### Pruebas modificadas y nuevas

- **Modificada**: `tests/pr15-rediseno.test.mjs`, aserción de `GRILLA_DESTACADAS`/`SIZES_DESTACADAS`.
  Las destacadas pasaron a propósito a una fila desplazable en teléfonos (78 % del ancho). La prueba
  sigue exigiendo que grilla y `sizes` coincidan, y además verifica el techo de `SIZES_ANCHO_COMPLETO`.
- **Nuevas unitarias** (`tests/pr16-rediseno.test.mjs`):
  - secciones de Santa Fe contra las URL indexables;
  - coincidencia exacta entre la página de Eventos y el reemplazo de `build.mjs`;
  - números de emergencia;
  - prohibición de emojis y estilos del diseño anterior;
  - textos y estilo único del consentimiento.
- **Nuevas E2E** (`tests/e2e/pr16.spec.ts`, escritorio y móvil):
  - preguntas frecuentes sin JavaScript;
  - emergencias antes de los consejos en móvil y el índice de temas;
  - chip activo visible en las cinco subsecciones de Santa Fe;
  - filtro de Agencias con conteo;
  - 404 que responde 404 sin nombrar borradores.
- Ninguna otra prueba cambió. Las E2E de consentimiento, accesibilidad, mapas, filtros y SEO pasan
  sin modificaciones.

## Seguridad editorial, SEO y analíticas

- 24 fichas de `content/escapadas/` en `draft`, sin cambios; ausentes de HTML, RSC y JS públicos en
  Next y en los tres modos de Pages.
- 106 URL indexables, canonical, sitemap, robots y redirecciones sin cambios; no se agregaron rutas.
- GA4, Vercel Analytics/Speed Insights y el consentimiento sin cambios de comportamiento (mismas E2E).
- Filtros de actividades y provincias sin JS como antes.

## Rendimiento (laboratorio)

`scripts/pr15/benchmark.mjs` (metodología de PR11): contextos fríos; móvil Pixel 7 con 1,6 Mbps,
150 ms y CPU ×4; escritorio 20 Mbps y 40 ms. Movimiento reducido, Google bloqueado, mediana de 3.
«Antes» es el artefacto Preview de `main` `92d4880` y «después» el de esta rama, ambos servidos
localmente. No es CrUX ni el CDN de Cloudflare.

| Página | Perfil | KB antes | KB después | Δ KB | FCP antes / después | LCP antes / después | CLS antes / después | Requests | JS KB |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| / | móvil | 902,9 | 722,0 | −20,0 % | 824 / 768 | 824 / 768 | 0,0000 / 0,0000 | 23 / 23 | 158,3 / 159,1 |
| /provincias | móvil | 681,8 | 679,8 | −0,3 % | 736 / 700 | 736 / 700 | 0,0000 / 0,0000 | 27 / 27 | 160,2 / 161,0 |
| /actividades | móvil | 600,5 | 598,5 | −0,3 % | 744 / 684 | 744 / 684 | 0,0000 / 0,0000 | 32 / 32 | 162,0 / 162,9 |
| /escapadas | móvil | 367,2 | 365,2 | −0,5 % | 748 / 700 | 748 / 700 | 0,0000 / 0,0000 | 20 / 20 | 161,1 / 161,9 |
| /provincias/santa_fe | móvil | 715,4 | 553,5 | −22,6 % | 760 / 696 | 760 / 696 | 0,0000 / 0,0000 | 46 / 31 | 170,6 / 164,2 |
| /actividades/vivir-la-magia-del-teatro-colon | móvil | 476,2 | 437,4 | −8,2 % | 724 / 684 | 724 / 684 | 0,0000 / 0,0000 | 22 / 22 | 163,2 / 164,1 |
| /seguridad | móvil | 366,6 | 366,3 | −0,1 % | 748 / 696 | 748 / 696 | 0,0000 / 0,0000 | 19 / 19 | 158,3 / 159,1 |
| /privacidad | móvil | 365,2 | 365,2 | −0,0 % | 756 / 712 | 756 / 712 | 0,0000 / 0,0000 | 20 / 20 | 159,2 / 160,0 |
| /provincias/santa_fe/planes | móvil | 388,9 | 367,3 | −5,6 % | 748 / 692 | 748 / 692 | 0,0000 / 0,0000 | 28 / 20 | 167,2 / 159,7 |
| /provincias/santa_fe/eventos | móvil | 398,8 | 390,3 | −2,1 % | 740 / 716 | 740 / 716 | 0,0160 / 0,0160 | 29 / 25 | 169,3 / 167,5 |
| /provincias/santa_fe/oficinas | móvil | 387,8 | 366,2 | −5,6 % | 736 / 716 | 736 / 716 | 0,0000 / 0,0000 | 28 / 20 | 167,2 / 159,7 |
| /provincias/santa_fe/agencias | móvil | 404,0 | 382,8 | −5,2 % | 736 / 712 | 736 / 712 | 0,0000 / 0,0000 | 29 / 21 | 168,4 / 161,4 |
| /provincias/santa_fe/noticias | móvil | 408,3 | 379,0 | −7,2 % | 804 / 768 | 804 / 768 | 0,0000 / 0,0000 | 30 / 21 | 167,2 / 159,7 |
| /pagina-inexistente | móvil | 409,6 | 407,8 | −0,4 % | 524 / 508 | 524 / 508 | 0,0056 / 0,0000 | 22 / 22 | 158,3 / 159,1 |
| / | escritorio | 625,7 | 624,6 | −0,2 % | 172 / 168 | 172 / 168 | 0,0000 / 0,0000 | 38 / 38 | 166,7 / 167,7 |
| /provincias | escritorio | 556,9 | 555,9 | −0,2 % | 156 / 156 | 156 / 156 | 0,0000 / 0,0000 | 41 / 41 | 166,7 / 167,7 |
| /actividades | escritorio | 692,1 | 691,2 | −0,1 % | 160 / 160 | 160 / 160 | 0,0000 / 0,0000 | 50 / 50 | 166,7 / 167,7 |
| /escapadas | escritorio | 392,9 | 392,0 | −0,2 % | 156 / 152 | 156 / 152 | 0,0000 / 0,0000 | 34 / 34 | 166,7 / 167,7 |
| /provincias/santa_fe | escritorio | 744,7 | 713,1 | −4,2 % | 168 / 156 | 168 / 156 | 0,0000 / 0,0000 | 67 / 49 | 179,1 / 172,8 |
| /actividades/vivir-la-magia-del-teatro-colon | escritorio | 506,2 | 505,2 | −0,2 % | 156 / 156 | 156 / 156 | 0,0000 / 0,0000 | 49 / 49 | 171,6 / 172,6 |
| /seguridad | escritorio | 395,2 | 395,9 | +0,2 % | 180 / 156 | 180 / 156 | 0,0000 / 0,0000 | 34 / 34 | 166,7 / 167,7 |
| /privacidad | escritorio | 393,7 | 394,7 | +0,3 % | 156 / 164 | 156 / 164 | 0,0000 / 0,0000 | 35 / 35 | 167,6 / 168,5 |
| /provincias/santa_fe/planes | escritorio | 438,3 | 396,9 | −9,4 % | 176 / 164 | 176 / 164 | 0,0000 / 0,0000 | 56 / 35 | 179,1 / 168,3 |
| /provincias/santa_fe/eventos | escritorio | 446,1 | 407,2 | −8,7 % | 156 / 148 | 156 / 148 | 0,0072 / 0,0041 | 57 / 36 | 179,1 / 170,9 |
| /provincias/santa_fe/oficinas | escritorio | 437,2 | 395,8 | −9,5 % | 164 / 160 | 164 / 160 | 0,0000 / 0,0000 | 56 / 35 | 179,1 / 168,3 |
| /provincias/santa_fe/agencias | escritorio | 452,2 | 412,4 | −8,8 % | 172 / 160 | 172 / 160 | 0,0000 / 0,0000 | 57 / 36 | 179,1 / 170,0 |
| /provincias/santa_fe/noticias | escritorio | 457,7 | 416,0 | −9,1 % | 172 / 168 | 172 / 168 | 0,0000 / 0,0000 | 58 / 37 | 179,1 / 168,3 |
| /pagina-inexistente | escritorio | 438,1 | 437,4 | −0,2 % | 144 / 136 | 144 / 136 | 0,0001 / 0,0000 | 37 / 37 | 166,7 / 167,7 |

Lectura:

- **CLS igual o menor en las 28 combinaciones** (la 404 móvil baja de 0,0056 a 0; Eventos escritorio
  de 0,0072 a 0,0041; Eventos móvil se mantiene en 0,016, que viene del cálculo de vigencia del
  export estático).
- **Menos bytes en 26 de 28.** Las otras dos (Seguridad y Privacidad en escritorio, +0,2 % y +0,3 %)
  son el HTML de la nueva maquetación.
- **Portada móvil −20 %** (destacadas en fila con la variante de 960 px), **Santa Fe móvil −22,6 %**
  (carrusel con techo de 960 px y 15 pedidos menos), **Teatro Colón móvil −8,2 %** y subsecciones de
  Santa Fe entre −5 % y −9,5 %, por menos pedidos de precarga y CSS más chico.
- FCP y LCP iguales o mejores en todas las rutas móviles; en escritorio, dentro de ±8 ms (ruido).

### Correcciones hechas a partir de la medición

1. **Eventos (Pages)**: el marcador previo al cálculo de vigencia era un párrafo corto y la sección
   final un estado vacío más alto, así que el archivo se desplazaba. En la primera medición, el CLS
   móvil subía de 0,016 a 0,050. Ahora el marcador usa el mismo bloque y vuelve a 0,016.
2. **404**:
   - Las tarjetas precargaban cuatro rutas (de 22 a 37 pedidos): ahora van sin prefetch.
   - La bajada pasaba de dos líneas a una al llegar Geist (CLS 0,024): ahora usa 16 px en teléfonos.
   - El contenido de `not-found` viaja en el RSC de todas las páginas: la primera versión sumaba
     ~8 KB sin comprimir a cada una. Una variante como componente cliente agregaba un JS de 5 KB y un
     pedido en cada página, con el mismo peso transferido, así que se descartó. La versión final, sin
     íconos ni regiones, suma 3 KB sin comprimir (90–200 bytes con gzip).
3. Se probó `display: optional` para la serif de títulos y se revirtió: no era la causa del CLS y
   habría ocultado la tipografía de marca en conexiones lentas.

## Alto de página y objetivos táctiles

| Perfil | Página | Alto antes | Alto después | Objetivos < 24 px antes | después |
| --- | --- | ---: | ---: | ---: | ---: |
| escritorio | portada | 3.057 | 3.009 | 0 | 0 |
| escritorio | escapadas | 3.448 | 3.168 | 0 | 0 |
| escritorio | seguridad | 3.733 | 3.435 | 4 | 0 |
| escritorio | privacidad | 3.373 | 3.758 | 7 | 7 |
| escritorio | santa-fe | 4.528 | 4.014 | 1 | 1 |
| escritorio | sf-planes | 2.850 | 3.192 | 20 | 0 |
| escritorio | sf-eventos | 1.476 | 1.648 | 3 | 0 |
| escritorio | sf-oficinas | 2.779 | 3.125 | 32 | 0 |
| escritorio | sf-agencias | 3.318 | 3.561 | 46 | 0 |
| escritorio | sf-noticias | 1.894 | 2.126 | 3 | 0 |
| escritorio | error-404 | 1.476 | 1.087 | 0 | 0 |
| escritorio | actividad | 2.733 | 2.733 | 1 | 1 |
| móvil | portada | 4.454 | 3.365 | 0 | 0 |
| móvil | escapadas | 7.657 | 6.108 | 0 | 0 |
| móvil | seguridad | 5.261 | 6.167 | 4 | 0 |
| móvil | privacidad | 5.361 | 5.800 | 6 | 6 |
| móvil | santa-fe | 6.650 | 5.110 | 1 | 1 |
| móvil | sf-planes | 6.584 | 6.684 | 20 | 0 |
| móvil | sf-eventos | 2.011 | 2.046 | 3 | 0 |
| móvil | sf-oficinas | 5.876 | 6.141 | 32 | 0 |
| móvil | sf-agencias | 7.904 | 7.746 | 46 | 0 |
| móvil | sf-noticias | 2.978 | 2.756 | 3 | 0 |
| móvil | error-404 | 2.011 | 1.594 | 0 | 0 |
| móvil | actividad | 3.654 | 3.366 | 0 | 0 |

- **Portada móvil −24 %** y **Escapadas móvil −20 %**.
- Santa Fe móvil −23 %, porque la grilla ya no repite las preguntas frecuentes.
- Objetivos táctiles chicos en Santa Fe: de 20–46 a 0.
- Seguridad móvil es más larga a propósito: emergencias arriba, chips de temas y consejos más
  espaciados.
- Los 6–7 objetivos que quedan en Privacidad son enlaces dentro de párrafos (excepción de WCAG
  2.5.8). El que queda en Santa Fe y Teatro Colón es la atribución de OpenStreetMap.

## Peso del artefacto Preview

| | Archivos | Bytes |
| --- | ---: | ---: |
| `main` (antes) | 2.035 | 103.466.371 |
| PR16 | 2.035 | 105.364.118 (+1,8 %) |

- Las variantes WebP no cambiaron.
- El CSS bajó 34 KB al retirar estilos antiguos.
- El aumento es HTML/RSC: maquetación nueva de Seguridad, Privacidad y Santa Fe, más la 404
  serializada en cada página (~3 KB sin comprimir).
