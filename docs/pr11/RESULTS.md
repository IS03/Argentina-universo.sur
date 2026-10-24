# Verificaciones, tamaño y rendimiento

Fuente de código: `main` `18a4780`, PR10 fusionado; pruebas el 24/10/2026 en macOS, Node 22.19.0 y Chrome. No se publicó un Preview remoto ni se probó una cuenta Cloudflare del titular.

## Pruebas

- Aplicación actual: `npm run check` completo, lint sin warnings, TypeScript, validación de catálogos/medios, PGlite y contratos editoriales; **75 unitarias**, build, **106 páginas SEO / 0 errores**, **103 E2E aprobadas y 9 omisiones** del alcance original.
- Candidato Pages: tres builds aislados y TypeScript; auditoría de 106 URL en Preview y modo de compatibilidad, canonical/OG/sitemap/robots y recursos con **0 errores**.
- Navegador adicional: **68 aprobadas y 2 omisiones**, incluyendo pruebas estáticas de PR10, 24 páginas provinciales sin JS, modelo de reglas legacy, consentimiento reutilizado y seis comprobaciones con **Wrangler Pages local real** en escritorio/móvil. Las omisiones corresponden exclusivamente a las pruebas de Workers que ya no aplican.
- Sin GA4 en Preview/alias; aceptación guardada, rechazo, revocación, pestañas, expiración y orden de permisos antes del config verificados con ID ficticio y transporte local. El harness conserva las expectativas originales y enruta el JS retrasado mediante `fallback`. La revisión final encontró una carrera entre el fetch HTTP de prueba y `unrouteAll`; ahora se sirven los mismos bytes del artefacto local directamente, iniciando la respuesta antes del cierre, sin ignorar errores ni cambiar expectativas del consentimiento.
- Wrangler 4.152.0 se instaló en tooling aislado, sin login ni recursos remotos. Se comprobaron navegación cliente de export, ruta Catamarca y query, `_headers`, `_redirects`, WebP y la diferencia inevitable de query sin zona. No se extrapola el emulador como certificación del CDN remoto.
- Los hashes de originales se conservan: 306 archivos de la categoría heredada de imágenes (304 imágenes y dos auxiliares) y los 24 PDF. Sin cambios en Excel, SQL de Supabase, datos turísticos existentes ni historia de Git.

[Evidencias JSON](evidence/). El CI incorpora además build/auditoría de Preview, manteniendo las verificaciones existentes.

## Seguridad editorial: corrección final

Se eliminó la excepción `AUS_STATIC_EXPORT=1` que exponía borradores y la inyección del demo PR10. El Palmar sigue en `draft`/`review:null`, sin modificar su contenido ni autorización. El texto se revisa en código, fuera del Preview público. El gate de aprobación no cambió. Next no admite rutas dinámicas sin parámetros en export: con cero aprobadas se omite únicamente la ruta del clon temporal.

[Detalle de barreras, pruebas y límites](EDITORIAL-SECURITY.md). Cada build real auditó 134 HTML, 666 archivos TXT de navegación/RSC y 23 JavaScript; cero hallazgos de borradores, prototipos o datos privados del contrato conocido del maestro. Se excluyeron seis Excel fuente del artefacto, sin borrar originales. No se accedió al Sheets ni se exportaron sus fichas; no se presenta este chequeo como auditoría del maestro remoto.

Las mediciones de rendimiento siguientes corresponden a la ejecución anterior del PR11; esta corrección no cambió fotos, layouts, consentimiento ni las tres páginas medidas. Se regeneraron builds, tamaños y pruebas funcionales para la revisión de seguridad, sin atribuirle una nueva medición de rendimiento.

## Peso del despliegue

| Artefacto | Archivos | Bytes | MB decimales | Estado |
| --- | ---: | ---: | ---: | --- |
| Preview ligero | 2038 | 101809265 | 101.81 | Sin PDF ni originales; pendiente cuenta/derechos/privacidad |
| Compatibilidad local con PDF | 2062 | 735379408 | 735.38 | No desplegable: 10 PDF >25 MiB |
| Estimación sin PDF de compatibilidad | — | 101799985 | 101.80 | No permite saltar aprobaciones |
| Variantes WebP | — | 80004852 | 80.00 | Incluidas en el Preview |
| SVG conservados | 2 | 222371 | 0.22 | Incluidos en el Preview |
| PDF originales | 24 | 633579423 | 633,58 | Permanecen en repositorio y producción |

Frente a los 234.682.284 bytes de la categoría original, los 80.004.852 bytes WebP ocupan **65,9% menos**, incluyendo todos los tamaños servibles y deduplicación. No son bytes de una visita. Los 102 MB son una medición del artefacto actual, no el tamaño definitivo de 23 fichas futuras que aún no están aprobadas/redactadas. Estas agregarán HTML/medios; el reporte debe regenerarse antes del corte.

El Preview no introduce redirects de PDF: sus enlaces abren las rutas vigentes de producción. Por tanto, todavía no prueba independencia total del proveedor actual. La variante de compatibilidad mantiene los PDF locales. Los originales de imagen se conservan fuera del nuevo artefacto; sus rutas históricas se resuelven por 308 a WebP.

## Medición de rendimiento

54 cargas: tres escenarios × tres páginas × dos perfiles × tres repeticiones. Contextos de navegador fríos, servidores posiblemente calientes. CDP: móvil 1,6 Mbps/150 ms/CPU navegador ×4; escritorio 20 Mbps/40 ms/CPU ×1. Movimiento reducido, teselas OSM simuladas igual en todos los escenarios, Google y telemetría bloqueados, sin consentimiento. Conteo por CDP de bytes transferidos, incluido otro origen. CLS inicial hasta load + 1,8 s. **No** es p75 real, CrUX, Lighthouse ni medición del CDN Cloudflare.

| Página / perfil | Escenario | KB transferidos | LCP ms | CLS | Requests | Optimizer Vercel |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Portada / mobile | PR10 estático local | 1237.0 | 756 | 0.0000 | 27 | 0 |
| Portada / mobile | PR11 estático local | 951.4 | 820 | 0.0000 | 25 | 0 |
| Portada / mobile | Producción Vercel observada | 912.5 | 912 | 0.0000 | 25 | 5 |
| Santa Fe / mobile | PR10 estático local | 959.8 | 704 | 0.0000 | 50 | 0 |
| Santa Fe / mobile | PR11 estático local | 666.3 | 784 | 0.0000 | 49 | 0 |
| Santa Fe / mobile | Producción Vercel observada | 831.3 | 1180 | 0.0000 | 43 | 2 |
| Teatro Colón / mobile | PR10 estático local | 568.2 | 668 | 0.0000 | 26 | 0 |
| Teatro Colón / mobile | PR11 estático local | 484.4 | 744 | 0.0000 | 25 | 0 |
| Teatro Colón / mobile | Producción Vercel observada | 579.3 | 868 | 0.0000 | 25 | 2 |
| Portada / desktop | PR10 estático local | 854.2 | 168 | 0.0000 | 43 | 0 |
| Portada / desktop | PR11 estático local | 702.5 | 172 | 0.0000 | 42 | 0 |
| Portada / desktop | Producción Vercel observada | 846.5 | 396 | 0.0000 | 38 | 5 |
| Santa Fe / desktop | PR10 estático local | 1000.9 | 172 | 0.0000 | 77 | 0 |
| Santa Fe / desktop | PR11 estático local | 857.2 | 172 | 0.0000 | 77 | 0 |
| Santa Fe / desktop | Producción Vercel observada | 891.9 | 588 | 0.0000 | 67 | 2 |
| Teatro Colón / desktop | PR10 estático local | 617.0 | 156 | 0.0000 | 54 | 0 |
| Teatro Colón / desktop | PR11 estático local | 587.7 | 156 | 0.0000 | 54 | 0 |
| Teatro Colón / desktop | Producción Vercel observada | 647.4 | 384 | 0.0000 | 50 | 2 |

Portada móvil: **951,4 KB frente a 1.237,0 KB de PR10 (−23,1%)**, 25 frente a 27 requests, CLS 0 y cero `/_next/image`. Producción transfiere 912,5 KB: el candidato sigue **4,3% por encima**. No se afirma que sea más liviano que producción en todas las páginas. Santa Fe móvil baja de 831,3 KB de producción a 666,3 KB, y el detalle de actividad de 579,3 a 484,4 KB.

LCP de texto: portada candidata 820 ms frente a 756 ms del PR10 local; no se presenta como mejora de LCP. Frente a Vercel interviene latencia de Internet y no puede atribuirse una diferencia a Cloudflare. El observador informa `lcpUrl:null`: no acredita que toda fotografía haya terminado de bajar antes. En esta muestra no se registraron fallos HTTP/JS.

La corrección de `sizes` contempla la portada de tres columnas y el historial de cuatro. Se limitan anchos a una política explícita y se evita ampliar originales; no se ignora DPR, y se mantienen tamaños grandes solo donde se necesitan. Quedan ajustes posibles de grano fino y medición real desde Argentina.

La hoja visual nueva compara cinco muestras originales redimensionadas frente a sus WebP 960: portada, provincia, actividad y carrusel. PSNR en `visual-quality.json`; la vegetación muestra pérdidas de detalle. Se revisaron capturas móviles y la hoja local, sin declararlas equivalentes sin pérdidas ni dar por aprobadas licencias. `.artifacts/pages/reports/contact-sheet.png` y capturas no se agregan como binarios al Git.

Las últimas adaptaciones de privacidad se limitan a `/privacidad`, ruta no usada en esta medición; las tres páginas medidas, tamaños/calidad de fotos y metodología se mantienen. Builds y navegador se verifican también después de preparar esa variante.

Extrapolación ilustrativa: tres páginas móviles por visita, una de cada tipo de la muestra, sin reutilización de caché: aproximadamente **2,10 / 21,02 / 210,22 GB** y **99.000 / 990.000 / 9.900.000 requests estáticos** para 1.000 / 10.000 / 100.000 visitas al mes. Sin solicitudes dinámicas de aplicación. No incluye bots ni descargas PDF en producción; son supuestos de planificación, no tráfico observado ni garantía de gratuidad.

Dependencias: el lock principal permanece sin cambios; las 12 advertencias de auditoría de PR10 son preexistentes. El CLI Wrangler aislado informa 3 advertencias (2 moderadas y 1 alta); no se incluye en el frontend ni se aplicó `audit fix --force`. Debe revisarse su actualización antes de operar el despliegue real.

Pendiente: autorización/cuenta del responsable; Preview y reglas reales, codificación de query y hosts/TLS/caché; revisión de derechos y política propuesta; revisión humana del texto de El Palmar ya autorizado; reemplazos equivalentes y respaldos privados de cada PDF. No se hizo merge ni corte de dominio.
