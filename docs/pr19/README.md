# PR19 — Santa Fe capital y Alta Gracia

Primera publicación editorial autorizada: dos páginas turísticas completas y estáticas, integradas al sistema visual de PR15–18. Rosario continúa retenida. No se publica el Google Sheets maestro ni se cambian sus estados.

## Versiones y autorización

El titular aprobó expresamente el 26/10/2026 las cinco decisiones de cada ficha del paquete privado `AUS-R2-SFE-AG-2648c2973491`: alcance, texto/SEO, fotografías/derechos, información práctica/mapas y permiso web independiente. La autorización abarca su proyección en este PR público y Cloudflare Preview; producción queda pendiente de revisión técnica y merge autorizado por el titular. No hay auto-merge ni cambios manuales de producción.

La declaración original, fecha, procedencia y diez decisiones se conservan únicamente en `.artifacts/pr19/private/authorization/`. No se incorpora esa declaración a GitHub, logs o artefactos. No existe ni se afirma una firma digital: un digest verifica la integridad de una versión, no la identidad de una persona.

Los ocho hashes autorizados están fijados en `lib/destinos/authorized.ts`. Antes de exportar se recalcularon los cuatro objetos privados por ficha mediante `authorize-publication.mjs`, manteniendo la revisión R2 intacta. El build público vuelve a calcular el hash del payload y de los manifiestos de variantes, comprueba las cinco decisiones, el canal y el digest de autorización, y verifica los bytes de cada foto. El CI no accede a evidencia privada ni puede autenticar por sí solo un mensaje humano; esa procedencia se verificó contra la instrucción original del titular y queda disponible para su revisión privada.

## Rutas, contenido y diseño

- `/destinos/santa-fe-capital`
- `/destinos/alta-gracia`

`generateStaticParams` usa solo la lista pública validada; `dynamicParams=false` impide otras fichas. La presentación es un Server Component: portada fotográfica, tipografía editorial, atractivo principal destacado y dos tarjetas complementarias, información práctica compacta, ubicaciones, fuentes numeradas con ida/vuelta y enlaces relacionados. No hay imágenes de relleno para atractivos sin fotografía autorizada.

Los textos, títulos, descripciones SEO, enlaces, mapas, créditos y fotografías son los de R2. No se abrevia ni reescribe el payload para ajustar el diseño. El título SEO es absoluto para conservarlo sin el sufijo automático que utiliza el resto de la web. Las imágenes mantienen las mismas rutas y bytes de R2, sin optimizador remoto ni nuevas transformaciones.

Las páginas provinciales de Santa Fe y Córdoba enlazan las fichas con su título y resumen aprobados. Las 106 URLs anteriores se conservan y el sitemap suma exclusivamente las dos nuevas: **108**. No se inventa `lastModified` a partir de la fecha de build. No se agrega un índice `/destinos`.

## Proyección y seguridad

`content/destinos/` contiene solo los dos payloads aprobados y el manifiesto público mínimo. No incluye identidades originales del maestro, filas, estados documentales, evidencias, dictámenes, notas privadas ni respuestas personales. Los IDs públicos opacos se corresponden con los originales únicamente mediante la conciliación privada.

Los seis atractivos son bloques del texto expresamente aprobado dentro de esas dos páginas. No se publican sus registros completos del maestro ni rutas independientes. Los otros 82 registros no reciben publicación independiente y no se importa el maestro. Las 24 Escapadas y los PDF siguen intactos, sin sustituciones o redirecciones nuevas.

El control anterior que bloqueaba toda ruta Work ahora admite únicamente el segmento de destinos validado. Se mantienen los bloqueos de importación de herramientas privadas, datos del maestro, borradores y rutas no autorizadas. Las ocho variantes fotográficas están enumeradas por path/SHA-256/dimensiones/tamaño; una fotografía adicional en su directorio reservado o unos bytes alterados bloquean el build. El filtro de rutas distingue una etiqueta interna de caché de Next (`_N_T_/destinos/layout`) de una URL navegable; las rutas de Rosario o fixtures retenidos siguen fallando.

## Fotografías y licencias

| Ficha | Autor | Licencia | Variantes |
| --- | --- | --- | ---: |
| Santa Fe capital | ElGuruCesar | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | 165474 B |
| Alta Gracia | Banfield | [CC BY-SA 2.5 Argentina](https://creativecommons.org/licenses/by-sa/2.5/ar/deed.en) | 186858 B |

Ocho WebP aprobados: **352332 B** en total. Se conservan autor, título original enlazado, licencia, texto alternativo, pie y transformaciones. Santa Fe: reducción/compresión, sin recorte. Alta Gracia: recorte y reducción/compresión documentados en R2, sin corrección de exposición. Las variantes mantienen la licencia de su original; CompartirIgual corresponde a las fotografías/adaptaciones identificadas, sin atribuir automáticamente esa licencia a todo el sitio. No se imponen restricciones incompatibles a su reutilización. Los JPEG originales y las evidencias de licencia siguen privados; no se incluyen en el despliegue.

## Verificación y entrega

Véase [validación y rendimiento](VALIDATION.md). Las capturas finales de escritorio y móvil se entregan con el PR y el Preview permite revisar la presentación real. Una medición de laboratorio no es una promesa de Web Vitals de campo.

```sh
npm run lint
npm run typecheck
npm run validate
npm test
npm run build
npm run editorial:audit-next
npm run audit:seo
npm run build:pages
npm run editorial:audit-work
npm run test:e2e
```

El chequeo privado adicional de autorización requiere cuatro insumos locales con permisos privados (no disponibles en CI): lote original R2, recibo, snapshot autorizado y declaración original. `scripts/editorial/authorize-publication.mjs` solo verifica; no aprueba ni publica por sí mismo.

## Alcance de infraestructura y reversión

Sin dependencias nuevas, Supabase remoto, DNS, GA4, consentimiento o publicidad. Se omite el Preview de Vercel para esta rama; la integración Git existente de Cloudflare construye únicamente un Preview estático en el proyecto ya autorizado. Los bloqueos históricos del traslado de dominio/retirada de PDF siguen vigentes.

Para revertir, preparar un PR que retire las dos proyecciones y sus enlaces/sitemap y adapte el loader a la selección resultante. Si las URLs ya hubieran salido a producción, revisar su tratamiento SEO antes de retirarlas. No hay base de datos ni DNS que revertir, y los PDF originales permanecen disponibles. Un cambio editorial futuro requiere nuevos hashes y revisión humana de la versión resultante.
