# PR 11 — Candidato estático para Cloudflare Pages

Base: `main` `18a4780` (PR 10 fusionado). Rama: `codex/pr11-pages-ready`. No se modificó producción, DNS, cuentas, proyectos remotos ni archivos originales. vinext queda como investigación en PR10; este candidato usa **Next.js 16.4.3 exportado**, React 19.2.3, JSON y assets estáticos, sin Functions, Workers de aplicación, R2 ni Supabase en ejecución.

**Estado:** versión estática preparada y probada localmente, incluido el emulador oficial de Pages. No es una autorización de traslado. El Preview ligero conserva los enlaces PDF del sitio actual como enlaces externos; una migración independiente aún está bloqueada por aprobación de reemplazos PDF, derechos, privacidad y pruebas de reglas/dominio en la cuenta del responsable.

## Resultados y evidencias

- [Resultados, tamaños y rendimiento](RESULTS.md).
- [Seguridad editorial y ausencia de borradores en artefactos públicos](EDITORIAL-SECURITY.md).
- [Pasos exactos de Preview, reglas y reversión](CLOUDFLARE.md).
- [Cambios de privacidad propuestos](PRIVACY-DELTA.md).
- [Plan editorial y 24 PDF](content-plan.json), derivado de la [matriz de PR10](../pr10/PDF-MATRIX.md).
- [Reglas de zona preparadas, no aplicadas](cloudflare-zone-rules.json).
- [Evidencias reproducibles](evidence/).

## Filtros con y sin JavaScript

Cada jurisdicción tiene HTML propio en `/actividades/por-provincia/<slug>`. Hay 24 páginas provinciales y otra sin resultados. Todas mantienen canonical `/actividades` y quedan fuera del sitemap para preservar las **106 URL indexables existentes**. Santa Fe y Catamarca contienen tres tarjetas desde el HTML inicial. Se comprobaron las 24 páginas sin JS; no hay ocultación CSS de otras 69 actividades.

Los enlaces por provincia funcionan sin JavaScript. El select usa navegación cliente de Next y conserva una query informativa; recarga, atrás, historial y detalle siguen funcionando. En el candidato, `ROUTES.actividadesPorProvincia` produce la ruta estática. En Vercel se conserva el contrato original con query/rewrites.

Los enlaces antiguos `/actividades?provincia=…` tienen dos niveles de compatibilidad:

1. **En una zona del titular:** tres Single Redirect Rules preparadas entregan 308 hacia la página estática, conservan query y el alias `catarmaca`; no invocan Functions. El modelo local está probado. Requieren validar la sintaxis y el comportamiento en la cuenta real antes de habilitarlas. No se aplicaron reglas ni se tocaron DNS.
2. **En `pages.dev` sin zona propia:** Pages `_redirects` no admite condiciones de query. Con JS, un bootstrap temprano conduce a la página correcta. Sin JS, la URL antigua entrega el listado general y enlaces directos por provincia. **Esta diferencia no está resuelta por un HTML genérico** y no se presenta como equivalencia completa. La nueva ruta sí funciona sin JS.

La dirección visible cambia tras el 308; el canonical permanece. No hay bucle porque la regla solo coincide con `/actividades`. Parámetros repetidos usan el primero en el modelo; los slugs normales ASCII y `catarmaca` están cubiertos. Cloudflare `http.request.uri.args` no decodifica valores: la paridad de valores percent-encoded debe comprobarse/corregirse con la zona real antes del corte; no se da por verificada. El acceso por ruta `/provincias/catarmaca` tiene además su 308 de Pages, probado con Wrangler local y query conservada.

Referencias oficiales: [_redirects y sus limitaciones](https://developers.cloudflare.com/pages/configuration/redirects/), [Single Redirects y cuota Free](https://developers.cloudflare.com/rules/url-forwarding/), [argumentos sin decodificación](https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/http.request.uri.args/).

## Fotografías y separación de fuentes

`StaticImage` usa `img/srcset/sizes` y preload de React, con una política compartida y rutas por hash. No existe `/_next/image` ni transformación en el servidor. Fotografías: 320/640/960/1280 px; portadas: 640/960/1280/1920; logos: 64/128/256, sin ampliar y deduplicando tamaños nativos. Las grillas de portada, provincias, actividades e historial tienen `sizes` según su número real de columnas. Los logos declaran su ancho, evitando el `100vw` implícito. Solo la primera portada/logo prioritario se precarga; no se precargan las fotos siguientes como LCP. Se desactiva el prefetch especulativo de tarjetas.

Se generan solo WebP calidad 72 de la política; **no AVIF ni los otros escalones del experimento PR10**. El caché local puede contener archivos de pruebas previas, pero el artefacto copia únicamente el conjunto actual. Los seis grupos de duplicados comparten variantes por SHA. Los originales se validan por hash antes de usar el caché: una modificación obliga a revisar el inventario. Cambiar la calidad/política de codificación exige invalidar el caché local.

Las URLs históricas de JPEG/PNG tienen 308 al derivado WebP, conservando enlaces externos y OG. Solo se retiran copias redundantes del build; los originales siguen en `public/img/` y Git. Se preservan los `alt` del sitio y metadata mediante Sharp. Preservar metadata no acredita licencia; revisar también información personal antes de publicar. Dos SVG se conservan. README y acceso directo `.lnk` no se despliegan.

El artefacto omite catálogos JSON fuente y hojas/documentos auxiliares que el navegador no consulta; `/api/catalogo-resumen` continúa como **archivo JSON generado**, sin función. La exportación contiene HTML, CSS, JS, fuentes, mapas/iconos y medios. Los originales y Excel siguen intactos en el repositorio. El inventario detallado de formatos/dimensiones/duplicados sigue en PR9; ningún archivo se borra por una sospecha de falta de referencias.

Los derechos de fotografías existentes siguen pendientes de acreditación del titular. No se añadieron fotos externas ni se atribuyó una licencia inventada. La muestra visual se compara con los originales y con PR10; requiere aceptación final del responsable para migración.

## Escapadas: publicación autorizada y revisión del texto

El usuario autorizó explícitamente en esta conversación la nueva ficha de **El Palmar**, redactada desde cero con fuentes oficiales. Esa autorización queda registrada en `content/escapadas/el-palmar.json` y no alcanza al PDF, a las 84 fichas del maestro ni a infraestructura remota.

La ficha está completa para revisión **en el código del PR, fuera de los artefactos públicos**: presentación, naturaleza, patrimonio histórico, organización, recomendaciones, dirección, búsqueda de mapa, fuentes con fecha y enlaces relacionados. No inventa coordenadas precisas, tarifas, servicios disponibles, duración ni apertura. No copia el PDF ni incorpora fotografías sin permiso. La dirección y los hechos estables se verificaron en APN; datos variables se consultan en los canales oficiales.

La **autorización de publicación ya está otorgada**; el registro permanece en `draft`, con `review:null`, mientras el texto exacto se revisa. El gate existente exige revisión identificada vinculada al SHA-256 del contenido; una edición posterior invalida esa revisión. Esta corrección no cambia esa política ni registra una aprobación por cuenta del desarrollador. **Vercel y todos los modos de exportación responden 404 al borrador**, sin HTML, RSC ni contenido en JavaScript; noindex no es control de acceso. No se incluye tampoco la demostración de revisión de PR10. El catálogo `server-only` y la auditoría de artefactos impiden usar flags de exportación como excepción. Ver [barreras y alcance de la revisión del maestro](EDITORIAL-SECURITY.md).

`app/escapadas/[slug]`, `TripView` y el catálogo de publicación permiten agregar futuras fichas validadas. Los IDs nuevos de esta publicación no se presentan como IDs originales del maestro; el Sheets existente sigue siendo la fuente editorial principal y sus 84 registros no se importaron ni aprobaron. Antes de incorporar una ficha del maestro hay que conservar su ID/relaciones/fuentes/estados mediante el contrato de PR9. Este JSON es un artefacto de publicación, no otra planilla maestra.

El Palmar **no reemplaza por equivalencia la guía de toda Entre Ríos**. Las 23 guías y el documento de seguridad conservan `replacementApproved:false`, respaldo pendiente y ausencia de redirect autorizado. No se retiró ni redirigió ninguno en producción. El Preview enlaza los PDF a `https://www.argentinauniversosur.com/pdf/...`; esa dependencia es temporal y debe desaparecer antes de pretender independencia del alojamiento actual.

## Reproducción local

```sh
npm ci
npm run check
npm run build:pages -- --production-audit
npm run build:pages -- --consent-test
npm run build:pages
node --experimental-strip-types scripts/pages/audit.mjs production-audit
node --experimental-strip-types scripts/pages/audit.mjs preview
node scripts/pages/setup-local-cli.mjs
```

En terminales separadas, todos locales:

```sh
node --experimental-strip-types scripts/pages/serve.mjs .artifacts/pages/production-audit 4401
node --experimental-strip-types scripts/pages/serve.mjs .artifacts/pages/consent-test 4402
node --experimental-strip-types scripts/pages/serve.mjs .artifacts/pages/production-audit 4403 --zone-rules
node --experimental-strip-types scripts/pages/serve.mjs .artifacts/pages/preview 4404
```

Desde `.artifacts/pages/tooling`:

```sh
WRANGLER_SEND_METRICS=false npx wrangler pages dev --port 4410 --ip 127.0.0.1 --inspector-port 9240 --persist-to ../wrangler-state --show-interactive-dev-session=false
```

Desde la raíz:

```sh
npm run test:pages
# Comparación adicional; requiere el artefacto estático PR10 en 4301:
node scripts/pr10/serve-static.mjs .artifacts/pr10/static/out 4301
# En otra terminal:
node scripts/pages/benchmark.mjs
```

El harness reutiliza las expectativas de consentimiento existentes: solo cambia el transporte para representar el hostname oficial con los archivos del artefacto local e ID ficticio. No contacta producción para esos tests; `fallback` mantiene el retraso de JS dentro del transporte. La respuesta se inicia directamente desde archivo para evitar carreras con peticiones HTTP durante el cierre, sin omitir errores ni alterar las expectativas. El benchmark, en cambio, realiza lecturas públicas de producción expresamente para comparar, con Google y telemetría bloqueados. No se crearon eventos reales de GA4.

`production-audit` conserva PDF para pruebas locales y **no es desplegable** por sus diez archivos grandes. `consent-test` usa un ID ficticio y tampoco se sube. `preview` es el único candidato para el Preview del titular, después de autorización de cuenta y revisión de privacidad/derechos. `slim-size-estimate` lleva una marca de no despliegue: es una estimación, no un modo de saltar aprobaciones. No existe un comando de release de producción.
