# Propuesta para terminar el rediseño

PR15 es la **etapa 1**: sistema visual, encabezado y pie, portada, provincias, actividades,
Escapadas y la plantilla de ficha. Etapas siguientes, cada una en un PR revisable:

## Etapa 2 — Páginas de contenido restantes

- `/seguridad`: cabecera del sistema, índice de temas como chips, cada tema como tarjeta con ícono
  propio (hoy usa emojis) y bloque de emergencias destacado con `Aviso`.
- `/privacidad`: tipografía `prosa`, índice lateral y tabla de almacenamiento con el estilo nuevo.
- Santa Fe (`/provincias/santa_fe` y sus 5 subpáginas): reemplazar degradados y emojis por tarjetas
  del sistema; unificar `SidebarNavigation`, `Breadcrumb` y `SantaFeQuickNav` con `MigasDePan` y chips.
- 404 con buscador de destinos por región.
- Banner de cookies y panel de preferencias con los botones del sistema (mismo peso visual, ya
  probado).

## Etapa 3 — Descubrimiento

- Buscador local sin servicios externos: índice estático generado en el build (provincias,
  actividades y escapadas) con filtrado en el navegador y resultados enlazados; sin JS, el formulario
  lleva a /actividades.
- Filtros de actividades por tipo (naturaleza, cultura, aventura) cuando el catálogo tenga esa
  clasificación con datos verificados.
- Páginas por región solo si el titular aprueba nuevas URL indexables (hoy se mantienen las 106).

## Etapa 4 — Fichas del maestro (Work)

- Adaptador del maestro a `lib/destinos/modelo.ts` conservando IDs y relaciones (ver
  [FICHAS-WORK.md](FICHAS-WORK.md)), con aprobación editorial y de derechos por ficha.
- Rutas de destino con la plantilla de `TripArticle` y `TarjetaAtractivo`.
- Retiro progresivo de PDF solo con equivalencia aprobada (flujo de PR12).

## Etapa 5 — Publicidad

Decisión del titular sobre proveedor y ubicaciones ([PUBLICIDAD.md](PUBLICIDAD.md)), actualización de
privacidad y consentimiento, y nueva medición con anuncios reales.

## Mantenimiento del sistema

- Prohibir colores sueltos con una regla de lint (`text-[#…]`) una vez migradas las páginas de la
  etapa 2.
- Revisar con lector de pantalla real (VoiceOver y TalkBack) las páginas rediseñadas.
- Medir Core Web Vitals reales (Speed Insights en Vercel o RUM en Pages) tras publicar.
