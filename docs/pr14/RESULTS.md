# Resultados PR14

Base `main` con PR13 fusionado: `aeac1d1`. Las comprobaciones locales se ejecutaron sobre los ocho textos nuevos y los 16 borradores conservados. La fecha de consulta editorial es 25/10/2026; las fechas de build no actualizan automáticamente la verificación del contenido.

| Comprobación local | Resultado |
|---|---|
|Lint | Correcto, sin advertencias ESLint |
|TypeScript | `next typegen` y `tsc --noEmit` correctos |
|Validaciones de datos/medios y contratos | Correctas; tipos y pruebas de DB son locales, sin acceso a Supabase remoto |
|`editorial:check`, `editorial:check-pr13`, `editorial:check-pr14` |24 borradores,0 publicables; identidades, permisos y relaciones conservados |
|Cadena de revisión | Hashes antes/después de8 textos;16 textos y documentos históricos PR13 sin cambios; revisión y autorización humanas no generadas |
|`editorial:report-pr14` |8 documentos íntegros, informe, fuentes y ledger por párrafo/ubicación; salidas fuera del sitio público |
|`editorial:plan` | Simulación con0 escrituras,0 retiradas y0 redirecciones activas; bloqueos por aprobación, equivalencia y respaldo |
|Unitarias |103/103 aprobadas; incluyen mutación de permiso, invalidación por edición, filtraciones HTML/RSC/JS/JSON y rechazo de salidas públicas de revisión |
|Build Next.js | Correcto |
|Auditoría editorial Next |24 retenidos, sin coincidencias prohibidas |
|SEO Next |106 URLs canónicas, sin errores |
|E2E Next.js |109 aprobadas,9 omisiones previstas por viewport; escritorio/móvil, mapas, filtros, consentimiento y rutas retenidas |
|Build Pages | `production-audit`, `consent-test` y Preview correctos |
|Auditoría estática |106 URLs por modalidad;126 recursos en producción/consentimiento y103en Preview; cero errores |
|Seguridad editorial Pages |24 retenidos en los3 artefactos, cero filtraciones detectadas en HTML/RSC/JS/JSON/índices/sitemap y auxiliares públicos |
|Pruebas Pages/Chrome/Wrangler local |70 aprobadas,2 casos exclusivos de Workers omitidos; no hay implementación de Workers |
|Lectura remota |24/24 PDF de producción: HEAD200, MIME/tamaño esperado;24/24rutas de borrador: HEAD404 en Preview existente. Detalle en `pdf-link-check.json` |
|Originales |24 PDF y enlaces preservados; cero nuevas fotografías descargadas o incorporadas |

Los informes reproducibles resumidos están en `evidence/`. No contienen registros privados, cuerpos del maestro, extracciones PDF ni trazas con datos de investigación. Las pruebas comprueban contratos e integridad; no certifican por sí solas exactitud turística, operación presencial, derechos ni aprobación humana.

## Tamaño e impacto

Preview estático local: **101.810.096 bytes** (101,81 MB decimales;2038 archivos), sin archivos sobredimensionados. Medios optimizados preexistentes:80.004.852 bytes; fallback:222.371 bytes. No se añadieron imágenes o transformaciones de red al visitante. La pequeña variación de bytes de build no se presenta como ahorro editorial.

El artefacto diagnóstico `production-audit` incluye los 24 PDF y no es candidato de carga a Pages por los archivos que superan el límite individual. El Preview no los incluye localmente y conserva sus enlaces a Vercel. Los24originales suman 633.579.423 bytes; **ahorro actual de retirada:0 bytes**. La independencia completa de Vercel continúa pendiente de reemplazos aprobados y respaldados.

## Límites e incidencias

- Un primer pase del validador detectó que, al sustituir la sección de alcance de Entre Ríos, faltaba la categoría práctica. Se corrigió la clasificación de su sección de organización; no se relajó el contrato.
- Los avisos `NO_COLOR`/`FORCE_COLOR` del entorno de Playwright no son fallos de lint, tipos o pruebas. No hubo errores preexistentes que impidieran la batería final.
- Los informes heredados de Pages conservan bloqueos generales de derechos, privacidad y reglas de cuenta/dominio del PR11. Son pendientes del traslado definitivo, no verificaciones remotas nuevas de este PR.
- La lectura de PDF/Preview mediante `editorial:links -- --pr14` es una comprobación remota sobre los hosts existentes. No acredita una auditoría remota completa de la nueva rama; los checks del PR y el Preview automático de la integración existente se verifican por separado antes de entregar.
- Las seis licencias fotográficas están declaradas por sus autores en las fichas consultadas. No se registra decisión humana de derechos ni se agregan a `photos[]`. Los40briefs de PR13 siguen sin imágenes identificadas/licenciadas en ese inventario.
- Jujuy y San Luis incorporan respaldo de sus carencias centrales con límites operativos explícitos. Entre Ríos mantiene destinos termales y comunitarios pendientes; Río Gallegos mantiene Planetario y otros recorridos pendientes de fuentes primarias suficientes. No se declara ninguna equivalencia PDF completa.

No se cambiaron código de páginas/componentes, catálogos públicos, GA4, consentimiento, privacidad, DNS o producción. La configuración de Vercel solo excluye esta rama de sus Previews automáticos. No hubo migraciones, recursos remotos nuevos o servicios pagos; `publicidad/` queda fuera de Git.
