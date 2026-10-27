# PR24 — Infraestructura Supabase e importación integral

Base: `4400ef77e1a03a131ff235be318e26396a19efc0`, merge de PR23. Rama: `codex/pr24-supabase-operativo`.

**Estado: operativo y verificado localmente; remoto pendiente de autorización.** No se creó ni vinculó un proyecto remoto. No se importó investigación real a una base, no se publicaron nuevas fichas y no se modificó la fuente actual de la web. No se incorpora panel editorial.

## Arquitectura y reutilización

| Capa | Implementación | Acceso y efecto |
| --- | --- | --- |
| Lectura de origen | Maestro vivo, snapshot privado PR17, catálogos actuales | Solo lectura; conserva IDs, celdas y versiones |
| Plan integral | `scripts/editorial/integral-import.mjs` | Extiende `planWorkImport`, `rowKey`, `fingerprint`, `stableId` y `private-io`; no sustituye PR17 |
| Transporte | `scripts/supabase/import-transport.mjs` y CLI | Operador Node, identidad dedicada verificada; ensayo por defecto |
| Staging | `editorial.import_batches`, `import_rows`, `import_relations`, `revisions` | Investigación privada; JSON original completo, referencias explícitas y auditoría |
| Modelo definitivo | Tablas tipadas de PR9 | No se rellenan automáticamente: faltan decisiones de normalización/editoriales |
| Aprobación | Contratos humanos/versionados PR9 y publicación PR19 | Importar nunca crea una aprobación ni una URL |
| Lectura futura | `lib/supabase/published.ts` | Servidor/build, clave publicable, RLS, paginación y segunda validación de versión; devuelve candidatos |
| Web actual | `lib/data.ts`, contratos y assets aprobados | Continúa desde archivos existentes; ninguna ruta llama al lector futuro |

La migración `20261027012038_integral_private_ingestion.sql` amplía las tablas privadas existentes. Añade versión, revisión de origen, tipo de identidad, metadatos de celdas y un grafo de referencias con claves foráneas. Los payloads desconocidos permanecen completos en `original_payload`; no se fuerzan a un esquema inventado.

Dos RPC en `public` permiten al operador utilizar PostgREST **sin exponer el esquema `editorial`**. Ambas son `SECURITY INVOKER`, sin ejecución para `PUBLIC`, `anon` o `authenticated`; solo `service_role`. El esquema público no implica permiso público. `aus_import_state` entrega hashes/versiones; `aus_stage_import` valida manifiesto, payloads, hashes y referencias antes de una transacción por origen. La migración no modifica aprobaciones, contenido publicado ni reglas de publicación.

Storage mantiene los tres buckets de PR9 y su política restrictiva. Solo amplía los MIME de `editorial-private` para JSON/CSV. Investigación/evidencias nunca se cargan en `tourism-published`. Un bucket público no debe recibir originales sin revisión de derechos.

## Integridad, versiones y recuperación

- Identidad `(origin, sheet, original_id)`, con namespace separado para maestro y repositorio. Propuestas: clave compuesta de lote/tabla/registro/versión. Filas documentales sin ID conservan su localizador de fila; reordenarlas requiere conciliación humana.
- SHA-256 del JSON canónico de payload + metadatos. Versionado local de contenido y auditoría anterior/posterior, sin perder la revisión original del maestro.
- `expected_hash` impide sobrescribir cambios concurrentes. Bloqueo transaccional por origen y checksum de lote permiten reintentar el mismo envío sin duplicar filas ni auditoría.
- Toda referencia indexada proviene de un campo ID explícito y de su posición; se conserva el grafo fuente, no se aprueban relaciones turísticas. Texto libre y agrupaciones no se convierten en entidades por inferencia.
- Un fallo SQL revierte lote, filas, referencias y auditoría juntos. Un timeout se registra como resultado **desconocido**, no como rollback confirmado. Journal privado persistido antes del primer envío; reanudación del mismo lote. Se rechaza sobrescribir un journal previo.
- Las filas ausentes de un nuevo snapshot se retienen; no hay borrado automático. Un cambio confirmado se compensa mediante otra versión revisada, sin borrar historial ni recrear aprobaciones.
- Maestro y repositorio son dos unidades atómicas independientes. No se promete una transacción distribuida: el journal permite continuar la segunda sin repetir la primera.

## Cloudflare Pages y límites de esta entrega

El lector futuro utiliza el cliente opcional anónimo y sin sesión de PR9. No acepta credenciales privilegiadas como alternativa. Se ejecutaría en el build, nunca en el navegador. Una respuesta sin configuración es `null`; una base configurada sin publicaciones devuelve `[]`; un error aborta la lectura. No se cambia silenciosamente la fuente de las rutas.

Antes de consumir esos candidatos deben aplicarse nuevamente los contratos PR19 de campos, hash aprobado, assets/licencias y URL. El lector **no publica por sí solo**, no genera rutas y no convierte el JSON privado en DTO público. El build actual no requiere conexión ni credenciales Supabase.

No se ejecutan despliegues. Vercel deshabilitado únicamente para esta rama; commits con prefijo `[CF-Pages-Skip]` omiten el despliegue Pages sin omitir los controles de GitHub. No hay cambios de DNS, dominios o planes.

- [Conciliación e inventario](RECONCILIATION.md)
- [Estado remoto y pasos de activación](REMOTE.md)
- [Plan operativo PR25](IMPORT-PR25.md)
- [Validación y seguridad](VALIDATION.md)
