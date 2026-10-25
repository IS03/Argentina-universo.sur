# Resultados PR17

## Verificaciones locales

| Verificación | Resultado |
| --- | --- |
| Lint sin advertencias | OK |
| TypeScript y tipos de rutas Next | OK |
| `npm run validate` | OK: catálogo, recursos, contactos de Santa Fe, esquema/tipos PostgreSQL local, Pages y contratos PR12–14/Work |
| Pruebas unitarias | **138 aprobadas**, incluidas 17 nuevas de Work |
| Dry-run del maestro real | **84 reales, 0 sintéticas**, 0 errores estructurales, 0 escrituras públicas/remotas |
| Repetición del snapshot real | 84 entidades unchanged; soporte unchanged; sin filas ausentes inventadas ni borrados |
| Fixture de integración | **84 sintéticas, 0 reales**; clasificaciones 55/3/26; sin datos del maestro |
| Build de Next + auditoría editorial | OK; 24 escapadas retenidas fuera de HTML/RSC/JS públicos |
| SEO Next | **106 canónicas**, 0 errores |
| E2E Next | **125 aprobadas, 9 omisiones esperadas** según viewport/contexto |
| Builds estáticos | Preview, consent-test y production-audit: OK; 106 canónicas en cada modo |
| E2E Pages | **72 aprobadas, 2 omisiones esperadas** de pruebas exclusivas del prototipo Workers descartado |
| Wrangler local | 4.152.0; sin Functions; redirects, query y headers comprobados localmente |
| Presentación sintética | Chrome escritorio y Pixel 7 sin JavaScript; fuentes, mapa, hechos prácticos, WebP/créditos visibles; sin overflow ni errores de recursos |
| Auditoría adicional con IDs reales | Next y tres modos Pages: sin IDs privados ni claves editoriales en archivos públicos, también auxiliares/comprimidos |
| `editorial:plan` | Dry-run; 0 retiradas, 0 redirecciones, 0 escrituras |

Evidencias agregadas en [evidence/](evidence/). Logs completos locales en `.artifacts/pr17/reports/`; los snapshots y planes privados no se adjuntan. La captura del maestro se realizó con el conector autorizado en lectura; los builds y auditorías no consultan Drive. No se probaron migraciones/RLS en Supabase remoto porque no se accedió a ninguno.

Las 24 fichas de Escapadas conservan sus hashes, contenido, revisión y permisos de la base PR16. El Palmar mantiene su autorización histórica independiente y sigue en borrador sin revisión; este PR no la convierte en publicación. Los 24 PDF originales y todos los archivos públicos permanecen sin cambios en Git.

## Artefactos y alcance

El Preview local de Pages mide aproximadamente **105,38 MB** (105.381.954 bytes en la medición registrada), sin PDF empaquetados, con 80.004.852 bytes de imágenes optimizadas. El tamaño exacto puede variar con los IDs/chunks de build; no se agregan fichas ni imágenes del maestro. Los enlaces a PDF siguen apuntando al alojamiento vigente mediante el mecanismo existente: no se retiró ni redirigió ninguno.

La auditoría Next distingue chunks exclusivamente de servidor de HTML/RSC/JS servidos al visitante. Pages se revisa entero. No se publica el preview sintético: solo hay capturas en esta documentación. No se ha creado un entorno de revisión remoto con datos reales.

## Incidencias y límites

- No hubo fallos preexistentes bloqueantes en la batería principal. El aviso `NO_COLOR`/`FORCE_COLOR` de las herramientas no afecta al resultado.
- Se corrigieron falsos errores de fechas del transporte Sheets y relaciones a `Expansion_Santa_Fe` omitidas en la preparación anterior. Ver [AUDIT.md](AUDIT.md).
- La ausencia de errores estructurales no resuelve contradicciones, vigencias ni derechos. Permanecen los estados y pendientes documentales originales; no se volvieron a investigar las 234 fuentes externas.
- La lectura estable por `modifiedTime` no es una transacción de Sheets. Una aplicación futura necesita revisión congelada/confirmada y conciliaciones explícitas.
- El adaptador de revisión y su indicador fotográfico no son un mecanismo de aprobación. Este PR bloquea rutas públicas de Work incluso si alguien cambia una celda del maestro.
- Los avisos históricos `releaseBlocked` del tooling Pages no representan una nueva auditoría de la cuenta Cloudflare. No se cambió ninguna cuenta, dominio o servicio en este PR.

GitHub Actions y el Preview automático de la integración existente se informan en el PR con el commit comprobado. Las verificaciones remotas no deben inferirse de estos resultados locales. No se activa merge automático ni se realiza despliegue manual.

## Revisión siguiente

Conciliar los mapeos privados y preparar un pequeño lote de proyecciones por campos autorizables. Revisar hechos/medios y los componentes numéricos por separado. Registrar decisiones humanas y permiso por versión/canal antes de habilitar rutas. Supabase, monetización, rediseños adicionales y dominio conservan su planificación y autorizaciones independientes.
