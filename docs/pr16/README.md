# PR16 — Rediseño UX/UI (etapa 2)

Base: `main` `92d4880` (PR #15 fusionado; sus checks de GitHub Actions, Cloudflare Pages y Vercel
terminaron en verde). Rama: `claude/pr16-rediseno-etapa-2`. Sin merge ni despliegue a producción;
no se tocaron DNS, Vercel, Cloudflare, proveedores pagos, los PDF ni `content/escapadas/`.

El sistema visual de PR15 ([docs/pr15/DESIGN-SYSTEM.md](../pr15/DESIGN-SYSTEM.md)) no cambió de
identidad: esta etapa lo extiende a las secciones pendientes y corrige lo que la revisión móvil
encontró. Resultados y mediciones en [RESULTS.md](RESULTS.md); capturas en [capturas/](capturas/).

## Lista de mejoras

### Secciones pendientes

- **Seguridad**
  - Números de emergencia (911 y 134) arriba de todo en teléfonos, como botones de llamada de 80 px
    con nombre accesible.
  - Índice de temas como chips en todos los anchos (antes, solo en escritorio).
  - Consejos como listas de verificación con íconos propios en lugar de emojis.
  - Mismo texto de cada consejo; cabecera y enlazado interno del sistema.
- **Privacidad**
  - Mismo texto legal, sin cambios de significado.
  - Cabecera del sistema, índice lateral de secciones, tipografía de lectura y tabla de cookies legible.
  - Se conservan el panel «Tu decisión sobre las cookies», el canonical y `noindex`.
- **Santa Fe**: las cinco subsecciones comparten un marco (`PaginaSantaFe`) con cabecera, ruta de
  navegación, chips de secciones con la actual marcada y visible, y «Seguí explorando». Reemplaza la
  barra lateral de escritorio, las migas propias y los emojis.
  - Página provincial: chips de secciones; preguntas frecuentes con `<details>` nativo (sin JS, con
    las respuestas en el HTML); grilla de secciones sin repetir las preguntas que ya están en la página.
  - Planes y Noticias: tarjetas con categorías, fecha en `<time>` y enlaces externos rotulados.
  - Eventos: vista lista/calendario con `aria-pressed`, fecha destacada y precio en texto. El archivo
    plegable es compartido con el export estático de Pages.
  - Oficinas: datos en `<dl>`; botones «Llamar» y «WhatsApp» de 44 px con nombre que incluye la localidad.
  - Agencias: filtro por ciudad con chips (`aria-pressed`) y conteo anunciado (`aria-live`).
- **404**: título y mensaje claros, «Volver al inicio» y accesos a las cuatro secciones, sin prefetch
  y sin nombrar contenidos editoriales. Se mantiene liviana a propósito: en el App Router su
  contenido viaja serializado en el RSC de todas las páginas (una primera versión con íconos y
  regiones sumaba ~8 KB sin comprimir a cada página; ver RESULTS.md).
- **Cookies**
  - Banner y panel con el estilo del sistema; mismos textos y misma lógica (`MedicionConConsentimiento`,
    `PreferenciasCookies`, `PagesConsent` y `lib/consentimiento` no cambiaron de comportamiento).
  - «Aceptar» y «Rechazar» siguen con un único estilo; la opción vigente del panel se marca igual
    para ambas.

### Revisión móvil

| Página (móvil, Pages local) | Alto antes | Alto después | Cambio |
| --- | ---: | ---: | --- |
| Portada | 4.454 px | 3.365 px (−24 %) | Destacadas en fila desplazable (antes, tres fotos apiladas de ~300 px), tarjetas de planificación sin la línea de enlace que repetía el título, pie con dos columnas de enlaces |
| Escapadas | 7.657 px | 6.108 px (−20 %) | Banda de región lateral, botón «Ver PDF» y peso en la misma línea; mismo contenido y mismo nombre accesible |

Fotos más pesadas de PR15:
- **Santa Fe y Teatro Colón**: el carrusel pide en teléfonos como máximo la variante de 960 px
  (`SIZES_ANCHO_COMPLETO`, techo de 320 px de referencia; con densidad de 2,6–3× la diferencia con
  1280 no se percibe en una foto de 380 px).
- **Portada**: las destacadas en fila (78 % del ancho) piden la variante de 960 en lugar de 1280.

### Consistencia

- Un único juego de piezas para encabezados (`EncabezadoPagina`), botones (`boton`), chips (`chip`,
  `FilaDesplazable`), tarjetas, avisos y estados vacíos (`Aviso`, `EstadoVacio`) e íconos (`Icono`).
- Se retiraron `SidebarNavigation`, `Breadcrumb` y `SantaFeQuickNav` de Santa Fe, reemplazados por
  `PaginaSantaFe` y `NavegacionSantaFe`. Ningún emoji queda como ícono.
- Una prueba falla si vuelven colores del diseño anterior (`#A68B5B`…), `tracking-widest`,
  `text-gray-*` o emojis en `app/` o `components/`.
- La fila de chips centra la opción activa en teléfonos: actividades, secciones de Santa Fe.

### Preparación para próximos trabajos (sin activar nada)

- **84 fichas de Work**: `lib/destinos/modelo.ts` y `components/destinos/*` sin cambios de contrato;
  la plantilla sigue verificada por la prueba editorial de `TripArticle`.
- **24 fichas de Escapadas**: siguen en `draft`, retenidas en Next y en los tres modos de Pages;
  `PublishedTrips` y `TripView` usan el sistema.
- **Publicidad directa y AdSense**: `lib/publicidad.ts` y `EspacioPublicitario` siguen desactivados.
  Ninguna página nueva agrega espacios.
- **Cloudflare Pages**: `build:pages` reemplaza la agenda de Santa Fe por un único componente
  (`AgendaSantaFe` → `StaticAgenda`). Una prueba verifica que `build.mjs` y la página coincidan. Las
  tres variantes del artefacto se auditan con 0 errores.

## No incluido (etapas siguientes)

Buscador, páginas por región, filtros por tipo de actividad, fichas del maestro y anuncios
([docs/pr15/PROPUESTA.md](../pr15/PROPUESTA.md)).

Observación de datos, no modificada: una oficina de Santa Fe tiene como correo
`info@loreipsumcom` (`public/santa-fe/json/oficinas_informes.json`), que parece un texto de relleno.
