# Sistema visual Universo Sur

Primera versión (PR15). Los tokens viven en `app/globals.css` (`@theme` de Tailwind 4) y las recetas
de componentes en `components/ui/`. Cualquier pantalla nueva debería poder armarse sin colores ni
tamaños sueltos (`text-[#...]`, `h-[537px]`).

## Principios

1. **Paisaje primero, interfaz tranquila.** Las fotos llevan el color; la interfaz usa neutros cálidos
   y un solo color de acción.
2. **Una región, un color.** Las seis regiones turísticas del catálogo tienen color propio y se usan
   igual en mapa, tarjetas, antetítulos, chips y pie. Es el rasgo de identidad del sitio.
3. **Teléfono antes que escritorio.** Áreas táctiles de 44 px, filas de chips desplazables en lugar
   de bloques de enlaces, listas compactas donde una grilla de fotos sería pesada.
4. **Funciona sin JavaScript donde ya funcionaba.** Anclas reales, enlaces de filtro reales y HTML
   completo desde el servidor.
5. **Nada se mueve después de pintar.** Toda imagen, mapa o espacio publicitario reserva su alto.

## Color

| Token | Valor | Uso | Contraste sobre arena-50 |
| --- | --- | --- | ---: |
| `arena-50` | `#FBF8F2` | Fondo general | — |
| `arena-100` | `#F4EEE3` | Bandas de cabecera y secciones | — |
| `arena-200` / `300` | `#E9DFCF` / `#D9CDB8` | Fondos de foto, bordes suaves | — |
| `arena-400` | `#9C8B70` | Bordes de controles | 3,12:1 (≥ 3:1 de UI) |
| `tinta-900` | `#1C2629` | Títulos, texto fuerte, pie | 14,58:1 |
| `tinta-700` | `#37454A` | Texto de lectura | 9,38:1 |
| `tinta-500` | `#56656A` | Texto secundario | 5,72:1 |
| `lago-600` / `700` | `#1B5A70` / `#14485A` | Acciones, enlaces, foco | 7,22:1 / 9,41:1 |
| `terracota-600` | `#A8472A` | Antetítulos, íconos de acento | 5,50:1 |
| `sol-400` | `#E3A72F` | Decorativo; texto solo sobre tinta-900 | 7,24:1 sobre tinta |
| `celeste-300` | `#74ACDF` | Decorativo | — |

Colores de región (como texto sobre arena-50 y como fondo de texto blanco):

| Región | Token | Valor | Contraste |
| --- | --- | --- | ---: |
| Norte | `region-norte` | `#A8472A` (terracota de quebrada) | 5,50:1 |
| Litoral | `region-litoral` | `#2E6A3E` (selva) | 6,10:1 |
| Centro | `region-centro` | `#8A5F17` (ocre serrano) | 5,31:1 |
| Cuyo | `region-cuyo` | `#7A2E46` (vino) | 8,59:1 |
| Buenos Aires | `region-buenos-aires` | `#2B5A88` (río y pampa) | 6,78:1 |
| Patagonia | `region-patagonia` | `#2F6E7E` (glaciar) | 5,42:1 |

`lib/regiones.ts` entrega para cada región el nombre, el ancla (`region-norte`…), el lema y las
clases completas (`text-`, `bg-`, `border-`, `fill-`) para que Tailwind las genere. Una prueba
unitaria comprueba que cada clase tenga su token y que las 24 provincias queden cubiertas.

Los colores anteriores (`#5A4E3D`, `#6B5D47`, `#A68B5B`…) se reemplazaron por tokens en todo el
código. `#A68B5B` se usaba como texto y hover con 3,0:1; pasó a `lago-600`.

## Tipografía

- **Títulos:** Instrument Serif 400 (`font-display`), un solo archivo latino servido por `next/font`
  desde el propio dominio, con métricas de respaldo ajustadas para no desplazar el texto.
- **Texto:** Geist (`font-sans`). Se retiró Geist Mono, que no se usaba.
- **Escala fluida** (`clamp`, de 360 a 1280 px): `text-display` (portada), `text-titulo` (h1),
  `text-seccion` (h2). El resto usa la escala de Tailwind.
- **Mayúsculas** solo en el antetítulo (`antetitulo`: 12 px, 600, tracking 0,14 em). Los títulos ya no
  van en mayúsculas con tracking amplio.
- **Lectura:** utilidad `prosa` (68 caracteres, 17 px, interlineado 1,7, párrafos separados).

## Espaciado, bordes y sombras

- Contenedor único `contenedor`: máximo 1216 px, márgenes de 16 / 24 / 32 px.
- Secciones: `py-14 sm:py-20`; bloques internos en múltiplos de 4 px.
- Radios: `rounded-tarjeta` (16 px), `rounded-control` (12 px), chips y botones redondeados.
- Sombras: `shadow-tarjeta` (reposo) y `shadow-elevada` (hover). Sin degradados decorativos de fondo.

## Movimiento

`ease-suave` y duraciones de 200–300 ms en hover y menú; zoom de 4 % en fotos de tarjetas. Con
`prefers-reduced-motion` no hay transiciones, desplazamiento suave ni rotación del carrusel. Se
eliminó el hero fijo con desenfoque y opacidad por scroll (JavaScript en cada frame y filtros sobre
una foto de pantalla completa).

## Componentes

| Componente | Archivo | Notas |
| --- | --- | --- |
| Encabezado y menú | `components/Navbar.tsx` | Marca tipográfica, sección activa (`aria-current`), menú móvil inert y fuera de pantalla cerrado, sin prefetch en teléfonos |
| Pie | `components/Footer.tsx` | Franja con los seis colores, enlaces rápidos y por región |
| Saltar al contenido | `app/layout.tsx` | Primer elemento enfocable, lleva a `<main id="contenido">` |
| Cabecera de página | `components/ui/EncabezadoPagina.tsx` | Ruta de navegación, antetítulo, h1 y bajada |
| Título de sección | `components/ui/Bloques.tsx` (`EncabezadoSeccion`) | Antetítulo, h2, bajada y una acción |
| Botones | `components/ui/estilos.ts` (`boton`) | `primario`, `claro`, `secundario`, `sutil`, `sobre-imagen`; 44 px mínimo |
| Chips | `estilos.ts` (`chip`) + utilidad `fila-desplazable` | Filtros y navegación; una fila desplazable en teléfonos |
| Avisos | `components/ui/Aviso.tsx` | `info` y `aviso` con ícono y nombre accesible |
| Estado vacío | `Bloques.tsx` (`EstadoVacio`) | Explica y ofrece una salida |
| Seguí explorando | `components/ui/SeguirExplorando.tsx` | Enlazado interno al pie del contenido |
| Íconos | `components/ui/Icono.tsx` | 13 trazos propios, decorativos (`aria-hidden`) |
| Grillas | `components/ui/grillas.ts` | Cada grilla junto a su `sizes`; una prueba verifica que coincidan |
| Tarjeta de provincia | `components/ProvinciaCard.tsx` | Foto 4:5, región y nombre sobre degradado inferior |
| Tarjeta de actividad | `components/ActividadCard.tsx` | Lista con miniatura en teléfonos; tarjeta desde 640 px |
| Filtro de actividades | `components/actividades/FiltroProvincias.tsx` | Select `#provincia-filtro` + chips enlazados; conteo con `aria-live` |
| Filtro por región | `components/FiltroZonas.tsx` | Chips `aria-pressed` en todos los anchos |
| Mapa de provincias | `components/MapaArgentina.tsx` | Colores por región, realce por CSS, teclado |
| Fichas futuras | `components/destinos/*` | Ver [FICHAS-WORK.md](FICHAS-WORK.md) |
| Publicidad | `components/publicidad/EspacioPublicitario.tsx` | Ver [PUBLICIDAD.md](PUBLICIDAD.md) |

## Imágenes

Las grillas declaran su `sizes` real (antes lo inyectaba solo el build de Pages). En teléfonos el
listado de actividades usa miniaturas de 112 px (variante WebP de 320 px) para que la primera
pantalla no dependa de fotos grandes. Las tarjetas no precargan rutas (`prefetch={false}`).
