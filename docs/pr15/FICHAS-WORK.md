# Componentes para las fichas futuras (maestro de 84 registros)

No se importó, publicó ni consultó el Google Sheets maestro. Este PR solo prepara la presentación.

## Contrato

`lib/destinos/modelo.ts` define tipos (sin datos):

- `Destino`, `Atractivo`, `Localidad`, `FuenteOficial`, `DatoPractico`, `UbicacionMapa`, `Foto`.
- **IDs estables:** `id` es el identificador del maestro tal como esté registrado. Nunca se deriva del
  slug ni del nombre y no cambia si cambia el título.
- **Relaciones por ID:** `provinciaSlugs`, `localidadId`, `fuenteIds`.
- **Evidencia:** toda afirmación verificable cita `fuenteIds`; fechas en AAAA-MM-DD visibles.
- **Origen:** `referenciasMaestro` (`hoja`, `idOriginal`) equivale a `editorial.origin.masterRefs` de
  `lib/pages/trips.ts` y solo se completa con una conciliación autorizada.

## Componentes (`components/destinos/`)

| Componente | Uso |
| --- | --- |
| `FotoConCredito` | Foto con licencia aprobada, variantes locales (`srcset`), leyenda, titular y licencia visibles |
| `ReferenciasFuentes` | «Fuentes: …» en línea, con anclas a la lista final |
| `ListaFuentes` | Fuentes oficiales con fecha de consulta y, si la hay, de publicación (`<time>`) |
| `Localidades` | Localidades de referencia como etiquetas |
| `Ubicaciones` | Enlaces a OpenStreetMap; sin iframes ni scripts |
| `InfoPractica` | Datos prácticos breves con fuente y fecha de verificación |
| `TarjetaAtractivo` | Atractivo por tipo (naturaleza, cultura, patrimonio, actividad, gastronomía), localidad, mapa y fuentes; sin foto aprobada queda solo con texto |

`components/escapadas/TripArticle.tsx` ya los usa mediante adaptadores desde la proyección pública
(`PublishedTrip`). Por eso la plantilla de escapada es la misma que tendrá una ficha del maestro:
cabecera con portada y crédito, índice lateral (fila de chips en teléfonos), secciones con ícono
por tipo, avisos operativos, galería, ubicaciones, fuentes y contenido relacionado.

Las garantías editoriales no cambiaron: la ficha recibe solo la proyección pública, no importa el
catálogo ni publicidad, y el marcado de los avisos operativos que fijan las pruebas de PR12–PR14 se
conserva tal cual.

## Para conectar una ficha del maestro (etapa futura)

1. Conciliar ID y relaciones con el contrato de PR9 y registrar `masterRefs`.
2. Escribir un adaptador `maestro → Destino` (o `→ PublishedTrip`) con pruebas de que los IDs no se
   regeneran.
3. Aprobar contenido y derechos de fotos con el flujo existente (`status`, `review`, hash).
4. Recién entonces crear rutas; hoy no se agregó ninguna.

La vista previa con datos **ficticios** se genera con
`node --experimental-strip-types scripts/pr15/template-preview.mjs <origen de una build local>`.
