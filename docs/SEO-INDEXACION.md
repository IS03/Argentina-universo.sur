# SEO técnico e indexación

## Origen oficial

`https://www.argentinauniversosur.com` es la única identidad pública del sitio.
`SITE_URL` en `lib/seo.ts` se comparte entre metadata, canonical, Open Graph,
imágenes sociales, sitemap y robots. No depende de `NEXT_PUBLIC_SITE_URL`,
`VERCEL_URL`, el host del request ni el dominio del Preview. La variable antigua
puede retirarse de la configuración de Vercel: ya no se lee.

La URL raíz con o sin `/` final representa el mismo recurso; Next.js normaliza
canonical y OG de la raíz sin barra. El sitemap serializa la raíz con `/`.
Las páginas interiores usan rutas sin barra final, sin query string ni fragmento.
Los filtros de actividades canonicalizan al listado `/actividades`.

## Metadata

`lib/seo.ts` define las diez páginas estáticas y genera la metadata de las 24
provincias y 72 actividades a partir de sus datos existentes. Cada página exporta
su metadata. El layout raíz conserva los valores comunes y las integraciones de
observabilidad, sin imponer el canonical de la home a otros documentos.

La portada y el listado de actividades tienen entradas de servidor que exportan
metadata y montan los mismos componentes cliente. El markup y diseño permanecen
iguales. La metadata del listado ya no se hereda en los detalles de actividades.
Los títulos conservan el nombre completo de la actividad y usan la provincia como
contexto; no se recortan según la longitud de una ubicación. Las descripciones
normalizan espacios/saltos y se acortan a un máximo de 160 caracteres sin modificar
los textos turísticos originales. Ese máximo es una decisión editorial del sitio,
no una garantía del tamaño del snippet que mostrará Google.

Las imágenes de Open Graph/Twitter usan los assets existentes con URL absoluta
oficial. No se declaran tamaños ficticios de 1200×630 para fotos que no tienen ese
formato. Las páginas 404 responden `noindex` sin heredar un canonical de portada o
listado y quedan fuera del sitemap.

## Sitemap y lastModified

`/sitemap.xml` contiene 106 URLs canónicas: cinco páginas principales, 24
provincias, 72 actividades y cinco subpáginas de Santa Fe. Excluye filtros,
redirecciones, la variante `catarmaca` y páginas 404.

**Política:** se omite `lastModified` mientras la fuente no tenga fechas de edición
significativa verificables por página. No se usa la fecha del build, `mtime` de
archivos, fecha del deploy ni la fecha de celebración de un evento. Los rebuilds
no deben simular actualizaciones de contenido. El sitemap publica solo `loc`;
Google ignora las señales `priority` y `changefreq`.

Cuando exista una fecha editorial fiable, incorporar un campo `updatedAt` por
registro/página y validarlo antes de añadir `<lastmod>`. No asignar una fecha
histórica inventada al contenido existente.

Referencia: [Google: crear y enviar un sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

## Robots y entornos

En producción, `/robots.txt` permite rastrear el sitio y los recursos `/_next/`
(JavaScript, CSS, imágenes). Solo mantiene excluidos `/api/` y `/private/` y
anuncia el sitemap oficial. Se elimina `Host`, que no es necesario para Google,
y las reglas duplicadas por bot. Robots no sustituye autenticación.

Con `VERCEL_ENV=preview`:

- La metadata y el header `X-Robots-Tag` indican `noindex, nofollow`.
- `robots.txt` bloquea el rastreo con `Disallow: /` y no anuncia el sitemap.
- Los canonical y Open Graph siguen apuntando a producción.
- Los hosts de Preview conservan sus rutas; no se redirigen globalmente a producción.

Una directiva `Disallow` no garantiza por sí sola que una URL desaparezca del índice;
si el robot no puede rastrear el documento tampoco puede leer su `noindex`. Se
mantiene la protección de despliegues de Vercel y se combinan estas señales; el
Preview no debe enviarse a Search Console ni publicarse como URL canónica.

Referencias: [Google: robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro),
[Google: impedir indexación con noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

## Migración de Catamarca

- Canónica: `/provincias/catamarca`, HTTP 200.
- Legado: `/provincias/catarmaca`, HTTP 308 hacia la canónica, conservando query string.
- Se elimina la regla inversa incorporada en PR 01; ambas reglas nunca coexisten.
- Datos, mapa, tarjetas, enlaces, metadata y sitemap usan `catamarca`.
- `?provincia=catarmaca` sigue siendo un alias de filtro válido.
- El historial local de provincias reconoce el slug anterior.
- No se cambia el nombre ni el texto de la provincia, de sus actividades o sus fotos.

El chequeo HTTP prueba la redirección sin seguirla y confirma después que el
objetivo responde 200 sin otra redirección. Antes del cambio, producción enviaba
`Cache-Control: public, max-age=0, must-revalidate` para la regla inversa; un navegador
con esa respuesta almacenada debe revalidarla. Al publicar, comprobar también una
sesión que ya haya visitado la URL y conservar la redirección antigua→nueva a largo plazo.

Las reglas de aplicación también llevan el dominio sin `www` y el alias estable
`argentina-universosur.vercel.app` al origen oficial con 308 y preservan ruta/query.
En Vercel una regla de dominio del panel se ejecuta antes que Next.js: ver pasos manuales.

Referencia: [Google: redirecciones permanentes](https://developers.google.com/search/docs/crawling-indexing/301-redirects).

## Google Search Console — pasos manuales después de publicar

Estos pasos se documentan para el propietario; no se ha creado/verificado una
propiedad, alterado DNS ni enviado sitemaps desde este PR.

1. Añadir o seleccionar la propiedad de dominio `argentinauniversosur.com` en
   [Search Console](https://search.google.com/search-console). Verificarla con el
   registro TXT que proporcione Google, conservando los registros DNS existentes.
   Como alternativa, usar una propiedad de prefijo exacto `https://www.argentinauniversosur.com/`
   con uno de los métodos de verificación admitidos por Google.
2. Tras fusionar y publicar, abrir `https://www.argentinauniversosur.com/sitemap.xml`
   y confirmar que todas las URLs son oficiales, sin `catarmaca` ni fechas de build.
   En **Sitemaps**, enviar `sitemap.xml` y revisar su estado de lectura.
3. En **Inspección de URLs**, probar la portada, una provincia, una actividad y
   `/provincias/catamarca`. Comprobar respuesta 200, recursos accesibles y canonical
   declarado. Solicitar indexación de páginas importantes si corresponde.
4. Inspeccionar `/provincias/catarmaca`: debe verse como página con redirección.
   No pedir la retirada de la URL antigua ni bloquearla en robots; Google necesita
   rastrear la redirección. La selección de canonical por Google puede tardar.
5. Revisar **Indexación → Páginas**: canonicals seleccionados, páginas con
   redirección, 404, bloqueadas y duplicadas. Monitorear también **Rendimiento** y
   **Core Web Vitals** tras disponer de tráfico real.
6. Si ya existe una propiedad de prefijo del antiguo dominio de Vercel, conservarla
   para consultar su historial. No utilizar Cambio de dirección sin confirmar que
   se controla ese dominio y que sus URLs redirigen: el antiguo hostname de la
   metadata (`argentina-universo-sur.vercel.app`, con otro guion) responde 404 y no
   es el alias actual del proyecto.

Referencia: [Google: añadir una propiedad](https://support.google.com/webmasters/answer/34592),
[Google: inspección de URLs](https://support.google.com/webmasters/answer/9012289).

## Controles

- `npm test`: regresiones de origen, metadata, sitemap, robots, redirects y compatibilidad.
- `npm run audit:seo`: arranca `next start` sobre el build existente, audita las 106
  páginas reales sin JavaScript y comprueba HTTP, metadata, duplicados, sitemap,
  robots, filtros, redirects de host/Catamarca y 404. Cierra el servidor al terminar.
- `npm run check`: lint, tipos, integridad, tests, build y auditoría HTTP completa.
- GitHub Actions ejecuta también la auditoría después del build.

Para otro despliegue:

```bash
SEO_AUDIT_BASE_URL=https://preview-del-pr.vercel.app SEO_AUDIT_PREVIEW=1 npm run audit:seo
```

En un Preview protegido, usar el acceso autenticado de Vercel. El script admite
`VERCEL_OIDC_TOKEN` del entorno y solo lo envía al origen solicitado sin seguir
redirecciones. No guardar tokens en el repo, argumentos, logs ni informes.
`SEO_AUDIT_REPORT=/ruta/absoluta/informe.json` guarda resultados sin credenciales.
