# PR 10 — Viabilidad de infraestructura gratuita

Fecha de investigación: 24/10/2026. Base: `main` `bf3dcf1` (PR 9 fusionado). Esta rama contiene herramientas y prototipos **locales**, no una migración de producción. No se creó infraestructura, no se accedió a una cuenta Cloudflare, no se contrató un plan, no se cambió DNS y no se publicaron fichas del maestro. El código turístico, originales, Supabase SQL, GA4 y privacidad de la aplicación principal permanecen intactos.

**Recomendación:** avanzar hacia HTML estático + fotografías derivadas junto al sitio, en Cloudflare Pages **en una cuenta del responsable**. Hoy no hay una migración lista: bloquean los PDF mayores de 25 MiB, la diferencia del filtro sin JS, las redirecciones de host y las verificaciones remotas. Workers/vinext queda como alternativa experimental; no se ha demostrado que el SSR cumpla CPU/RAM de Free ni paridad completa del consentimiento. USD 0/mes es una posibilidad condicionada, no gratuidad ilimitada ni garantía contractual.

Documentos:

- [Arquitecturas y reproducción](#prototipos-reproducibles).
- [Mediciones y validaciones](RESULTS.md), con [evidencias JSON](evidence/).
- [Costos, cuotas y escenarios](COSTS.md).
- [24 PDF y sustitución progresiva](PDF-MATRIX.md); [matriz completa](pdf-matrix.json), [disponibilidad de fuentes candidatas](official-source-checks.json).
- [Contenido, cuentas, migración y reversión](MIGRATION.md).

## A. Next.js exportado a Cloudflare Pages

Se conserva Next.js 16.4.3 / React 19.2.3. `output: 'export'` genera HTML, CSS, JS y archivos; Server Components pueden ejecutar lecturas locales **durante el build**, sin servidor de aplicación para el visitante. No se cambió el diseño principal. [Capacidades de exportación de Next.js](https://nextjs.org/docs/app/guides/static-exports). La salida completa conserva los PDF para probar enlaces localmente y el control de assets registra que **no puede desplegarse** con el límite actual.

| Función | Prototipo estático | Diferencia / pendiente |
| --- | --- | --- |
| 24 provincias, 72 actividades, rutas dinámicas | `generateStaticParams`, `dynamicParams=false`; HTML por slug | Nuevo contenido requiere build aprobado |
| Agenda Santa Fe / `connection()` | Solo copia: quitar conexión; HTML fechado sin llamar próximos a eventos; reloj cliente los particiona | Recalcula al vencer el minuto del siguiente evento y al volver a la pestaña; depende del reloj del visitante; sin JS muestra archivo. Antes de producción conviene archivo fechado sin etiquetas de vigencia o builds y monitor de caducidad |
| `/actividades?provincia=santa_fe` | HTML completo + filtro cliente con bootstrap previo a hidratar | Sin JS aparecen 72 tarjetas frente a 3 en producción; no hay rewrite de query en Pages. **Paridad pendiente**, no se declara resuelta |
| Alias de filtro `catarmaca` | Normalización cliente a `catamarca`, sin cambiar URL histórica | Misma limitación sin JS |
| Server Components | Renderizados al construir | No sesiones, escrituras ni consultas de BD por visita |
| Redirección `/provincias/catarmaca` | `_redirects` permanente a `/provincias/catamarca` | Local se comprueba 308 y conservación de query; comportamiento real de Pages pendiente |
| Redirecciones por host | Requieren configuración de la cuenta/dominio | `_redirects` de Pages no admite reglas por dominio; no se alteró DNS |
| Leaflet, carruseles, historial local | JS cliente y resumen JSON generado como archivo | Teselas externas conservan atribución; pruebas las simulan, no prueban capacidad del proveedor |
| Metadata, canonical, sitemap, robots | Exportados; 106 URL originales, sin `lastmod` inventado | Demo fuera del sitemap/noindex; hay 2 comprobaciones de host pendientes |
| Consentimiento / GA4 | Componentes originales sin cambios, ID ficticio local, Google interceptado en pruebas | Para otro proveedor debe definirse un indicador de producción explícito: hoy depende de `VERCEL_ENV` |
| Imágenes | Loader de variantes WebP pregeneradas, tamaños adaptables | No `/_next/image`, no transformación bajo demanda, no licencia presumida |
| Vercel Analytics / Speed Insights | Retirados únicamente de las copias experimentales | No instalar telemetría sustituta sin revisión de privacidad |

No se agregó una Function para esconder las diferencias. Query filtering HTTP y HTML diferente según query no son posibles con un único archivo estático. Alternativas futuras: páginas estáticas de filtros con rutas nuevas y un plan de compatibilidad para las query existentes, o una función mínima con cuota dinámica. Ninguna se ha elegido como equivalente automática. Los canonical de filtros siguen apuntando a `/actividades`.

## B. Next.js mediante vinext / Workers

Versiones fijadas en un manifiesto y lock **separados**: vinext 1.3.0 (`latest` estable observado), Vite 8.3.5, Wrangler 4.152.0, plugin Cloudflare 1.65.0 y React 19.3.1. El proyecto principal continúa con React 19.2.3: vinext requiere una actualización aislada para la prueba. No se reemplazó Next.js en producción. Consultas: [repositorio y compatibilidad de vinext](https://github.com/cloudflare/vinext), [publicaciones oficiales](https://github.com/cloudflare/vinext/releases), [registro npm](https://www.npmjs.com/package/vinext).

El analizador de vinext indicó 95% (17 funciones soportadas, 2 parciales: imágenes y Turbopack). El build original pasó, pero Workers devolvió 500 por `ENOENT /bundle/public/data/provincias.json`. El build, por tanto, **no** demostró compatibilidad. Se reemplazan las lecturas `fs` por imports JSON en la copia. No hay BD ni fetch al catálogo por visita.

Otros ajustes solo experimentales:

- Imagen mediante `<img>`/`srcset` y preload, sin binding de Cloudflare Images ni optimizer de Vercel.
- Fuentes Geist autoalojadas desde el build Next: el shim de `next/font/google` generaba una dependencia de Google Fonts que habría cambiado los terceros contactados.
- Favicon copiado explícitamente a assets; inicialmente producía 404.
- Excluir imágenes, fuentes, PDF, JSON y `_next/static` de `run_worker_first` para no convertir cada recurso estático en una invocación. Las páginas/RSC sí pueden consumir solicitudes dinámicas.
- Copias de PDF del **build local** apartadas en `.artifacts/pr10/quarantine/` para ejecutar workerd. Un despliegue de ese resultado rompería enlaces PDF y está expresamente bloqueado. Los 24 originales siguen en `public/pdf/`.
- Demo de RSC asíncrono con `connection()`, Suspense y contador cliente para comprobar respuesta incremental e hidratación en ejecución, no solo construcción.

Hay diferencias reales en APIs del framework, bundling y semántica de scripts/hidratación; vinext sigue en desarrollo activo. Las limitaciones observadas y las pruebas que fallan se conservan en RESULTS. No es una recomendación para reemplazar producción hoy. El `dry-run` solo empaqueta localmente: no certifica arranque, CPU, memoria, caché, compatibilidad del edge ni latencia desde Argentina.

## Prototipos reproducibles

Requisitos: Node >=22.19.0, `npm ci` del proyecto, Chrome local para Playwright y espacio de disco para copias de ~0,9 GB más builds y variantes. No requiere credenciales. Las copias usan únicamente archivos versionados; no copian `.env`, `.git` ni `publicidad/`. `prepare` rechaza destinos arbitrarios y limpia únicamente su subcarpeta permitida; preserva `node_modules` para reutilización explícita. Los originales no se modifican.

```sh
npm ci
node scripts/pr10/build-prototypes.mjs
# Opcional después de la instalación inicial y sin cambiar el lock:
# node scripts/pr10/build-prototypes.mjs --reuse-installed
node scripts/pr10/serve-prototypes.mjs
```

En otra terminal:

```sh
npx playwright test --config scripts/pr10/playwright.config.ts
node scripts/pr10/benchmark.mjs
# Comparación observacional de 3 cargas de la home pública, sin escrituras:
# node scripts/pr10/benchmark.mjs --live-vercel
SEO_AUDIT_BASE_URL=http://127.0.0.1:4301 SEO_AUDIT_REPORT=.artifacts/pr10/reports/seo-static.json npm run audit:seo
SEO_AUDIT_BASE_URL=http://127.0.0.1:4304 SEO_AUDIT_REPORT=.artifacts/pr10/reports/seo-worker.json npm run audit:seo
node scripts/pr10/pdf-matrix.mjs
# Opcional: consulta fuentes públicas, sin extracción/publicación de PDF:
# node scripts/pr10/pdf-matrix.mjs --verify-sources
node scripts/pr10/contact-sheet.mjs
node scripts/pr10/probe-http.mjs
node scripts/pr10/collect-evidence.mjs
```

Puertos: 4300 baseline Next; 4301 estático con imágenes locales; 4302 simulación de origen de imágenes; 4305 estático con imágenes en ese origen; 4304 workerd local. La comparación 4305 **no es una medición del CDN de Cloudflare**. Si los puertos están ocupados, el servidor se detiene en vez de usar otro servicio. Ctrl+C termina los procesos hijos creados.

El proceso de build instala dependencias aisladas mediante lock, genera imágenes, compila baseline/estático/Workers, comprueba TypeScript y assets y termina con `wrangler deploy --dry-run`. Ese comando **no publica**. No hay comando de despliegue remoto automatizado. La salida y fotos derivadas están ignoradas por Git. Las pruebas experimentales no se incluyen en el E2E normal: requieren estos servidores y algunas documentan diferencias pendientes.

El archivo `vercel.json` deshabilita el despliegue automático de **esta rama exacta** para no gastar cuotas personales ni crear un Preview no autorizado. Las demás ramas, incluido `main`, conservan el comportamiento predeterminado. [Configuración oficial por rama](https://vercel.com/docs/project-configuration/git-configuration#git.deploymentenabled). No se cambió la integración remota.

## Fotografías y derechos

El inventario de PR 9 agrupa 306 archivos bajo `tourism-images`: 300 JPEG, 2 PNG, 2 SVG y 2 archivos que no son fotos (README y acceso directo `.lnk`). El total histórico de 234,68 MB incluye esos 1.739 bytes auxiliares; no se borraron.

El inventario versionado de PR 9 contiene MIME, dimensiones, bytes, SHA-256, referencias estáticas y sospechas de archivos sin referencias: [media-inventory.json](../supabase/media-inventory.json). No se considera una búsqueda estática prueba de que una foto sea prescindible. `scripts/pr10/images.mjs` consume ese inventario y produce un manifiesto que mantiene la correspondencia entre cada URL antigua y sus derivados. Seis grupos de duplicados comparten variantes por hash; no se borra ninguna URL original.

Se generan WebP calidad 72 a 480/960/1600 px sin ampliar originales y AVIF calidad 48 para cinco muestras: portada, provincia, actividad y carrusel. Se respeta orientación y espacio sRGB; se preserva metadata con `withMetadata`, a diferencia del comportamiento predeterminado de Sharp. Debe revisarse información personal/ubicación antes de publicar metadata. Las referencias a `alt` continúan en los componentes originales; no se reemplazan por nombres de archivo. [Sharp: metadata](https://sharp.pixelplumbing.com/api-output/#withmetadata).

El informe de muestra incluye PSNR y hoja visual. PSNR no prueba equivalencia perceptual, autoría, derechos de imagen ni licencia. Algunas áreas de vegetación pierden detalle: calidad/tamaños definitivos requieren revisión a tamaño de uso. El prototipo conserva originales **y** variantes, por lo que el build de prueba pesa más; una futura lista de publicación aprobada puede excluir originales del despliegue después de respaldo, revisión de enlaces/OG y autorización.

**No se encontró documentación de licencias suficiente para dar las imágenes por autorizadas.** Publicación existente, EXIF o una fuente oficial no conceden permiso de reproducción. El demo HTML no publica fotografías nuevas: el componente requiere licencia, permiso humano y atribución antes de mostrarlas. `publicidad/` sigue fuera del repositorio y no fue modificada. No se instaló seguimiento publicitario.
