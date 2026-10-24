# Preview Free, traslado y reversión

No se creó ni utilizó una cuenta Cloudflare remota. No se cambió DNS. Los pasos siguientes son instrucciones para el responsable; no una autorización implícita de provisión.

## Antes de crear el Preview

1. El responsable crea o identifica su **propia cuenta Cloudflare Free**, con correo y MFA bajo su control. Verificar nombre, email e identificador de cuenta, y dejar autorización explícita para crear únicamente el proyecto `argentina-universo-sur-preview`. No usar la cuenta personal del desarrollador, OWNLEVEL ni otros proyectos. No agregar tarjeta, plan Paid, R2, Images, Functions ni integraciones de facturación.
2. Revisar derechos de imágenes y la [propuesta de privacidad](PRIVACY-DELTA.md). La variante Pages del componente ya describe Cloudflare y retira la afirmación de uso de SDK Vercel; aprobar ese texto antes de publicar el Preview. Conservar la política de producción mientras siga en Vercel. No habilitar ninguna analítica nueva.
3. Usar esta rama y la revisión exacta aprobada; no el directorio de prueba de vinext. No conectar ni transferir dominios. Limitar la integración GitHub al repositorio `IS03/Argentina-universo.sur`; los servicios definitivos quedan en la cuenta del titular. El proyecto GitHub permanece donde está: no se transfirió.

## Creación manual de Preview

4. En Workers & Pages elegir **Pages**, conectar Git y seleccionar el repositorio autorizado. Nombre sugerido: `argentina-universo-sur-preview`. Mantener el plan Free y el dominio automático `.pages.dev`. La rama de publicación de este proyecto temporal debe ser `codex/pr11-pages-ready`; no tocar el proyecto o dominio actual.
5. Build: `npm run build:pages`. Output: `.artifacts/pages/preview`. Root: repositorio. Node: `22.19.0` o compatible según `.nvmrc`. No usar preset que agregue un Worker, `vinext`, `@opennextjs`, bindings o funciones. El build ya configura export y Preview seguro; no requiere variables Supabase.
6. No configurar el ID real de GA4 en este proyecto de revisión. El build Preview lo deja vacío y genera `noindex` global/robots bloqueado. Incluso un artefacto de producción tiene guard de hostname para impedir medición en aliases. No subir `production-audit`, `consent-test`, `source`, backups ni el caché de imágenes.
7. Tras autorización y publicación del Preview: comprobar las 106 URL, `robots.txt`, sitemap, noindex, redirects de fotos y Catamarca, navegación móvil, Leaflet, carruseles y enlaces PDF externos. Las rutas provinciales funcionan sin JS. En `.pages.dev`, la query antigua sin JS conserva la diferencia documentada; no certificar paridad total allí.
8. Medir frío/caliente desde Argentina y varios dispositivos. El rendimiento local y Wrangler no sustituyen esta medición remota. Registrar URL del Preview, cuenta, commit, fecha y resultados; este PR no inventa una URL remota.

## Regla legacy sin Functions

[cloudflare-zone-rules.json](cloudflare-zone-rules.json) prepara tres Single Redirect Rules para `http_request_dynamic_redirect`: alias Catamarca, slugs válidos, y valores desconocidos. Las reglas están limitadas explícitamente a `www.argentinauniversosur.com`; para una zona de revisión generar/adaptar únicamente el hostname autorizado, sin comodines; el JSON no se envió a la API. No reemplazar un ruleset entero ni borrar reglas existentes: revisar cupo y orden antes de agregar.

Free ofrece 10 Single Redirect Rules por zona; las tres de filtros y una regla apex→www pueden caber si quedan plazas. Requieren DNS proxied de una zona del responsable; no se pueden configurar sobre el dominio `.pages.dev` de Cloudflare. [Disponibilidad y requisitos](https://developers.cloudflare.com/rules/url-forwarding/). Antes del traslado, validar sintaxis en la API/UI de la cuenta, prioridad, percent-encoding, parámetros repetidos/vacíos/desconocidos, query preservada y ausencia de bucles. El servidor `--zone-rules` solo modela el contrato; no es una prueba del motor remoto.

No cambiar DNS para demostrarlo en este PR. Si el titular no puede tener una zona proxied o no acepta estas reglas, queda bloqueada la equivalencia legacy sin JS; no ocultarla con una Function que consumiría solicitudes dinámicas.

## Costo y sostenibilidad

A 24/10/2026: Pages Free admite 20.000 archivos y 25 MiB por archivo, 500 builds/mes, uno simultáneo y 20 min/build. Este Preview ronda 2.057 archivos/102 MB y no tiene archivos grandes. Hosting estático anuncia requests/transferencia sin cargo por uso, sujeto a términos y límites: no es una garantía de gratuidad ilimitada. No hay CPU de SSR ni invocaciones de aplicación; GA4, mapas y enlaces externos conservan sus propios proveedores. [Límites](https://developers.cloudflare.com/pages/platform/limits/), [oferta Pages sin tarjeta](https://www.cloudflare.com/products/pages/).

No se identificó una restricción de uso exclusivamente personal equivalente a Vercel Hobby; el titular debe aceptar los [términos de Cloudflare](https://www.cloudflare.com/terms/), validar derechos y revisar cambios futuros, incluida publicidad. No se activó publicidad. Si se agota el cupo de builds no asumir upgrade automático; detener publicaciones y revisar. El dominio, sus renovaciones, trabajo editorial y licencias no forman parte de USD 0 de hosting. Git y CI mantienen sus condiciones propias.

R2 no es necesario para el candidato y requiere checkout/facturación; Supabase sigue pospuesto y su trabajo de PR9 intacto. La cuenta del responsable evita compartir cuotas de otras aplicaciones. El Preview aún usa los PDF del sitio actual como enlaces externos: no demuestra independencia completa de costos hasta completar su sustitución.

## Bloqueos del dominio y futura publicación

- Cuenta, autorización y Preview remoto pendientes; no se verificaron CDN/TLS/caché reales.
- Las 23 guías requieren reemplazos aprobados individualmente y backup privado durable restaurable por SHA-256; diez exceden el límite Free. El documento de seguridad requiere revisión separada. No reutilizar El Palmar como redirect genérico de Entre Ríos.
- Confirmar derechos de las fotografías y texto final de la nueva ficha. Publicación de El Palmar autorizada en el chat; no se inventa una revisión humana del texto exacto ni se aprueban registros del maestro.
- Aplicar y verificar reglas legacy por query y apex→www en una zona autorizada; preservar `https://www.argentinauniversosur.com`, slugs, alias y canonicals. El host histórico de Vercel no pasa por Cloudflare: necesita un plan en el alojamiento anterior del titular.
- Actualizar política y configuración real de GA4 para Pages. En un futuro release se requiere `AUS_STATIC_EXPORT=1`, `SITE_ENV=production`, `CF_PAGES=1`, `CF_PAGES_BRANCH` igual a `SITE_PRODUCTION_BRANCH`, ID real aprobado y hostname oficial. Este PR no ofrece un modo de release que saltee los bloqueos.
- Inventariar DNS/correo/verificaciones y confirmar titularidad del dominio antes de un corte separado autorizado. No retirar Vercel ni sus archivos hasta validar el destino y rollback.

## Reversión

Ahora: revertir el commit del PR deshace el código preparado; no hubo recursos ni DNS que restaurar. El comportamiento Vercel continúa por defecto. Los originales permanecen en Git/`public`, sin reescribir historia; los artefactos y cachés están en `.artifacts/pages` y pueden regenerarse.

Para un traslado futuro: guardar configuración DNS/TLS/headers/redirects anterior, release y manifiesto de hashes, backups privados del titular y prueba de restauración. Autorizar corte separado, validar primero Preview y plan de rollback; ante fallo restaurar la release/DNS registrados con autorización de corte. No borrar datos, cambiar IDs ni resetear decisiones de cookies. Retirar o transferir el alojamiento anterior solo después de confirmar compatibilidad para no perpetuar las cuotas personales del desarrollador.
