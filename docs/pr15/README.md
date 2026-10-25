# PR15 — Rediseño UX/UI (etapa 1)

Base: `main` `d5dd5bf` (PR #14 fusionado). Rama: `claude/pr15-rediseno-ux-ui`. Sin merge ni despliegue
a producción; no se tocaron Vercel, Cloudflare, DNS, los PDF originales ni `content/escapadas/`.

## Documentos

- [Auditoría previa](AUDITORIA.md): problemas encontrados en producción y Preview, y cómo se resolvieron.
- [Sistema visual](DESIGN-SYSTEM.md): paleta, tipografía, espaciado, movimiento y componentes.
- [Resultados](RESULTS.md): pruebas, accesibilidad, rendimiento antes y después, peso del artefacto.
- [Componentes para las fichas del maestro](FICHAS-WORK.md).
- [Espacios publicitarios](PUBLICIDAD.md) (preparados, desactivados).
- [Propuesta para terminar el rediseño](PROPUESTA.md).
- [Capturas](capturas/): antes y después, escritorio y móvil, sobre el mismo artefacto de Pages local.

## Alcance

| Área | Cambios |
| --- | --- |
| Sistema | Tokens en `app/globals.css`, `components/ui/*`, `lib/regiones.ts`, serif de títulos con `next/font` |
| Encabezado y pie | Marca tipográfica, sección activa, menú móvil, «Saltar al contenido», pie con regiones; ambos pasan al layout raíz |
| Portada | Hero sin efectos de scroll, destacadas, regiones, planificación |
| Provincias | Mapa por región, leyenda con anclas, listado agrupado sin JS |
| Actividades | Filtro con conteo y chips enlazados (Vercel y Pages), lista compacta en móvil |
| Escapadas | Catálogo de 23 PDF con región, duración y peso; aviso de datos móviles |
| Detalles | Provincia y actividad con cabecera, datos de viaje y enlazado interno |
| Plantilla de ficha | `TripArticle` sobre `components/destinos/*` |
| Publicidad | `lib/publicidad.ts` y `EspacioPublicitario`, sin proveedor |
| Infraestructura | `sizes` y `prefetch` en el código fuente; `scripts/pages/build.mjs` deja de parchearlos |

## Herramientas de PR15 (`scripts/pr15/`)

- `capture.mjs <etiqueta> <origen> [--pages-routes]`: capturas y auditoría de cada página.
- `benchmark.mjs <etiqueta> <origen> [repeticiones]`: medición de laboratorio (metodología de PR11).
- `template-preview.mjs <origen>`: vista previa de la plantilla con una ficha ficticia.
- `screenshots-docs.mjs`: genera `docs/pr15/capturas/`.

Todas son locales y de solo lectura: no envían formularios ni aceptan cookies, y bloquean Google.
