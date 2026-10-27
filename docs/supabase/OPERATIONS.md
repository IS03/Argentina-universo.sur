# Configuración, validación real y reversión

> Estado institucional actualizado: [infraestructura remota](../pr25/README.md), [importación ejecutada](../pr26/README.md) y [web conectada en build de prueba](../pr27/README.md). El proyecto existente es `vpbonlzixodxvbybkffv` en `mzfanqzfjskgapsulpip`; no crear otro ni utilizar IS03. Lo que sigue conserva el contexto histórico.

> Actualización PR24: ver [infraestructura operativa local, conciliación integral y estado remoto](../pr24/README.md). Este documento conserva el contexto histórico de PR9.

## Creación del proyecto independiente

**Pendiente de decisión, sin recursos remotos creados por PR09.** La organización accesible `IS03` está en Free; no se presume que exista cupo ni se elige organización/plan en nombre del titular. Confirmar organización, región (evaluar São Paulo para el público argentino y región de las funciones Vercel), nombre `argentina-universo-sur`, cotización y autorización de cualquier costo. No usar el proyecto de OWNLEVEL ni otra aplicación como entorno de prueba.

Después de esa decisión:

1. Crear el proyecto independiente y registrar su referencia en un gestor seguro. Confirmar nombre/organización por API/Dashboard antes de cualquier link, migración o variable. La identidad no se prueba solo porque una clave funcione.
2. Revisar Advisors y tablas del proyecto vacío; comprobar que no contiene datos de otra aplicación. Mantener la base en una versión de PostgreSQL 17 con sus actualizaciones de seguridad. No activar OrioleDB/preview, extensiones, ramas pagas ni servicios adicionales sin necesidad y autorización.
3. Exponer **solo `public`** por Data API; excluir `editorial`. Desactivar concesión automática de acceso a tablas nuevas y usar los grants explícitos de las migraciones. Mantener deshabilitados registros de usuarios/anonymous sign-in mientras no se implemente Auth. No habilitar Realtime ni transformaciones de imágenes de pago.
4. Aplicar las migraciones revisadas primero en un entorno de prueba autorizado y vacío, con respaldo. Son aditivas, sin filas turísticas ni decisiones de publicación. No ejecutar `db reset` ni SQL destructivo contra un remoto.
5. Verificar buckets, límites globales y permisos a través de **Storage API real**, no solo mirando SQL. Bucket turístico público vacío; borradores/documentos privados. Probar anon y authenticated sin roles editoriales: subida, reemplazo, lectura privada y borrado rechazados.
6. Ejecutar pgTAP y Advisors de seguridad/rendimiento. Revisar cada resultado y repetir tras cambios. No suprimir avisos de RLS de `editorial`: todas sus tablas deben seguir protegidas aunque no estén expuestas.

## Validación local preparada

CLI consultada y usada para crear los archivos de migración: **2.122.0**, fijada en estos comandos. `supabase/config.toml` fue inicializado con esa CLI; es local, no configura ni vincula un proyecto hospedado. Incluye PostgreSQL 17, Data API solo pública, grants explícitos, seed deshabilitado, sin signup ni panel Studio/Realtime/servicios analíticos locales. Esto no altera Vercel Web Analytics, Speed Insights ni GA4 del sitio.

Cuando Docker esté disponible, en esta carpeta aislada y comprobando los puertos/proyecto local:

```sh
npx --yes supabase@2.122.0 start
npx --yes supabase@2.122.0 migration list --local
npx --yes supabase@2.122.0 test db --local
npx --yes supabase@2.122.0 db advisors --local --type security --fail-on error
npx --yes supabase@2.122.0 db advisors --local --type performance --fail-on error
```

`supabase/tests/foundation.test.sql` prepara nueve comprobaciones pgTAP con rollback, sin contenido real. **No se ejecutó** en PR09 porque Docker no está activo. Tampoco se ejecutó `db advisors`: no hay Supabase local disponible ni proyecto remoto correcto al cual dirigirlo. Nunca sustituir estos pasos por un asesor dirigido a un proyecto ajeno.

Para el entorno remoto independiente, consultar `--help`, comprobar la referencia exacta y usar el conector de Advisors/CLI con esa referencia. Evitar comandos de reset/merge. Las credenciales van en el gestor de secretos/entorno seguro; no en argumentos de comandos, logs, commits ni ejemplos de PR.

Después de aplicar SQL en un Supabase real, generar tipos oficiales (`supabase gen types typescript`, revisar sus flags actuales) y compararlos con `lib/supabase/database.types.ts`. Estos tipos locales proceden de introspección de PostgreSQL/PGlite; no incluyen schemas privados ni simulan un esquema remoto ya creado.

## Variables y Next.js / Vercel

El SDK público está fijado a `@supabase/supabase-js@2.118.0`. El lector es **de servidor**, anónimo y sin sesión; no se instala un flujo SSR de Auth ni se necesitan cookies o claves privilegiadas para esta preparación.

| Variable | Tratamiento |
| --- | --- |
| `SUPABASE_PROJECT_REF` | Referencia del proyecto dedicado, verificada manualmente |
| `SUPABASE_URL` | Exactamente `https://<SUPABASE_PROJECT_REF>.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Clave `sb_publishable_...`, de ese proyecto |
| Clave secreta o `service_role` | **No requerida ni leída por el sitio en PR09**. Si después existe un importador, será otro proceso privilegiado y con secreto separado |

Copiar `.env.example` a un archivo local ignorado solo cuando corresponda; no incluir valores reales en Git. El cliente devuelve `null` si falta configuración; no hay inicialización al importar el módulo ni llamadas de red durante build por este cliente. Rechaza claves secretas/JWT legado y URLs que no coincidan con la referencia. Las lecturas futuras tienen límite de tres segundos y un helper de fallback explícito, pero **ningún consumidor actual lo usa**. La fuente oficial continúa siendo JSON incluso si se completan estas variables.

En Vercel no hay variables nuevas obligatorias ni cambios remotos en PR09. Cuando se pruebe una integración posterior, cargar inicialmente solo en Preview, verificar proyecto/ref/clave, probar fallos y después autorizar Production. Nunca nombrar secretos `NEXT_PUBLIC_*`; para este módulo tampoco hace falta exponer la clave publicable al navegador. Mantener intactas las variables de analíticas y su consentimiento. No agregar dominios Supabase a `next/image` ni CSP hasta que existan y se usen realmente.

## Capacidad y costos

Fuentes oficiales consultadas el **24/10/2026**: [precios](https://supabase.com/pricing), [límites de archivo](https://supabase.com/docs/guides/storage/uploads/file-limits), [control de acceso](https://supabase.com/docs/guides/storage/security/access-control). Son referencias públicas, no una cotización personalizada ni una elección de plan.

- Free: USD 0/mes, 1 GB de Storage, 500 MB de base, 5 GB de egreso y otros 5 GB de egreso cacheado; máximo 2 proyectos activos y pausa por inactividad. El máximo por archivo es 50 MB. Confirmar cupo en la organización, no inferirlo del listado.
- El inventario local ocupa **0,8696 GB** sin deduplicar (0,8631 GB únicos). Una sola copia de todo dejaría aproximadamente 0,1304 GB nominales de margen en 1 GB; originales privados + copias publicadas podrían acercarse a **1,74 GB**, antes de variantes y evidencias. Free no garantiza espacio suficiente para ese modelo de doble copia y no admite `formosa.pdf` completo.
- Estimación de base inicial para unas centenas de entidades y 84 fichas: presupuesto inicial de 10–50 MB para datos, índices, fuentes e historial moderado, **hipótesis de planificación**, sin medición de importación real. Los archivos binarios deben estar en Storage, no en columnas `bytea`/base64. Las revisiones y los payloads pueden crecer: medir con `pg_total_relation_size` después del piloto.
- Pro anunciado desde **USD 25/mes**, 100 GB de Storage, 8 GB de base por proyecto y 250 GB de egreso más 250 GB cacheados; proyectos adicionales desde USD 10/mes. Exceso de Storage anunciado USD 0,0213/GB-mes; egreso no cacheado USD 0,09/GB y cacheado USD 0,03/GB. Confirmar cómo se aplican al conjunto de proyectos y a la organización elegida, impuestos y cómputo antes de contratar.
- El peso total no determina el tráfico: egreso ≈ suma de bytes entregados por recurso y descargas, separado por caché. Por ejemplo, 100 descargas completas de un PDF de 57 MB rondan 5,7 GB. No se ha medido CDN, optimización de Next ni audiencia para pronosticar una factura.

No se contrataron servicios ni se habilitaron costos. La recomendación inicial es mantener los originales locales, resolver el PDF grande y medir un lote pequeño; revisar plan únicamente con la decisión del titular.

Changelog consultado: [TLS obsoleto](https://supabase.com/changelog/cbc-tls-ciphers-deprecated) (no desactivar validación TLS; Node 22 y HTTPS actuales) y [minor de PostgreSQL 17.11](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes). El modelo no usa ltree, pgcrypto, btree_gist ni operadores personalizados afectados. La prueba WASM no certifica la versión ni configuración del futuro servidor hospedado.

## Secuencia de migración de archivos

1. Revisar inventario, derechos, MIME real y archivos candidatos sin referencia. Nunca eliminar por una búsqueda estática vacía. Revisar SVG y comprobar tamaño/límite antes de subir.
2. Congelar el manifiesto del lote con ruta original, SHA-256, bytes y bucket/clave propuestos. Duplicados de mismo hash pueden compartir objeto solo dentro del mismo ámbito de acceso; conservar todas las rutas históricas en `media_paths`.
3. Copiar un lote autorizado a staging privado mediante Storage API; verificar bytes y hash de la descarga. Guardar resultados y reintentar por clave/hash sin sobrescribir contenido diferente.
4. Tras revisión de derechos y aprobación, copiar solo la versión publicable al bucket público; no copiar evidencias ni notas. No se implementa esta operación en PR09.
5. Validar un mecanismo de entrega compatible con las URLs viejas, PDF Unicode, `next/image`, cachés, mapas y SEO. Comparar el HTML/106 rutas y pruebas móviles antes de cambiar consumidores.
6. Conservar originales, snapshots y manifiestos hasta completar el período acordado de observación y reversión. No cambiar el maestro ni borrar duplicados como parte de una subida.

## Reversión

- **PR09:** revertir el commit de infraestructura si fuese necesario. El lector estático nunca se cambió y no hay migración remota aplicada que deshacer. Si las tablas se hubieran creado después, dejar la base intacta e inaccesible; no incluir un `DROP SCHEMA CASCADE` automático.
- **Importación futura:** staging transaccional por lote; ante fallo, rollback. Para un lote ya confirmado, registrar un lote de reversión y restaurar versiones previas desde snapshots/revisions en orden de dependencias, manteniendo trazabilidad. Toda restauración queda pendiente/no publicable, sin resucitar aprobaciones obsoletas. Nunca borrar en masa otras entidades/lotes.
- **Archivos futuros:** conservar manifiesto de objetos creados por lote y hashes. Volver a los originales locales y rutas anteriores; un lote de limpieza separado, revisado, podrá retirar exclusivamente sus copias. Verificar que no tengan referencias compartidas. No asumir liberación inmediata de caché/almacenamiento ni confidencialidad retroactiva de una URL pública.
- **Aplicación futura:** lectura JSON sigue siendo el fallback; activar/desactivar un consumidor requerirá pruebas de errores, timeout, caché y restauración. No publicar un panel a medio implementar.

## Resultados y límites de PR09

Pruebas automatizadas: `npm run check` incluye lint, rutas/types de Next, integridad, comparación de tipos SQL generados, todas las pruebas Node, build, auditoría de 106 URLs y suite Playwright de escritorio/móvil y consentimiento.

Pruebas SQL locales ejecutadas con **PGlite 0.5.11 (PostgreSQL WASM)**: migraciones completas, FKs, constraints, roles anon/authenticated, RLS, revisión por versión/campo, invalidación, idempotencia y auditoría; Storage usa **tablas simuladas** con políticas PostgreSQL reales. No equivalen a Supabase Auth, PostgREST, CDN, Storage HTTP, pgTAP ni Advisors reales. El SDK opcional también se prueba sin entorno, con claves inválidas, sin red al inicializar y con fallback.

La auditoría npm informó **12 avisos preexistentes** (1 bajo, 2 moderados, 9 altos). Se reprodujeron las mismas cantidades y nombres de paquetes contra `package-lock.json` de `origin/main`; no aparecen avisos nuevos por los paquetes añadidos. Incluyen `sharp`, `xlsx` y dependencias de desarrollo. No se ejecutó `npm audit fix --force`: actualizar herramientas, conversión de Excel y procesamiento de imágenes merece un PR específico con sus regresiones.

Resultado final local: **59/59 pruebas Node**, lint, TypeScript, validaciones, build y auditoría de **106 URLs sin errores**. Playwright: **103 aprobadas, 9 omitidas según condiciones de la suite existente, 0 fallidas**. Las advertencias NO_COLOR/FORCE_COLOR son de las herramientas, no errores del sitio.
