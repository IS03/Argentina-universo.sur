# PR 12 — Escapadas HTML y retirada progresiva de PDF

Base: `main` `26f7ffb` (PR11 fusionado). Rama: `codex/pr12-escapadas-html`. El sitio estático es el candidato de continuidad; Vercel sigue siendo producción y el dominio no cambia. No se crean recursos remotos ni se modifican Supabase, facturación, analíticas o consentimiento.

Este PR prepara **tres textos nuevos completos**, más El Palmar existente, para revisión humana. No publica ninguna ficha. Las tres guías relacionadas suman 87.573.364 bytes de PDF, pero **no se ha declarado equivalencia ni retirado un solo archivo**.

- [Inventario editorial de las 23 guías y fuentes iniciales](EDITORIAL-INVENTORY.md).
- [Matriz legible de PDF](PDF-MATRIX.md) y [registro estructurado](pdf-replacements.json).
- [Textos y hashes para revisión](review/README.md).
- [Documento de seguridad, separado](security-document.json).
- [Publicación, migración, reversión y condiciones del traslado](RELEASE-PLAN.md).
- [Pruebas y evidencias](RESULTS.md).

## Modelo y componentes

`lib/pages/trips.ts` mantiene el contrato de PR11 como versión 1 para El Palmar, sin reescribir su contenido ni decisiones. La versión 2 añade:

| Parte | Datos y relación |
| --- | --- |
| Identidad | ID estable de la nueva ficha, slug, destino, provincia descriptiva e introducción original |
| Geografía | Slugs canónicos de jurisdicciones y localidades con ID de origen Git, nombre, provincia y fuentes; admite varias provincias |
| Texto | Secciones identificables de qué conocer, actividades, naturaleza/cultura y práctica; párrafos originales y fuentes por sección, también para la introducción |
| Ubicación | Una o varias referencias con descripción, fuente y mapa orientativo; no se inventan coordenadas ni se confunde una oficina con una portada de visita |
| Multimedia | Archivos locales WebP/AVIF precompilados, variantes, dimensiones, texto alternativo, pie y atribución; permiso/licencia revisados de forma independiente |
| Procedencia editorial | Estado documental, fecha de actualización real, IDs de guías legadas, futuras correspondencias con Work y revisiones pendientes; excluido de la proyección pública |
| Decisiones | `status`, `publicationAuthorized` y revisión humana identificada vinculada al SHA-256 exacto; sin equivalencia automática entre investigación y aprobación |

Los nuevos IDs son del origen editorial de Git. `legacyGuideIds` conserva los IDs `esc_…` del catálogo existente; no convierte el ID de un PDF en un ID de ficha del maestro. `masterRefs` está vacío: la conciliación de IDs originales de Work requerirá autorización y revisión posterior, sin coincidencias automáticas por nombre o slug.

`TripArticle` es un componente de servidor reutilizable, con encabezados semánticos, índice de secciones, referencias enlazadas, mapas externos y fotografías responsivas cuando tengan permisos comprobados. No necesita JavaScript para leer el texto, ni un mapa embebido, optimizador de imágenes o llamadas adicionales a una base de datos. Las fotografías admitidas llevan dimensiones verificadas y crédito visible; la prueba de permiso no se serializa. El lote actual no incluye fotografías porque falta acreditar sus derechos: no se usan imágenes de APN ni de los PDF por el solo hecho de estar disponibles.

`PublishedTrips` prepara en `/escapadas` la navegación a artículos aprobados antes del archivo PDF. Con cero fichas publicables no muestra tarjetas, títulos ni enlaces a borradores. Hoy el catálogo de 23 PDF **sigue disponible**: pasar a una experiencia basada principalmente en artículos requiere la aprobación posterior de contenido suficiente. No se rellena la página con fichas incompletas ni se anuncia contenido que devuelve 404. Se actualizan únicamente la presentación y la metadata de Escapadas para admitir esta transición.

## Primer lote

| Ficha | Alcance | Estado / permiso / revisión |
| --- | --- | --- |
| Buenos Aires | Barrios, centro, naturaleza urbana, recorridos y planificación; 532 palabras de texto principal | draft / false / null |
| Puerto Iguazú | Ciudad y parque argentino, recorridos, interpretación y planificación, con indicación permanente de consultar el estado oficial y una observación histórica fechada y con caducidad sobre Garganta del Diablo ([detalle](RESULTS.md#avisos-operativos-garganta-del-diablo)) | draft / false / null |
| Talampaya e Ischigualasto | Dos parques y dos jurisdicciones, sin prometer un itinerario único; 539 palabras | draft / false / null |
| El Palmar | Texto existente de 390 palabras; reconsulta de sus cuatro fuentes APN | draft / autorización previa conservada / null |

El recuento incluye introducción y párrafos, no títulos, fuentes ni mapas. La longitud no prueba calidad o aprobación. La investigación específica de las tres nuevas fichas complementa el relevamiento inicial de fuentes de las otras 20; no se afirma que esas 20 ya tengan textos completos o logística verificada.

## Protección de borradores

Se conserva `tripPublishable` y el hash de PR11: ningún flag de exportación permite distribuir un borrador. Catálogo `server-only`, proyección explícita de campos públicos y limpieza previa del clon de compilación. Con cero fichas aprobadas Next no recibe una ruta dinámica vacía: la ruta se omite únicamente en el clon. No se habilita una URL pública de revisión, ni siquiera noindex.

`content/escapadas/index.ts` valida cada ficha al compilar: una aprobación sin revisión ligada al hash exacto hace fallar `next build`. `editorial:audit-next` revisa además lo que el build de Vercel sirve al navegador (`.next/static` y prerenderizados).

La auditoría inspecciona HTML, JavaScript, RSC, JSON, respuestas sin extensión, mapas de fuentes y archivos comprimidos. También rechaza las claves editoriales nuevas y las correspondencias del maestro. El control incluye los cuatro textos, no solo El Palmar. Los documentos de revisión se generan fuera de `public/` y del artefacto. No se consultó, editó ni importó el Google Sheets.

Las auditorías SEO añaden al conjunto esperado únicamente futuras fichas aprobadas; las 106 URLs actuales se conservan ahora. Publicar una nueva ficha aumentará el sitemap deliberadamente, sin sustituir las URLs existentes ni introducir fechas de build como fechas editoriales.

## Reproducción

```sh
npm ci
npm run check
npm run editorial:review
npm run editorial:plan
npm run editorial:audit-next   # después de npm run build
npm run editorial:links        # manual: HEAD a producción y al Preview, sin descargas
node --experimental-strip-types scripts/editorial/report.mjs
npm run build:pages -- --production-audit
npm run build:pages -- --consent-test
npm run build:pages
node --experimental-strip-types scripts/pages/audit.mjs production-audit
node --experimental-strip-types scripts/pages/audit.mjs consent-test
node --experimental-strip-types scripts/pages/audit.mjs preview
```

`editorial:plan` es exclusivamente una simulación: cero escrituras públicas, cero redirects activos y ninguna eliminación. Para ejecutar la suite adicional de navegador, levantar los cinco servidores locales documentados en [PR11](../pr11/README.md#reproducción-local), luego `npm run test:pages`. La instalación de Wrangler sigue aislada y local; no requiere login ni crea infraestructura remota. No subir los modos de compatibilidad/consentimiento ni los documentos de revisión.

## Fases posteriores, fuera de este PR

1. Revisar y aprobar el primer lote, incluidas fotografías y alcance. Validar cada sustitución y sus respaldos antes de retirar PDF.
2. Continuar los lotes B02–B06, de cuatro guías cada uno. Prioridad y alcance explícitos en el inventario; no son un calendario de publicaciones automáticas.
3. Conciliar e incorporar por lotes autorizados las 84 fichas de Work y sus relaciones/evidencias, conservando el maestro de 18 pestañas y todos sus estados originales. El trabajo SQL de PR9 permanece disponible; activar Supabase solo si aparecen necesidades que justifiquen una base en ejecución.
4. Rediseño integral sobre contenido aprobado, con búsqueda y navegación accesibles, imágenes precompiladas y buen comportamiento móvil. No se rediseña toda la web aquí.
5. Publicidad directa y Google AdSense en una fase separada: espacios identificados y dimensiones reservadas, sin ocultar contenido ni confundirlos con enlaces editoriales. Requiere decisiones del responsable, elegibilidad del proveedor y revisión previa de privacidad/consentimiento. No hay scripts, anuncios, píxeles o seguimiento nuevos.

USD 0 de hosting es un objetivo condicionado a las cuotas del plan y la cuenta del titular. No incluye dominio, trabajo editorial, licencias o respaldos durables. El Preview ya publicado no demuestra por sí solo independencia de Vercel: todavía utiliza sus PDF. No se promete gratuidad ilimitada.
