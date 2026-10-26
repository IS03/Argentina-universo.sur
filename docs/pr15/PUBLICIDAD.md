# Espacios publicitarios de PR15 — registro histórico

> **Actualizado en PR21:** la publicidad directa ya está activa con los seis originales del cliente.
> La configuración vigente es `lib/publicidad.ts`; el inventario, las ubicaciones, la operación y las
> pruebas están en [docs/pr21/README.md](../pr21/README.md). La vista previa ficticia y
> `AUS_PUBLICIDAD_VISTA_PREVIA` se retiraron. Lo que sigue describe exclusivamente el estado de PR15.

## Estado

- **Ningún anuncio está activo.** No hay proveedor, script, ID de cliente (`ca-pub-…`), cookie ni
  pedido a terceros. Una prueba unitaria falla si aparece `adsbygoogle`, `googlesyndication`,
  `ca-pub-`, `doubleclick` o `googletagservices` en `app/`, `components/` o `lib/`.
- `EspacioPublicitario` devuelve `null` en todas las builds: no ocupa lugar ni agrega HTML.
- La prueba editorial de `TripArticle` sigue exigiendo que la ficha no tenga `adsbygoogle`: el
  espacio lateral lo agrega la página contenedora (`TripView`) mediante la ranura `lateral`.

## Ubicaciones definidas

| ID | Formato | Dónde |
| --- | --- | --- |
| `portada-entre-secciones` | Banda 320 × 100 (móvil) / 728 × 90 (desde 768 px) | Portada, entre «Explorá por región» y «Planificá tu viaje» |
| `actividades-tras-listado` | Banda | /actividades, después de la grilla |
| `escapadas-tras-guias` | Banda | /escapadas, después de las guías |
| `escapada-lateral` | Rectángulo 300 × 250 | Ficha de escapada, columna lateral (escritorio) |

Configuración en `lib/publicidad.ts`. Ninguna ubicación interrumpe el contenido editorial de una
ficha ni se mezcla con las tarjetas.

## Cómo se distinguen del contenido

- Rótulo visible «Publicidad» y `aside aria-label="Publicidad"`.
- Borde y fondo propios (punteado arena en la reserva; borde `sol-400` en el anuncio directo).
- El anuncio directo (`AnuncioDirecto`) enlaza con `rel="sponsored noopener noreferrer"` y en otra
  pestaña.

## Sin CLS

La reserva tiene alto fijo por breakpoint (`h-[100px] md:h-[90px]`, `h-[250px]`) y ancho máximo. Un
anuncio que cargue después ocupa ese hueco y no desplaza el texto.

## Vista previa local

Solo para revisar ubicaciones, nunca en CI ni en Pages:

```bash
NEXT_DIST_DIR=.artifacts/pr15/next-publicidad AUS_PUBLICIDAD_VISTA_PREVIA=1 npx next build
```

Next agrega esa carpeta a `tsconfig.json`; hay que descartar ese cambio. La vista previa dibuja las
reservas rotuladas y un anuncio directo **ficticio** («Negocio turístico de ejemplo»), sin scripts.

## Antes de activar (decisión del titular)

1. Elegir proveedor y ubicaciones; publicidad directa no requiere scripts de terceros.
2. AdSense usa almacenamiento y señales publicitarias que el consentimiento actual rechaza
   (`ad_storage`, `ad_user_data`, `ad_personalization` en `denied`): hay que actualizar
   `/privacidad`, el banner y las pruebas de consentimiento antes de cargar cualquier script.
3. Revisar la política de contenidos y el rótulo con el anunciante.
4. Medir de nuevo LCP, CLS y peso móvil con los anuncios reales.
