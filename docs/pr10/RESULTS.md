# Resultados y límites de la prueba

Evidencias obtenidas el 24/10/2026, en macOS con Node 22.19.0 y Chrome local. La configuración experimental está aislada; **no hay Preview Cloudflare ni mediciones del edge** porque no se dispone de una cuenta del responsable verificada/autorizada. No se ejecutó `wrangler deploy` remoto; `deploy --dry-run` solo empaqueta.

## Validación de aplicación principal

`npm run check` completo: lint sin warnings; TypeScript y tipos de rutas; integridad de datos/imágenes/PDF; `db:check` de PR9 con PGlite local; **63 pruebas unitarias pasan**, incluyendo cuatro controles nuevos; build de Next.js; **106 URLs SEO con 0 errores**; **103 E2E pasan y 9 omisiones explícitas** según el alcance original móvil/JS. No se simuló una base remota ni se ejecutó SQL en producción.

El lock de producción no cambia. `npm audit` detecta **12 advertencias preexistentes** (1 baja, 2 moderadas, 9 altas); el lock vinext aislado muestra **20** (1 baja, 9 moderadas, 10 altas). Incluyen dependencias de tooling y transitivas, no equivalen todas a exploits públicos en esta app. No se aplicó `audit fix` ni se ocultó el resultado. Ver paquetes/advisories en [auditoría principal](evidence/dependency-audit-main.json) y [experimental](evidence/dependency-audit-vinext.json). Esto refuerza que vinext no es una actualización de producción propuesta en este PR.

`npm ci` con el lock experimental se ejecutó correctamente; ambos prototipos se compilaron y comprobaron con TypeScript. React 19.3.1 queda limitado a la copia vinext. La reproducción final usa limpieza de las carpetas permitidas y las dependencias previamente instaladas mediante ese lock; no depende de un archivo `.env` local copiado.

## Compatibilidad en navegador

La batería adicional prueba escritorio y Pixel 7 para portada, provincias, Santa Fe, actividades, query Santa Fe, query histórica `catarmaca`, escapadas, detalle Teatro Colón, privacidad y eventos. Comprueba imágenes, h1, ausencia de errores JS en rutas, filtros visibles, recarga, navegación cliente sin nueva petición de documento, atrás, historial local, resumen JSON, Leaflet, 308 Catamarca, sitemap106, robots, agenda vencida y demo noindex. Se reutiliza la batería original de consentimiento sin modificar sus expectativas.

**Resultado final tras reconstrucción limpia: 130 pasan, 2 fallan y 6 se omiten.** Persisten las dos pruebas de recuperación de aceptación guardada en Workers, escritorio y móvil. El prototipo estático pasa sus 50 pruebas aplicables.

En la primera ejecución completa: **129 pasan, 3 fallan y 6 se omiten por no aplicar**. Estático: 25 pasan + 1 omisión por dispositivo; baseline: 15 + 2 omisiones por dispositivo. Workers: 24 pasan/2 fallan escritorio y 25 pasan/1 falla móvil. Fallos:

- Recuperación de aceptación guardada con JS retrasado, en Workers escritorio y móvil: `gtag.js` se observó 0 veces en lugar de 1 dentro del intervalo esperado. Se reprodujo en ambos al ejecutar las cuatro pruebas relevantes aisladamente con un solo worker.
- Una interacción “Aceptar” antes de completar hidratación no retiró el banner en Workers escritorio. En el seguimiento aislado pasó: diferencia de temporización no resuelta, no una garantía de equivalencia.

No se alteró el consentimiento para hacer pasar las pruebas. Las pruebas de **no cargar GA4 sin decisión o tras rechazar**, revocación y el resto pasan. Las solicitudes de Google se interceptan con un sustituto local y no se envían datos a una propiedad real. Los fallos de recuperación bloquean la adopción de vinext hasta investigar semántica de hidratación/scripts. El resultado final tras reproducción se registra en `evidence/browser-summary.json`; se conserva aquí la observación inicial y el seguimiento, aunque una repetición cambie un fallo de temporización.

La plantilla de escapada funciona solo en `/prototipo-pr10/escapadas/el-palmar`, sin aprobación para publicación. El HTML de filtros sin JS tiene **3 enlaces de actividad en Next/Workers y 72 en el export estático**: diferencia comprobada por HTTP, no ocultada por el servidor local.

## SEO y respuesta dinámica

Las 106 páginas de cada prototipo mantienen title/description/canonical/OG y el contenido esperado de sitemap/robots, sin fechas de build usadas como actualización. **El auditor completo experimental devuelve 2 errores en cada arquitectura**, correspondientes a redirecciones por host de `argentinauniversosur.com` y `argentina-universosur.vercel.app`. No se suprimen: reglas de dominio y prueba con host real siguen pendientes; no se declara SEO integralmente aprobado para migración. La redirección de ruta Catamarca sí pasa con query conservada y sin bucle. Informes: [estático](evidence/seo-static.json), [Workers](evidence/seo-worker.json).

Streaming se probó por `node:http` sin compresión con una ruta que fuerza `connection()` y espera 200 ms dentro de Suspense. Tres solicitudes locales entregaron fallback a 60,6 / 20,9 / 31,2 ms y contenido completado a 251,5 / 220,7 / 221,5 ms. El contador cliente se hidrata y responde. Los bloques tempranos **no contienen** el marcador HTML completado; no se confunde un prerender con streaming. [Chunks y filtro HTTP](evidence/http-probes.json). Son tiempos de pared locales, no CPU facturable.

## Fotografías y artefactos

La categoría heredada de 306 archivos incluye **304 imágenes** (300 JPEG, 2 PNG, 2 SVG), más README y acceso directo `.lnk` (1.739 bytes); suma 234.682.284 bytes. Las 302 raster se transforman; 6 grupos de duplicados dejan 296 contenidos únicos. Hay 8 posibles rutas sin referencias estáticas confirmadas; no son autorización para borrar. MIME/dimensiones/referencias detalladas siguen en el inventario de PR9, y el resumen nuevo vincula cada muestra a variantes/hashes.

| Conjunto | Bytes | MB decimales |
| --- | ---: | ---: |
| Categoría original completa | 234.682.284 | 234,68 |
| Raster de entrada (302 rutas) | 234.458.174 | 234,46 |
| Raster únicas (296 hashes) | 227.999.525 | 228,00 |
| Todas las variantes WebP (3 tamaños) + AVIF de muestra | 84.948.529 | 84,95 |
| Solo variante WebP mayor por hash | 51.694.790 | 51,69 |
| SVG conservados, adicionales a derivados | 222.371 | 0,22 |
| 24 PDF, todos conservados | 633.579.423 | 633,58 |

Las variantes completas ocupan un **63,8% menos** que la categoría original; no son el peso transferido de una visita. AVIF se generó solo para muestra; no se promete ese ahorro para todas las fotos. La selección de variantes, `sizes`, DPR y lazy-loading influyen mucho en transferencia. [Resumen de medios, PSNR y duplicados](evidence/media-summary.json). La hoja de comparación local está en `.artifacts/pr10/reports/image-contact-sheet.png`; no se agregaron fotos binarias al Git del PR.

Los originales se verifican nuevamente por SHA-256. El build estático de prueba conserva originales y variantes, por lo que ronda **979 MB**, no 85 MB. Tiene aproximadamente 2.109 archivos; ambos límites exactos finales se registran en los JSON de assets. **Diez PDF superan 25 MiB**. La salida Workers se audita antes de apartar las copias de los 24 PDF; el `dry-run` con el conjunto completo no sería publicable. [Assets estáticos](evidence/assets-static.json), [assets Workers antes de cuarentena](evidence/assets-worker.json), [integridad PDF](evidence/pdf-integrity.json).

El bundle Worker local ronda 1,8 MiB sin comprimir (~572 KiB gzip); está por debajo del tamaño permitido actual, pero **CPU, RAM, tiempo de arranque y behavior del CDN no se validaron en Cloudflare**. Tampoco hay prueba de carga remota ni capacidad garantizada de teselas OpenStreetMap.

## Rendimiento

<!-- PERFORMANCE-TABLE -->

72 cargas locales (4 escenarios × 3 páginas × 2 perfiles × 3 repeticiones) y 3 observaciones de producción, todas HTTP 200 y sin errores JS registrados. Medianas; muestras individuales en [performance.json](evidence/performance.json).

| Página / perfil | Escenario | LCP ms | CLS | KB transferidos | Requests | `/_next/image` |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Home / mobile | Next local / optimizer actual | 856 | 0.0000 | 887.1 | 20 | 5 |
| Home / mobile | Export + imágenes mismo origen | 760 | 0.0000 | 1237.1 | 27 | 0 |
| Home / mobile | Export + origen imágenes simulado | 748 | 0.0000 | 1237.2 | 27 | 0 |
| Home / mobile | vinext / workerd local | 744 | 0.0216 | 1216.7 | 29 | 0 |
| Santa Fe / mobile | Next local / optimizer actual | 852 | 0.0000 | 808.7 | 38 | 2 |
| Santa Fe / mobile | Export + imágenes mismo origen | 696 | 0.0000 | 959.8 | 50 | 0 |
| Santa Fe / mobile | Export + origen imágenes simulado | 716 | 0.0000 | 959.9 | 50 | 0 |
| Santa Fe / mobile | vinext / workerd local | 708 | 0.0078 | 453.7 | 45 | 0 |
| Teatro Colón / mobile | Next local / optimizer actual | 828 | 0.0000 | 553.3 | 20 | 2 |
| Teatro Colón / mobile | Export + imágenes mismo origen | 680 | 0.0000 | 568.4 | 26 | 0 |
| Teatro Colón / mobile | Export + origen imágenes simulado | 688 | 0.0000 | 568.4 | 26 | 0 |
| Teatro Colón / mobile | vinext / workerd local | 688 | 0.0094 | 557.1 | 31 | 0 |
| Home / desktop | Next local / optimizer actual | 176 | 0.0000 | 821.0 | 33 | 5 |
| Home / desktop | Export + imágenes mismo origen | 164 | 0.0000 | 854.3 | 43 | 0 |
| Home / desktop | Export + origen imágenes simulado | 164 | 0.0000 | 854.4 | 43 | 0 |
| Home / desktop | vinext / workerd local | 160 | 0.0059 | 662.7 | 38 | 0 |
| Santa Fe / desktop | Next local / optimizer actual | 180 | 0.0000 | 868.1 | 62 | 2 |
| Santa Fe / desktop | Export + imágenes mismo origen | 164 | 0.0000 | 1000.9 | 77 | 0 |
| Santa Fe / desktop | Export + origen imágenes simulado | 164 | 0.0000 | 1001.0 | 77 | 0 |
| Santa Fe / desktop | vinext / workerd local | 168 | 0.0031 | 1000.0 | 65 | 0 |
| Teatro Colón / desktop | Next local / optimizer actual | 152 | 0.0000 | 620.9 | 45 | 2 |
| Teatro Colón / desktop | Export + imágenes mismo origen | 156 | 0.0000 | 617.1 | 54 | 0 |
| Teatro Colón / desktop | Export + origen imágenes simulado | 156 | 0.0000 | 617.1 | 54 | 0 |
| Teatro Colón / desktop | vinext / workerd local | 148 | 0.0033 | 610.5 | 52 | 0 |
| Home / mobile | Vercel producción observada | 888 | 0.0000 | 912.5 | 25 | 5 |

Método: Chrome, contexto/caché de navegador nuevos en cada carga; servidor posiblemente caliente. Configuración CDP solicitada: móvil 1,6 Mbps, latencia 150 ms, CPU del **navegador** ×4; escritorio 20 Mbps, 40 ms y CPU ×1. Son parámetros de laboratorio sobre localhost, no una reproducción certificada de una red móvil real. Transferencia medida con CDP `encodedDataLength`, incluyendo imágenes de otro origen; HTML/JS del servidor estático se comprimen con gzip. Ventana CLS: carga inicial hasta load + 1,8 s, sin scroll ni interacción. Movimiento reducido para estabilizar el hero. Teselas OSM simuladas de forma idéntica; analíticas bloqueadas y sin consentimiento.

El LCP observado es texto (`lcpUrl:null`), no demuestra que las fotografías principales se hayan descargado antes de ese instante. La muestra no es Lighthouse, CrUX ni p75 real. Se inspeccionaron capturas móviles y la hoja de imágenes; no constituye aprobación visual de cada foto.

**Resultado que limita la recomendación:** la home estática móvil transfiere 1.237 KB frente a 887 KB de Next local (+39,5%) y hace 27 requests frente a 20. Menor LCP local no significa menor transferencia ni mejora de proveedor. Hace falta afinar `sizes`, escalones de ancho/DPR, precargas y tamaño del mapa de variantes antes de prometer una mejora global. La decisión de estático se fundamenta en eliminar cómputo/cuotas dinámicas y simplificar propiedad, no en declarar que esta primera configuración es siempre más rápida.

El origen de imágenes separado transfiere prácticamente lo mismo que imágenes junto al sitio, con cero optimizer Vercel; no demuestra una ventaja de CDN remoto y añade operación de otro origen. Workers presenta CLS pequeño pero distinto de cero (hasta ~0,022 en estas muestras). La producción Vercel observada tiene latencia de Internet y no puede compararse causalmente con localhost para afirmar que Cloudflare es más rápido.

Extrapolación ilustrativa del export estático móvil: media de las tres páginas ≈0,922 MB por página y 34,3 requests. Con 3 páginas por visita: ≈2,77 / 27,65 / 276,53 GB y 103.000 / 1.030.000 / 10.300.000 requests para 1.000 / 10.000 / 100.000 visitas. No incluye descargas PDF ni bots y no representa tráfico real. [Escenarios calculados](evidence/traffic-scenarios.json); [cuotas y supuestos](COSTS.md).

Cambios finales posteriores a la medición: formato del código fuente de plantillas, campo explícito de destino del demo y temporizador de caducidad en agenda estática (rutas no medidas). No se modificaron las tres páginas medidas ni los parámetros/calidad de imagen. El build y navegador se vuelven a verificar después de esos cambios.

Pendiente remoto: cuenta/permiso del titular; Preview estático sin PDF rotos, regla real de hosts, cookies/privacidad y carga; medición con caché frío/caliente desde Argentina; CPU/RAM/arranque y cuotas si se retoma Workers. No se afirma que estas verificaciones hayan pasado.
