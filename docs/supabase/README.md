# PR09 — Infraestructura de Argentina Universo Sur

> Actualización PR24: ver [infraestructura operativa local, conciliación integral y estado remoto](../pr24/README.md). Este documento conserva el contexto histórico de PR9.

Fecha de revisión: 24/10/2026. Base: `944e9cc` (PR #8), verificada contra `origin/main`.

El sitio sigue leyendo `lib/data.ts`, `lib/catalog.ts`, `public/data/` y `public/santa-fe/json/`. No se importa el SDK desde páginas, layouts, componentes ni lectores actuales. No se ha migrado, aprobado ni publicado ninguna ficha, archivo o anuncio. No se modifican GA4, consentimiento, privacidad, sitemap, fotografías ni textos turísticos.

## Entregables y navegación

- [Modelo, seguridad y límites](MODEL.md): entidades, relaciones, aprobación por versión, Storage y publicidad futura.
- [Contrato editorial e importación](IMPORT.md): maestro original, selección de 84, validación, diferencias, idempotencia y recuperación.
- [Configuración y reversión](OPERATIONS.md): acceso, proyecto independiente, variables, pruebas remotas pendientes, costos y rollback.
- [Inventario público reproducible](media-inventory.json): rutas, MIME, bytes, dimensiones, SHA-256, referencias, duplicados y destino propuesto.
- [Correspondencia de catálogos](legacy-catalog-map.json): 24 jurisdicciones, 72 actividades y 23 escapadas. Es un mapa de claves y rutas; no un nuevo maestro editorial.
- SQL versionado en `supabase/migrations/`; configuración **local** en `supabase/config.toml`.
- Cliente optativo `lib/supabase/server.ts`, protegido por `server-only`, y tipos generados desde las migraciones.

## Acceso verificado y bloqueos

El conector Supabase está autorizado para la organización `IS03` (plan Free). Su listado devolvió proyectos de otras aplicaciones y **ninguno exclusivo de Argentina Universo Sur**. No se abrió ninguna tabla, clave, bucket ni asesor de aquellos proyectos. No se creó ni vinculó un proyecto remoto.

Crear `argentina-universo-sur` queda pendiente de confirmar la organización de destino, cupo Free real, región y cotización/autorización de cualquier costo. El flujo de cotización del conector exige confirmar la organización. No se asumió que la cuenta Free permite crear otro proyecto ni se cambiaron planes. No se solicita ninguna clave privada en el chat.

Docker está instalado, pero su daemon no está activo. `supabase status` confirma que no hay un entorno local disponible. Por ello **no se ejecutaron Supabase Advisors, PostgREST, Auth ni Storage reales**. No se afirma que se hayan probado esas integraciones. Los pasos para validarlas están en OPERATIONS.md.

Sí se encontró el maestro original mediante Google Drive y se comprobaron sus 18 pestañas, encabezados relevantes y algunas columnas de IDs, únicamente en lectura. No se creó copia ni se exportó su contenido al repositorio. Las filas actuales incluyen propuestas repetidas por lote y entidades adicionales a la selección de 84; esta selección exige un listado explícito, sin ampliar automáticamente el alcance. Ver IMPORT.md.

## Inventario y capacidad

Tamaños exactos; MB = 1.000.000 bytes, no MiB.

| Categoría | Archivos | Bytes | MB |
| --- | ---: | ---: | ---: |
| Fotografías/ilustraciones `public/img/` | 306 | 234.682.284 | 234,682 |
| PDF `public/pdf/` | 24 | 633.579.423 | 633,579 |
| Documentos de Santa Fe (sin JSON) | 6 | 46.781 | 0,047 |
| Excel originales versionados | 3 | 47.764 | 0,048 |
| Otros, incluidos SVG e iconos de Next | 8 | 188.439 | 0,188 |
| **Subtotal versionado inventariado** | **347** | **868.544.691** | **868,545** |
| Banners locales `publicidad/` (solo resumen) | 6 | 1.023.560 | 1,024 |
| **Total local** | **353** | **869.568.251** | **869,568** |

El total de bytes únicos por SHA-256, incluyendo banners, es 863.109.602 (6 grupos de duplicados; ahorro teórico de 6.458.649 bytes). No se deduplicó ni eliminó ningún archivo. Hay 25 archivos versionados potencialmente sin referencia estática y 6 banners fuera del sitio; esto **no demuestra desuso**. Iconos convencionales de Next, enlaces externos, CSS y rutas generadas requieren revisión adicional. La herramienta no propone eliminaciones.

`public/pdf/formosa.pdf` pesa **57.013.841 bytes** y excede el máximo de 50 MB de Free y el límite configurado para los buckets turísticos. Se marca `fitsProposedLimit: false`. Mantenerlo local; evaluar después una copia optimizada revisada o un plan autorizado. Nunca dividir, comprimir ni sustituir el original sin revisar legibilidad y enlaces.

El archivo público de inventario excluye `publicidad/`. El informe completo local se genera en `.artifacts/media-inventory-local.json`, ignorado por Git. Sus seis originales permanecen intactos y no se añaden al repositorio.

## Comandos de desarrollo

```sh
npm ci
npm run inventory:media -- --output=docs/supabase/media-inventory.json
npm run inventory:media -- --include-advertising --output=.artifacts/media-inventory-local.json
npm run migration:catalog
npm run db:types
npm run db:check
npm run check
# Solo con un snapshot privado preparado conforme a IMPORT.md:
npm run import:dry-run -- .artifacts/master-snapshot.json
```

Las tres primeras herramientas generan inventarios/mapas; no escriben en Supabase. `import:dry-run` tampoco tiene modo de aplicación. Los tipos se generan con introspección de las migraciones en PGlite; no se presentan como tipos obtenidos de un remoto. Compararlos con el generador oficial al habilitar el entorno real.

## Próximo PR

Confirmar el proyecto y costo; probar migraciones, Advisors y RLS/Storage vía HTTP en el entorno dedicado. Después acordar un primer lote privado pequeño con IDs y versiones explícitos, implementar su importador transaccional y probar restauración. La publicación, los roles de edición, la migración de URLs de assets y la publicidad requieren fases separadas y revisión humana.
