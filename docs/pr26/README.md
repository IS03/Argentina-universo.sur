# PR26 — Investigación completa en staging institucional

Depende de PR25. Proyecto único: `vpbonlzixodxvbybkffv`, organización `mzfanqzfjskgapsulpip`. Los datos ya se importaron y verificaron remotamente bajo la autorización del titular. Este PR contiene herramientas y resultados agregados; no publica el snapshot ni datos de investigación.

## Conciliación nueva

Se releyeron las 18 pestañas y sus CellData, verificando la revisión antes y después: `2026-10-24T00:58:54.849Z`. Comparación con PR24: **2.015 valores de filas idénticos, cero altas/cambios/ausencias**. Se preservaron adicionalmente **765 notas, 1.242 fórmulas y 2.778 celdas de fecha tipadas**. Los valores, fórmulas/notas y formatos relevantes siguen privados; no se interpreta una fórmula o una celda «aprobada» como permiso editorial.

La selección mantiene 84 fichas (23 destinos + 61 atractivos). Las 119 propuestas siguen siendo versiones, no altas adicionales. Se incluyen los 227 registros del repositorio, con 24 escapadas retenidas. Se reutilizan namespace, IDs, validadores, hashes y journals de PR17/24. No se fusiona por semejanza de nombres.

## Ejecución y recibos reales

| Unidad | Altas | Cambios | Recibo remoto |
| --- | ---: | ---: | --- |
| Maestro | 2.015 | 0 | `f71ed78a-3050-41e0-b7d9-59d9e09b0c02` |
| Repositorio | 227 | 0 | `e037c917-bf69-4b5f-940d-3c3cefd5ffa7` |
| Total | **2.242** | **0** | Dos lotes confirmados |

Primero se ejecutaron 91 validaciones remotas por partes, con la identidad completa para referencias cruzadas. El recuento posterior confirmó cero filas, lotes, paquetes o publicaciones escritas. El primer intento de una solicitud completa fue rechazado por HTTP 413 antes de llegar a PostgreSQL; no se redujo ni truncó el contenido para resolverlo.

Después se inició el transporte privado autorizado. Una interrupción real del proceso tras cinco paquetes dejó **cero filas aplicadas**. La reanudación del mismo journal/checksum reutilizó los paquetes, confirmó su integridad y completó el lote. La finalización recompone la solicitud completa, valida el SHA-256 y ejecuta nuevamente `aus_stage_import` de PR24 en una transacción.

La reejecución real de ambas finalizaciones devolvió los mismos recibos, **0 altas, 0 cambios y 2.242 idénticos**. La auditoría permaneció en 6.917 revisiones: no se duplicó por reintentar. Resultado: 4.671 referencias, cero claves duplicadas, todas las filas en versión 1, cero objetos Storage y cero `public.entries`. Se verificaron también notas/fórmulas contra las cantidades capturadas.

Conciliación de hashes ordenados `(sheet, original_id, source_hash)`, calculada independientemente desde el plan y desde PostgreSQL:

| Unidad | SHA-256 coincidente |
| --- | --- |
| Maestro | `153406e0769aefadac0cc23716bf70336ecfc42c14596e8a4427e0fa92282aad` |
| Repositorio | `a78936095cffc536a0ef848804b8227e54a4c4609a60171ae3fe26f195148d81` |

La base completa ocupaba 27.924.147 bytes después de staging y paquetes. No se activaron planes pagos ni se aumentaron límites. Los paquetes de transporte se conservan privados e inmutables para auditoría/reanudación; no son nuevas entidades y no se borraron originales.

## Herramientas

`capture-master.mjs` convierte las lecturas privadas del conector, conserva metadata y compara contra el snapshot anterior. `integral-import.mjs` amplía metadata sin sustituir los contratos existentes. `connector-import.mjs` adapta el transporte al conector autenticado sin extraer una clave administrativa. La CLI estándar con credenciales de operador seguras permanece disponible.

El adaptador produce solicitudes SQL en archivos 600 dentro de `.artifacts/institucional/private/connector/`. Un operador/conector de confianza verifica la API de identidad antes de cada solicitud, ejecuta solo los RPC permitidos y devuelve su resultado por escritura atómica. Los errores o respuestas perdidas conservan el journal y obligan a reanudar el mismo lote. No montar esa carpeta como servidor público ni subirla como artefacto CI.

```sh
node --experimental-strip-types scripts/supabase/capture-master.mjs \
  .artifacts/institucional/private/master-read.json \
  .artifacts/pr24/private/snapshot.json \
  .artifacts/institucional/private/snapshot.json
# Plan con el importador existente: --integral --with-repository.
# Dry-run nuevo con journal nuevo; luego --commit solo para staging autorizado.
# Recuperar usando --resume=<journal> --journal=<mismo-journal> --commit.
```

Una referencia no resuelta bloquea la parte/lote. Un resultado desconocido nunca se interpreta como rollback confirmado. Los registros ausentes se retienen. Un error editorial posterior requiere otra versión revisada, sin borrar historial ni restaurar aprobaciones por inferencia.

## Pendiente de normalización y multimedia

La investigación completa está en `editorial.import_rows` y su grafo en `import_relations`; las tablas definitivas no se rellenaron con supuestos. Quedan como decisiones editoriales: correspondencias entre las 23 guías legadas y 24 borradores, entidades entre namespaces, campos documentales sin ID nativo, coordenadas/fechas faltantes, licencias y contenido aún no aprobado. Esto no bloquea conservar íntegramente la fuente.

Se importaron **referencias, rutas, derechos declarados y relaciones multimedia**, no los 371 archivos (~831 MiB) inventariados en PR24. `formosa.pdf` sigue superando el máximo por objeto. Las fotografías, PDFs, rutas e indexación existentes siguen en su alojamiento anterior. Cualquier traslado requiere revisión de derechos, capacidad, egreso y aprobación de presupuesto.

No se creó ninguna revisión humana ni se convirtió investigación en publicación. Las pruebas remotas posteriores de anon/authenticated continuaron denegando las once tablas privadas, incluso con claims de publisher. Las dos fichas previamente autorizadas se conectan en PR27 desde sus proyecciones públicas exactas, no desde el staging.
