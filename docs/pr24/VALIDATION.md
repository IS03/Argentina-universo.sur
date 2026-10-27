# Validación y seguridad

Verificaciones del 26/27 de octubre de 2026 sobre la base posterior a PR23. No hay verificación remota: el proyecto dedicado aún no está autorizado/creado. Las pruebas reales siguientes usan exclusivamente el stack **local aislado** `argentina-universo-sur-pr24`, API `127.0.0.1:59421`, PostgreSQL `127.0.0.1:59422`.

## Resultados

| Control | Resultado |
| --- | --- |
| Lint, TypeScript, validadores editoriales y datos | Sin errores |
| Tipos de DB contra las migraciones | Coinciden (`npm run db:check`) |
| Pruebas unitarias | 175 aprobadas |
| Migraciones desde cero, PostgreSQL real | Las tres aplicadas correctamente en stack aislado |
| pgTAP real | 27 comprobaciones aprobadas, dos archivos |
| Auth/PostgREST/Storage reales | 7 grupos aprobados; 257 filas sintéticas de staging |
| Asesores Supabase locales | Sin hallazgos de seguridad/rendimiento |
| Maestro + repositorio, planificación offline | 2.242 altas iniciales; repetición 2.242 idénticos; un cambio → una actualización |
| Maestro + repositorio, RPC real en dry-run | 2.015 + 227 filas validadas, cero escrituras; manifiestos posteriores confirman cero filas reales importadas |
| Build Next | Correcto |
| SEO Next | 108 páginas, cero errores |
| Build y auditoría Pages Preview local | 108 páginas canónicas, cero errores; seis campañas y once recursos presentes |
| Aislamiento con snapshot privado | Sin fugas detectadas en JS, HTML/RSC Next ni Pages |
| E2E Chrome escritorio/Pixel 7 + WebKit iPhone | 164 aprobadas, 9 omisiones previstas por dispositivo; cero fallos |

Los logs completos, journals, credenciales locales y datos fila a fila permanecen ignorados en `.artifacts/pr24/private/`. No se adjuntan a GitHub. Las cantidades y resultados agregados de este documento permiten revisar la entrega sin exponer la investigación.

El primer E2E detectó cuatro expectativas históricas de logo fijo en el footer, retirado por PR23, y una carrera de `currentSrc` vacío al cambiar movimiento reducido. Se actualizaron únicamente las pruebas: footer actual y espera de selección de imagen. No se restauró un logo ni se cambió la interfaz para satisfacer tests antiguos.

## Qué se verificó

- RLS en todas las tablas de aplicación; sin grants de escritura para navegador ni acceso al esquema `editorial` o RPC privadas. Un usuario Auth real con JWT local temporal de rol authenticated, incluso con metadata que dice publisher, no obtiene permisos editoriales. El login por email y los registros públicos permanecen deshabilitados.
- Versión aprobada exacta legible por anon/authenticated mediante RLS; editarla invalida publicación y aumenta versión. No se puede publicar un borrador sin la revisión humana exacta de PR9.
- RPC de staging: hashes/manifiesto/celdas conservados, referencias explícitas válidas, cambios e idénticos, incremento de versión, repetición sin duplicar auditoría, conflicto de versión, rollback durante el último insert y respuesta perdida seguida de reanudación exacta.
- Los fixtures de ingesta no tocan `public.entries`. Los ensayos de publicación usan fixtures sintéticos dentro de transacciones SQL revertidas; el fixture HTTP de borrador se elimina al finalizar.
- Storage real: visibilidad de los tres buckets, MIME JSON privado, upload/download autorizado con SHA-256 idéntico; lectura, carga y sustitución bloqueadas para anon/authenticated. Un intento de delete sin filas visibles no destruye el objeto; se confirma que los bytes permanecen. URL pública del bucket privado rechazada.
- No `SECURITY DEFINER` de aplicación. Funciones con search_path explícito, permisos mínimos por rol y esquema privado fuera de PostgREST.
- Aislamiento de secretos y editoriales: ningún snapshot, evidencia, journal o clave se incorpora a Git; escaneo de IDs/textos privados contra los artefactos. Las dos fichas aprobadas y las 24 escapadas retenidas conservan sus contratos.

El harness PGlite usa sustitutos mínimos de Auth/Storage y complementa, **no sustituye**, la prueba de Supabase/Docker real. Los asesores locales tampoco certifican ajustes de un futuro proyecto alojado.

## Reproducir en un entorno local independiente

Requisitos: Node 22.19+, dependencias npm, Docker disponible y los puertos 59420–59422 libres. CLI utilizada: `supabase@2.122.0`, sin vinculación remota. No detener/resetear proyectos de otras aplicaciones. `prepare-local` solo copia configuración/migraciones/tests a `.artifacts/pr24/local` y genera target de fixtures locales; rechaza una referencia de proyecto vinculada.

```sh
node scripts/supabase/prepare-local.mjs
umask 077
npx --yes supabase@2.122.0 start --workdir .artifacts/pr24/local \
  --exclude imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor \
  > .artifacts/pr24/private/local-start.log 2>&1
npx --yes supabase@2.122.0 status --workdir .artifacts/pr24/local --output json \
  > .artifacts/pr24/private/local-credentials.json \
  2> .artifacts/pr24/private/local-status.log
npx --yes supabase@2.122.0 test db --local --workdir .artifacts/pr24/local
node --experimental-strip-types scripts/supabase/verify-local.mjs
npx --yes supabase@2.122.0 db advisors --local --type all --fail-on error \
  --workdir .artifacts/pr24/local
```

La salida de `start/status` puede contener claves: redirigirla únicamente a archivos privados y nunca publicarla. `verify-local` rechaza URLs distintas del loopback fijo. Crea solo fixtures sintéticos, elimina su usuario Auth, objeto Storage y borrador HTTP; conserva auditoría/staging sintéticos privados para revisión. pgTAP hace rollback. Repetir con stack vacío mediante `db reset --local --no-seed --workdir .artifacts/pr24/local` destruye **solo** esos fixtures; nunca usar `--linked` ni un DB URL remoto para resetear.

Para terminar, `supabase stop --workdir .artifacts/pr24/local` afecta únicamente este stack. No borrar volúmenes ni originales del proyecto como parte de esta entrega.

El futuro lector de build se verifica mediante contrato puro/TypeScript y las políticas reales de publicación; permanece sin consumidor. Conectar rutas, normalizar registros y probar configuración remota corresponde a fases posteriores explícitas.
