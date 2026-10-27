# PR25 — Plan de importación integral

## Condiciones de entrada

Proyecto dedicado autorizado, esquema y seguridad remota verificados, presupuesto/cupo aceptados y aprobación explícita para trasladar investigación privada. La investigación sigue siendo privada incluso cuando el snapshot contiene propuestas o campos que dicen «aprobado».

Conservar el flujo PR17 de lectura viva y metadata tipada: verificar las 18 pestañas, revisión antes/después, selección explícita de 84 fichas, versiones de propuestas y fechas sin adivinar. El snapshot debe tener permisos 600 dentro de `.artifacts/`; los directorios privados, 700. Los reportes públicos solo contienen agregados. El snapshot de PR24 es una foto auditada, no una promesa de que el maestro no cambiará.

## Procedimiento de operador

Los ejemplos siguientes son para el **entorno local aislado**, no autorizan un remoto. En remoto hay que verificar además identidad/organización/costo y configurar secretos fuera de Git.

```sh
# Lectura privada de hashes/versiones existentes, sin payload público.
node scripts/supabase/import-state.mjs \
  --target=.artifacts/pr24/private/local-target.json \
  --output=.artifacts/pr24/private/state-r1.json

# Plan completo: el modo PR17 sin --integral sigue disponible sin cambios.
node --experimental-strip-types scripts/editorial-import.mjs \
  .artifacts/pr24/private/snapshot.json --integral --with-repository \
  --state=.artifacts/pr24/private/state-r1.json \
  --output=.artifacts/pr24/private/plan-r1.json

# Validación real del SQL. NO agrega filas ni lotes.
node scripts/supabase/stage-import.mjs \
  --target=.artifacts/pr24/private/local-target.json \
  --plan=.artifacts/pr24/private/plan-r1.json \
  --journal=.artifacts/pr24/private/dry-r1.json

# Solo después de revisar y autorizar el traslado privado:
node scripts/supabase/stage-import.mjs \
  --target=.artifacts/pr24/private/local-target.json \
  --plan=.artifacts/pr24/private/plan-r1.json \
  --journal=.artifacts/pr24/private/commit-r1.json --commit
```

Cada ejecución nueva usa un journal nuevo. La CLI rechaza sobrescribir uno existente. No usar snapshots/journals dentro de `public`, `docs` o como artefactos CI. No subirlos a GitHub.

## Alcance y conciliación

1. Reconciliar nuevamente las 2.015 filas observadas del maestro; esas cantidades son referencia de PR24, no constantes que permitan ignorar nuevas filas. Las 84 fichas y la identidad/versiones deben validarse explícitamente si cambia el universo aprobado de selección.
2. Incluir los 227 registros fuente del repositorio con la revisión Git correspondiente. Conservar namespaces y localizadores; no fusionar entidades por nombre. No reimportar las dos proyecciones públicas aprobadas como nuevas entidades.
3. Conservar `original_payload`, metadata de fechas, revisión, checksum, versiones locales y grafo de referencias. Los campos nuevos/desconocidos quedan preservados en JSON. La normalización a las tablas definitivas exige un mapa revisado; staging no lo finge completo.
4. Reportar insert/update/unchanged, ausentes retenidos y referencias no resueltas. Una referencia no resuelta bloquea el lote; no se inventa ni se omite silenciosamente una clave conocida. Las agrupaciones sin tabla destino siguen como campos originales.
5. Aplicar maestro y repositorio como unidades privadas separadas; verificar recibos, hashes y cantidades antes de continuar. Límite actual de envelope: 16 MiB y 10.000 filas por unidad. Si se supera, detener y diseñar particiones con cierre de referencias; no truncar ni dividir de forma arbitraria.
6. No transferir automáticamente los 371 archivos: revisar licencias, originales/derivados, duplicados, referencias, MIME y límites. Resolver `formosa.pdf` antes de una carga. Los links/filas Multimedia no equivalen a archivos descargados ni derechos concedidos.
7. Mantener pendientes los mapas entre 23 guías legadas/24 borradores, jurisdicciones entre namespaces, material sin ID estable, fechas/licencias/coordenadas no verificadas y cualquier cambio de URL.

## Fallos y recuperación

- **Rechazo SQL:** la transacción entera revierte. Revisar código en journal privado y causa con acceso autorizado; corregir el origen, leer estado nuevo y producir plan/journal nuevos.
- **Conflicto `40001`:** alguien modificó el estado esperado o un lote antiguo ya no coincide con el actual. No forzar; conciliar versiones y replanificar.
- **Timeout/conexión perdida:** el commit pudo ocurrir. No regenerar el lote ni borrar el journal. Reanudar exactamente:

```sh
node scripts/supabase/stage-import.mjs \
  --target=.artifacts/pr24/private/local-target.json \
  --resume=.artifacts/pr24/private/commit-r1.json \
  --journal=.artifacts/pr24/private/commit-r1.json --commit
```

Las unidades confirmadas se omiten. Las inciertas se envían con el mismo checksum; el servidor responde con el recibo existente si ya quedaron confirmadas. Si la primera unidad se confirmó y falló la segunda, no se afirma que ambas revirtieron.

- **Error editorial descubierto después de commit:** preparar una compensación revisada desde `revisions.before_row`/snapshot conservado, con hashes actuales y una nueva revisión. No borrar historial, fabricar aprobaciones ni modificar contenido público automáticamente. No hay botón de rollback destructivo.

## Salida esperada de PR25

Acta privada de cantidades/recibos y hashes, informe público agregado sin IDs/textos de investigación, lista explícita de campos aún no normalizados, pendientes multimedia y comprobación de cero escrituras públicas. Publicación y panel editorial requieren trabajo/autorizaciones posteriores. Los contratos PR19 siguen siendo la única vía actual para alterar destinos publicados.
