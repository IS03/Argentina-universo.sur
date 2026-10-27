# PR25 — Activación del Supabase institucional

Base: main `e4fd7ec`, posterior al merge de PR24. Autorización: pedido del titular de activar el proyecto existente, ejecutar migraciones y staging privado. No se crea un segundo proyecto ni se renombra el existente.

## Identidad comprobada contra API antes de escribir

- Organización **Argentinauniversosur**, `mzfanqzfjskgapsulpip`, Free.
- Proyecto **vpbonlzixodxvbybkffv**, región `us-east-1`, `ACTIVE_HEALTHY`.
- URL `https://vpbonlzixodxvbybkffv.supabase.co`.
- Nombre visual original conservado; no se usa como identidad ni autorización.
- PostgreSQL remoto **17.11.0.003**, motor 17.

La inspección previa encontró cero tablas de aplicación, migraciones, buckets, objetos y usuarios Auth. No se consultaron ni modificaron recursos de la organización personal IS03.

## Ejecución real

Se ejecutaron las tres migraciones versionadas de PR9/24 y `20261027022748_institutional_access_guard.sql` en **una transacción remota** por la conexión SQL autenticada del conector. El bundle verifica que el destino esté vacío, conserva versiones/nombres/SQL exactos en `supabase_migrations.schema_migrations` y solo confirma al terminar el endurecimiento. No existe una ventana confirmada con buckets públicos. No se ejecutó reset, borrado de datos ni repair de un historial anterior.

Después se aplicaron `20261027023426_institutional_fk_indexes.sql` (tres índices para FK compuestas) y `20261027023823_private_chunked_transport.sql` (transporte privado por partes con hashes, sin ampliar permisos). No se duplicaron los ocho índices de `entry_id` ya únicos por PK solamente para ocultar avisos informativos.

Resultado real: **25 tablas**, todas con RLS; cero restricciones sin validar, índices inválidos o funciones de aplicación SECURITY DEFINER. `editorial` no otorga USAGE a anon/authenticated y PostgREST se limita explícitamente a `public`. Los tres buckets quedan **privados**, vacíos y con límites sin ampliar. El nombre histórico `tourism-published` no significa bucket público en esta etapa.

El transporte por partes respondió al límite 413 del conector. Primero valida payloads/referencias por partes sin escribir. Solo después recibe paquetes privados inmutables; la finalización recompone el lote, verifica SHA-256 y vuelve a utilizar la transacción de staging de PR24. Los paquetes y su metadata son privados; el operador no puede actualizarlos ni borrarlos.

## Seguridad verificada remotamente

`scripts/supabase/remote-security.sql` se ejecutó en el proyecto institucional: roles anon y authenticated con claims de un supuesto publisher no pueden leer las once tablas privadas, acceder a RPC de staging, publicar el borrador sintético ni insertar objetos Storage. El borrador permanece invisible. Todo el fixture se revierte; no se crean usuarios editoriales ni revisiones humanas.

La prueba de HTTP real usa únicamente una clave publicable: esquema editorial no expuesto, RPC denegada, investigación ausente del SELECT público, uploads privados y listado de buckets denegados. Las pruebas de roles SQL son remotas; no se presentan como una sesión Auth real ni como carga autorizada de archivos. El login/panel editorial no se habilita en esta entrega.

Asesores reales: sin ERROR/WARN. Persisten INFO de RLS sin policies en las once tablas privadas (deny-by-default intencional), índices todavía sin uso en una base nueva y FK `(entry_id,entry_kind)` cuyo primer campo ya es PK único. No se abren policies para silenciar el asesor. [RLS sin policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [FK e índices](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys).

## Conexiones y credenciales

La identidad de `lib/supabase/identity.ts` fija ref/organización/región. El importador verifica identidad real antes de operar; el lector público rechaza proyectos ajenos y configuración parcial, sin fallback hacia una cuenta personal. La lectura pública acepta solo clave publicable, nunca secret/service_role.

No había variables Supabase activas en el entorno local ni archivos `.env` con proyectos personales. El perfil OAuth del conector es un acceso de operación, no una dependencia de la web. La CLI local no tenía un acceso administrativo utilizable; se utilizó el conector autenticado sin extraer ni copiar secretos administrativos a archivos o logs. El entorno de prueba contiene solo identidad y clave publicable, dentro de `.artifacts/institucional/private/`, ignorado y con permisos 600.

El esquema privado existente ya incluye fichas, relaciones, versiones, miembros y decisiones humanas para un futuro panel. Nadie adquiere permisos de edición por autenticarse o escribir metadata de rol. No se implementa un panel ni altas públicas.

La investigación y la conexión de la web se entregan en los siguientes PRs separados. Producción no cambia: no hay merge, despliegue, variables de producción, DNS ni plan modificado. Las ramas de trabajo tienen despliegue Vercel deshabilitado y commits `[CF-Pages-Skip]`.

## Reversión

No ejecutar `db reset` remoto ni eliminar el proyecto. Si aparece un problema, detener la importación/consumo, mantener la fuente estática y preparar una migración compensatoria revisada. Conservar datos privados e historial. Las restricciones de acceso pueden reforzarse sin borrar investigación.

## Validación de código

Lint y typecheck correctos; 179 pruebas unitarias aprobadas. Las pruebas nuevas cubren identidad institucional, permisos del transporte, paquetes faltantes/corruptos, reintentos y finalización atómica. La prueba SQL remota se volvió a ejecutar sobre las once tablas privadas después de importar. El informe de ingesta real queda separado en PR26.
