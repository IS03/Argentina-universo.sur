# PR 05 — Estabilidad, accesibilidad y navegación

Objetivo: corregir navegación móvil, saltos de diseño de los mapas y el error de hidratación de
`/provincias/santa_fe` sin cambiar el diseño general, los datos turísticos ni las URLs públicas.

## 1. Error de hidratación (React #418)

### Reproducción controlada

| Escenario (build de producción de `main`, Next 16.1.1) | Cargas con #418 |
| --- | --- |
| Servidor recién iniciado, 4 cargas concurrentes de `/provincias/santa_fe` | 3 de las 3 primeras (0 de 140 después, en caliente) |
| Proxy que entrega cada fila de Flight por separado cada 20 ms (móvil) | 6 de 20 en Santa Fe |
| Mismo proxy, `/provincias/catamarca` | 1 de 10 |
| Mismo proxy en `next dev` (mensaje sin minificar) | 3 de 12, siempre en el mismo nodo |

El “1 de cada 20” observado antes se debía a que Playwright inicia un servidor nuevo en cada
corrida: la prueba de Santa Fe solía estar entre las primeras cargas en frío.

### Causa

- `/provincias/santa_fe` es la única provincia que se renderiza bajo demanda (`ƒ`): existe la
  carpeta estática `app/provincias/santa_fe/` (subpáginas) sin `page.tsx`, así que la ruta no se
  prerenderiza con las otras 23. Su HTML se transmite en streaming mientras se renderiza.
- React Flight difiere a una fila aparte (referencia perezosa `$L`) todo elemento que aparece
  después de 3.200 bytes serializados. En Santa Fe, las tarjetas de `SantaFeSectionsGrid` desde
  “Oficinas” y partes de su contenido llegan en filas diferidas.
- Si una de esas filas llega mientras React hidrata, el elemento HTML que la contiene suspende y
  React lo vuelve a ejecutar (`replayBeginWork`). El React incluido en Next 16.1.1
  (`19.3.0-canary-f93b9fd4-20251217`) no rebobina el cursor de hidratación al hacerlo: el
  `div.p-6` de la tarjeta “Noticias” reclama su propio hijo `div.flex` y el resto queda corrido.
  El diff de desarrollo lo muestra exactamente:

  ```
  <a className="group rela...">
    <div
  +   className="p-6 h-full flex flex-col"
  -   className="flex items-center gap-4 mb-4"
    >
  +   <div className="flex items-center gap-4 mb-4">
  -   <span className="text-4xl ...">
  ```

- No hay diferencias de contenido entre servidor y cliente: el HTML de una carga en frío es
  idéntico byte a byte al de una en caliente, y no hay fechas, `Math.random`, `window` ni
  `localStorage` en el render. Las fechas de la agenda se calculan en el servidor y viajan como
  datos.
- Es el bug [react/react#37584](https://github.com/react/react/issues/37584), corregido por
  [react/react#35494](https://github.com/react/react/pull/35494) (13/01/2026). Afecta a cualquier
  página bajo streaming lento (también se reprodujo en Catamarca), no solo a Santa Fe.

### Corrección

`next` 16.1.1 → **16.4.3** (versión estable más reciente). App Router usa el React incluido en Next
(no el paquete `react-dom` del proyecto). El de 16.4.3 (`19.3.0-canary-278794d7-20261002`) incluye la
corrección en `replayBeginWork`, verificada en el código incluido; la primera línea que la trae es
16.2. 16.4.3 además cierra todos los avisos de seguridad de Next que afectan a `main` (sección 5). No
se agregan dependencias y `eslint-config-next` queda en 16.1.1 (ver “Pendientes”).

Verificación con 16.4.3: 0 errores en 80 cargas con streaming lento (Santa Fe y Catamarca), la prueba
E2E de regresión (abajo) y 0 errores #418 en 54 recorridos de navegación en paralelo (en `main`
aparecieron en la misma prueba).

### Regresión de prefetch en Next 16.3+ y corrección

Next 16.3+ predice la ruta de un enlace a partir de otros ya conocidos (enrutamiento optimista).
Después de ver `/actividades`, predice el mismo segmento (`/actividades/__PAGE__`) para
`/actividades?provincia=…`, que es un rewrite por query de PR 04 a otra ruta, y ese prefetch responde
404 ([vercel/next.js#97244](https://github.com/vercel/next.js/issues/97244), sin corregir;
[PR #98673](https://github.com/vercel/next.js/pull/98673) abierto). La navegación igual llegaba a la
provincia correcta, pero con pedidos fallidos y errores de consola.

El único enlace a esas URLs es el botón “Ver qué hacer en …” de cada provincia. Ahí se desactivó la
precarga (`prefetch={false}`): el clic sigue navegando en el cliente y pide el árbol completo al
servidor, que resuelve bien el rewrite. Una prueba unitaria impide volver a agregar enlaces precargados
a esas URLs. No se cambian rutas ni URLs públicas.

Recorridos en 6 navegadores en paralelo (botón desde 4 provincias; navbar → filtro → detalle → atrás
→ adelante → atrás → recarga; carga directa con el alias `catarmaca` → detalle → atrás):

| Versión | Pedidos RSC con error | Errores de consola | Recorridos correctos | Clic en “Ver qué hacer” (mediana, móvil 150 ms RTT) |
| --- | --- | --- | --- | --- |
| `main` (16.1.1) | 0 de 2.197 | 4 errores #418 en Santa Fe (en 90 recorridos) | 85 de 90 (5 tiempos agotados en la primera corrida) | 100 ms |
| 16.4.3 sin corrección | 13 de 1.669 (`/actividades/__PAGE__`) | 13 (los 404) | 54 de 54 | — |
| **16.4.3 + `prefetch={false}`** | **0 de 1.775** | **0** | **54 de 54** | **102 ms** |

Sin la precarga, el clic tarda lo mismo: la variante es estática y su respuesta RSC es chica.

## 2. Menú móvil

| Problema | Corrección |
| --- | --- |
| Los enlaces eran `inline` con `py-6`: el relleno de cada uno tapaba el texto del anterior (tocar “Qué hacer” abría “Escapadas”). | Enlaces `block` con `py-4`: filas de 61 px que no se superponen. |
| Cerrado, el menú seguía en el orden de tabulación (`aria-hidden` sobre enlaces enfocables). | `inert` cuando está cerrado. |
| Botón “Toggle menu” sin estado. | “Abrir menú” / “Cerrar menú”, `aria-expanded`, `aria-controls`, 44 × 44 px. |
| Sin teclado: no se cerraba con Escape y el foco quedaba en la página de fondo. | Al abrir, foco en la primera opción; Tab recorre solo logo, botón y opciones; Escape cierra y devuelve el foco al botón. |
| La página de fondo se desplazaba bajo el menú. | Se bloquea el scroll del documento mientras está abierto. |
| Cierre al navegar solo por clic. | El estado recuerda la ruta en la que se abrió: cualquier navegación (incluido “atrás”) lo cierra. |
| Al pasar a escritorio con el menú abierto quedaba el estado abierto. | Se cierra al cruzar el breakpoint `md`. |

## 3. Saltos de diseño de los mapas

### Causa

- **Detalle de actividad (CLS 0,31):** Leaflet se cargaba con `ssr: false` y sin espacio reservado.
  El elemento LCP era el primer párrafo de la descripción; al montar el mapa (384 px) lo empujaba.
  Reservar el alto dejaba el CLS en 0, pero entonces la descripción quedaba bajo el pliegue y el
  LCP pasaba a ser una tesela de OpenStreetMap, que solo se pedía después de hidratar, descargar
  Leaflet e inicializarlo (2,7 → 5,7 s).
- **`/provincias` (CLS 0,19):** el SVG del mapa se descarga con `fetch` después de hidratar y se
  insertaba en un contenedor de alto 0. Mientras tanto la grilla de provincias quedaba en pantalla
  (su primera foto era el LCP) y luego bajaba unos 600 px.
- **Página de provincia:** el mapa de la capital ya tenía un marcador de posición del mismo alto
  (sin CLS), pero pedía Leaflet e íconos de unpkg.com al hidratar.

### Solución

- **`MapaUbicacion`** (actividades y capitales) ocupa siempre su alto fijo (`h-96`) desde el HTML,
  así nunca desplaza el contenido. Dentro hay una vista previa estática y Leaflet llega después:
  - **Vista previa con teselas reales:** el servidor calcula las mismas teselas de OpenStreetMap
    que pedirá Leaflet para ese centro y zoom (`lib/mapa-teselas.ts`, proyección Web Mercator) y
    las posiciona respecto del centro (`calc(50% ± n px)`), así coinciden con Leaflet en cualquier
    ancho. Van con `loading="lazy"` y las que no entran en el ancho de la ventana quedan en
    `display: none` (el recorte de `overflow` no evita la descarga): un móvil pide 6, no 12.
  - **Sobre el pliegue en móvil** (detalle de actividad, `teselasEnMovil={false}`): se muestra un
    fondo liviano en CSS con el marcador y el botón “Explorar mapa”, sin imágenes. Se probó primero
    con teselas también en móvil: CLS 0, pero esas ~150 KB de imágenes de otro origen pasaban a ser
    el LCP (2,7 → 4,2 s simulado; 1,6 → 2,8 s con limitación aplicada). En escritorio la descripción
    visible es más grande que una tesela y el LCP no cambia, así que ahí se ven las teselas reales.
    Es el patrón de “fachada” que Lighthouse recomienda para mapas embebidos.
  - **Leaflet** (~45 KB de JS y su CSS) se descarga al tocar “Explorar mapa” o activarlo con el
    teclado, y se precarga al pasar el puntero o enfocar el botón. Monta encima con fondo
    transparente; cuando sus teselas cargan, la vista previa se retira sin salto visible y el foco
    pasa al mapa. Sus teselas nunca compiten como nuevo LCP y en móvil el mapa ya no atrapa el
    desplazamiento de la página antes de que la persona quiera usarlo.
  - Íconos del marcador servidos por el sitio (antes, unpkg.com) y teselas desde
    `tile.openstreetmap.org` sin subdominios, como recomienda OSM.
- **Carrusel de los detalles:** quedaba debajo del pliegue pero precargaba su primera foto con
  prioridad alta, compitiendo con el contenido visible. Ahora carga en diferido.
- **`/provincias`:** el contenedor del SVG reserva su alto con `aspect-ratio` del `viewBox` y el
  mismo tope de 600 px. La grilla ya no se mueve.

## 4. Accesibilidad

| Componente | Cambio |
| --- | --- |
| Mapa de ubicación | Botón “Explorar mapa interactivo: …” operable con teclado; mapa con `aria-label` e instrucciones; flechas y +/− (teclado nativo de Leaflet); controles “Acercar”/“Alejar”; marcador con `alt`; contorno de foco visible hacia adentro. |
| Mapa SVG de `/provincias` | Cada provincia es un enlace (`role="link"`, `tabindex="0"`, `aria-label`) que se abre con Enter o Espacio; el foco resalta la provincia como el hover. |
| Filtro por región | El `<select>` móvil no tenía nombre accesible; los chips de escritorio indican `aria-pressed`. |
| Carrusel de detalle | No rota con `prefers-reduced-motion: reduce`; se detiene con puntero o foco encima; puntos con área de 24 × 24 px, `aria-current` y colores visibles sobre el fondo crema (antes, blancos sobre crema). |
| Global | Indicador `:focus-visible` consistente (sin pisar los estilos propios); con movimiento reducido no hay desplazamiento suave ni transiciones decorativas (incluido el botón “Explorar destinos”). |

## 5. Seguridad (`npm audit`)

| Alcance | `main` (Next 16.1.1) | Este PR (Next 16.4.3) |
| --- | --- | --- |
| Producción (`--omit=dev`) | 6: 1 crítico, 4 altos, 1 moderado | **0** |
| Todas las dependencias | 17: 1 crítico, 12 altos, 3 moderados, 1 bajo | 12: 0 críticos, 9 altos, 2 moderados, 1 bajo |

`next` 16.1.1 acumulaba 41 avisos, 4 de ellos críticos (RCE en el optimizador de imágenes con AVIF y
con SVG, RCE en servidores Windows, RCE en `use cache`), además de SSRF en el optimizador,
envenenamiento de caché y DoS con Server Actions. Todos quedan cerrados con 16.4.3. `source-map-js`
(alto, usado por PostCSS en el build) se actualizó de 1.2.1 a 1.2.2.

Los 12 avisos restantes son solo de desarrollo: no se incluyen en el sitio desplegado.

| Paquete | Severidad | Origen | Aplicabilidad |
| --- | --- | --- | --- |
| `brace-expansion`, `minimatch`, `picomatch` | alto | ESLint y `eslint-config-next` | DoS/ReDoS con patrones glob maliciosos; solo procesan patrones propios del repositorio. |
| `flatted`, `js-yaml`, `ajv`, `@humanfs/node` | alto/moderado | ESLint | DoS o contaminación de prototipos con caché o configuración manipuladas; entrada local y confiable. |
| `@babel/core`, `browserslist`, `zod` | bajo/alto | `eslint-config-next` | Lectura de archivos o agotamiento de memoria con entradas maliciosas al linter; no aplica en CI ni en Vercel. |
| `sharp` 0.34.5 (dependencia de desarrollo directa) | alto | `package.json` | Vulnerabilidades de libvips/libheif/librsvg al procesar imágenes no confiables. No se importa en el código; Next usa su propio `sharp` 0.35.5, sin avisos. |
| `xlsx` 0.18.5 | alto, sin corrección en npm | `package.json` | Contaminación de prototipos/ReDoS al leer Excel manipulados; solo se usa a mano para convertir los Excel propios de `data/excel/`. |

Ninguno es explotable en producción. Se recomienda un PR de mantenimiento: `npm audit fix` para las
herramientas de lint, quitar o actualizar `sharp` (no se usa directamente) y reemplazar `xlsx` por la
distribución oficial de SheetJS o un script que no lo necesite.

## 6. Medición

MEDICION_PENDIENTE

## 7. Pruebas

- `npm test`: 33 pruebas (+3: teselas de la vista previa contra la fórmula de OSM, cobertura en
  cualquier ancho para las 72 actividades y 24 capitales, y enlaces a `/actividades?provincia=…` sin
  precarga).
- `npm run test:e2e`: 44 escenarios × escritorio y móvil (antes 22): 88 casos, de los que 9 se omiten por perfil. Tres corridas completas seguidas: 237 ejecuciones, 0 fallos. Las
  teselas de OSM se responden con un PNG local: las pruebas no salen a internet.
  - Menú: estados accesibles, foco, Escape, Tab contenido, toque real en cada opción (la prueba que
    estaba en `test.fixme`), cierre al navegar, al volver atrás y al pasar a escritorio.
  - Mapas: vista previa en el HTML sin JavaScript, CLS < 0,01 en detalle, provincias y `/provincias`,
    0 teselas en el detalle móvil y solo las visibles en el mapa de la capital, teselas reales en
    escritorio, activación por teclado, flechas y zoom.
  - Hidratación: proxy de streaming lento, 25 cargas seguidas de Santa Fe y de Catamarca por perfil.
  - Accesibilidad: controles sin nombre accesible en cuatro rutas, áreas táctiles, carrusel con
    movimiento reducido.
  - Santa Fe vuelve a la prueba de enlaces provinciales filtrados (estaba excluida por el #418).
- Contra la build de `main`, las pruebas nuevas fallan donde corresponde: 19 fallos (menú, mapas,
  CLS, nombres accesibles, áreas táctiles e hidratación en 3 de 4 combinaciones).
- `npm run audit:seo`: 106 páginas, 0 errores. Sitemap con 106 URLs.

## 8. Pendientes

1. **Bug de Next #97244 sin corregir.** La corrección es puntual (`prefetch={false}` en el botón de
   cada provincia y una prueba que lo exige). Cuando Next publique la corrección
   ([PR #98673](https://github.com/vercel/next.js/pull/98673)), se puede volver a precargar ese enlace.
   Si en el futuro se agregan otros rewrites por query, aplicar el mismo criterio.
2. **`eslint-config-next`** sigue en 16.1.1 (solo reglas de lint; no afecta el runtime). Con 16.2+
   la regla `react-hooks/refs` marca un falso positivo en `HeroCarousel` (`onLoad` que escribe en un
   ref). Actualizarlo en el PR de mantenimiento de dependencias de desarrollo (sección 5).
3. **Santa Fe se renderiza bajo demanda** por el conflicto entre `app/provincias/santa_fe/` y
   `[slug]`: cada visita ejecuta una función en Vercel en lugar de servirse desde CDN, y su agenda
   depende de la hora. Ya no produce errores, pero se puede prerenderizar con revalidación
   (p. ej. `page.tsx` propio con `revalidate`) en un PR de rendimiento.
4. **Teselas de OpenStreetMap:** la vista previa usa el servidor público de teselas, igual que
   Leaflet antes. Si el tráfico crece, la política de uso de OSM recomienda un proveedor comercial o
   un caché propio; el cambio se limita a `URL_TESELAS`.
5. **`/provincias`:** `ViajeArgentina` sigue recibiendo las descripciones completas de las 24
   provincias, y el SVG se pide con `fetch` después de hidratar (ya sin CLS). Inlinear el SVG en el
   servidor adelantaría el mapa.
6. El chevron del `<select>` de `/actividades` es blanco sobre fondo crema (casi invisible); fuera
   del alcance de este PR.
7. **Carrusel de los detalles:** sigue rotando (y descargando la foto siguiente cada 3 s) aunque esté
   fuera de pantalla, como en `main`. Pausarlo con `IntersectionObserver`, igual que el hero de la
   portada, ahorraría datos en móvil.
