# PR21 · Corrección visual de publicidad directa

La versión corregida muestra únicamente las creatividades originales, sin tarjetas, bordes añadidos, rótulos visibles, nombres de anunciante, transcripciones ni desplegables. Los cinco GIF se reproducen automáticamente. Las seis campañas permanecen activas y sus destinos siguen sin inventarse.

**Estado de GitHub al comenzar esta corrección:** el PR #21 ya estaba fusionado el 26/10/2026 a las 23:20:24 UTC, en `2cb738cf2793710183998610e82a767222a580f3`. Se trabaja sobre la misma rama `codex/pr21-publicidad-directa`, adelantada a ese `main` sin modificar archivos. Un PR fusionado no puede incorporar esta corrección a su diff histórico. No se abre otro PR ni se fusiona o despliega manualmente a producción. La descripción del PR existente referencia la corrección, sus capturas y la comparación de la rama con `main`.

## Archivos y ubicaciones

Los originales de `publicidad/` se conservan. Sus copias públicas son **idénticas byte por byte**; no hay conversión ni alteración de cuadros, duración o repeticiones. El JPEG conserva también sus bytes originales. Las marcas se identificaron por lectura visual, sin deducir contratantes comerciales ni URLs de los logotipos.

| Archivo del cliente | Formato y dimensiones | Peso (bytes) | Anunciante visible | Ubicación pública actual | URL |
| --- | --- | ---: | --- | --- | --- |
| `JJSS_Banners_800x600.gif` | GIF, 800 × 600, 4 cuadros | 567.366 | Santa Fe Provincia / Juegos Suramericanos | Inicio, primer bloque después del hero y antes de provincias | No entregada; sin enlace |
| `PROTEC_ING_banners_Junio_2026_250x250.gif` | GIF, 250 × 250, 3 cuadros | 49.090 | Santa Fe Provincia + Banco Santa Fe | Actividades, inmediatamente después del encabezado y antes del explorador | No entregada; sin enlace |
| `SF-Provincia_Bnnr-Mamografia_1140x100.gif` | GIF, 1140 × 100, 15 cuadros | 24.785 | Ministerio de Salud / Agencia de Control del Cáncer / Santa Fe Provincia | Santa Fe, inmediatamente después del encabezado y antes de navegación y contenido | No entregada; sin enlace |
| `Suramericanos-APSV_200x200.gif` | GIF, 200 × 200, 18 cuadros | 55.158 | APSV / Santa Fe Provincia | Seguridad, después del encabezado y antes de los consejos | No entregada; sin enlace |
| `displays_obras hidricas_600x300 jpg.jpg` | JPEG, 600 × 300 | 210.142 | Santa Fe Provincia | Escapadas, antes de las guías, junto a 1000 aulas en escritorio | No entregada; sin enlace |
| `displays_rosario_mil-aulas_300x600.gif` | GIF, 300 × 600, 2 cuadros | 117.019 | Santa Fe Provincia / Programa 1000 aulas | Escapadas, antes de las guías; debajo de obras hídricas en móvil | No entregada; sin enlace |

Los seis archivos públicos suman 1.023.560 bytes. Hay cinco alternativas estáticas WebP (175.610 bytes en total) exclusivamente para movimiento reducido. El artefacto contiene **11 recursos**. Los antiguos cuadros individuales que formaban la secuencia desplegable se retiraron del directorio público; no se eliminaron originales.

[inventario.json](inventario.json) registra SHA-256, pesos, dimensiones, cuadros, duración de cada cuadro, repeticiones y recursos públicos. Las duraciones y los bucles se conservan por identidad binaria con los originales.

## Presentación y accesibilidad

- `EspacioPublicitario` sigue siendo el componente único y un Server Component. No incorpora JavaScript para reproducir los GIF.
- No hay texto visible añadido dentro del bloque. Se conservan `alt` significativos y `aside aria-label="Publicidad"` para accesibilidad.
- `picture` elige el GIF original en condiciones normales y un WebP estático con `prefers-reduced-motion: reduce`. Funciona desde el HTML inicial, sin JavaScript y al cambiar la preferencia durante la visita.
- La alternativa estática usa un cuadro completo: Juegos 0, Ingresos 0, Mamografía 9, APSV 17 y Aulas 0. El JPEG no necesita alternativa.
- `width`, `height`, `aspect-ratio`, ancho fluido y `object-contain` conservan las proporciones y reservan el espacio. No se recortan ni redibujan textos o logotipos.
- El hero mantiene el texto y los botones existentes, con menor altura mínima (64 svh, techo 38 rem) para acercar el banner al primer scroll.
- En Escapadas, el diseño se adapta mediante `flex-wrap`: dos creatividades completas en paralelo cuando hay espacio y apiladas en móvil. No hay posición fija, superposición ni controles sobre las imágenes.
- Santa Fe muestra solo la banda panorámica de 1140 × 100, sin párrafos, transcripciones ni nombre añadido debajo.

`/privacidad` mantiene la explicación de publicidad directa local y corrige la referencia al antiguo rótulo visible. No hay cambios funcionales en GA4, consentimiento, contenidos turísticos, destinos aprobados, Supabase, DNS, dominios, dependencias o configuraciones pagas. No se agregan cookies, almacenamiento ni medición de clics.

## Administración

Editar `CAMPANAS` en [lib/publicidad.ts](../../lib/publicidad.ts) y reconstruir:

1. `activa: false` oculta una campaña; `activa: true` la reactiva. Una ranura vacía no reserva espacio.
2. `url` es opcional. Ausente o inválida deja el banner sin enlace. Una URL web confirmada abre otra pestaña con `rel="sponsored noopener noreferrer"`.
3. `ubicacion` selecciona una ranura pública. `anchoMaximo` regula el ancho sin recortar. La ranura lateral de Escapadas sigue disponible sin campañas y no se depende de borradores.
4. Para sustituir: conservar el original anterior, incorporar el nuevo archivo entregado a `publicidad/`, actualizar `original`, `imagen` (`src`, dimensiones reales y `alt`) y, si es GIF, `movimientoReducido` (ruta WebP y `fotograma`). Usar rutas nuevas para evitar cachés antiguas.
5. Ejecutar el script de recursos, revisar el inventario y añadir las nuevas copias públicas antes de la exportación Pages:

```bash
node --experimental-strip-types scripts/publicidad/optimizar.mjs
npm run lint
npm run typecheck
npm test
npm run build
git add lib/publicidad.ts public/publicidad docs/pr21/inventario.json
npm run build:pages
node --experimental-strip-types scripts/publicidad/auditar-pages.mjs preview
AUS_WEBKIT=1 npm run test:e2e -- publicidad.spec.ts
```

El script copia los originales sin alterarlos, genera las cinco alternativas estáticas y limpia solamente derivados WebP antes declarados que dejaron de utilizarse. Nunca sobrescribe ni elimina archivos del directorio original `publicidad/`.

Siguen pendientes las seis URLs, fechas de vigencia y la identificación contractual del anunciante. No se agregaron destinos ni vencimientos automáticos.

## Verificación

Verificación local de la corrección, 26/10/2026:

| Control | Resultado |
| --- | --- |
| Lint / TypeScript | Correctos, sin advertencias |
| `npm run validate` | Correcto |
| Pruebas unitarias | 166 aprobadas, 0 fallos |
| Build Next / Pages Preview / Pages production-audit local | Correctos |
| SEO de Next y ambos artefactos Pages | 108 canonicals por formato, 0 errores |
| Auditoría de publicidad Pages | 6 originales + 5 alternativas, hashes correctos |
| Aislamiento editorial | 0 errores; destinos autorizados y fichas retenidas sin cambios |
| E2E completos de Next, incluido iPhone/WebKit | 164 aprobados, 9 omisiones previstas por dispositivo, 0 fallos |
| E2E de Pages: publicidad, destinos y compatibilidad | 71 aprobados, 2 omisiones de Workers que no aplican a exportación estática, 0 fallos |
| CLS en Chrome escritorio y Pixel 7 | 0 en las cinco páginas, en Next y Pages |
| WebKit / iPhone emulado | Animación, movimiento reducido y geometría estable comprobados en las cinco páginas |

Resultados: [resumen](resultados/resumen.json), [Next](resultados/e2e-next.json), [Pages](resultados/e2e-pages.json). Las capturas y estos resultados corresponden a la corrección, no a la implementación estática fusionada originalmente.

Las pruebas de reproducción comparan los píxeles del área de cada creatividad en varios instantes durante un máximo de 10 segundos: los cinco GIF cambian automáticamente. El JPEG permanece igual en capturas separadas por 2,7 segundos. Se tolera el redondeo subpíxel de capturas móviles. La prueba inversa confirma imágenes estables con movimiento reducido. Las pruebas unitarias verifican identidad binaria y metadatos de cuadros, duración y bucle. Se comprueba que cada banner preceda al contenido extenso y que Santa Fe no tenga texto añadido.

iPhone/Safari se verifica con **WebKit 27.2 e iPhone 13 emulado**; no se afirma una prueba en un iPhone físico. WebKit no expone la API `layout-shift`: allí se verifica que ancho, alto y posición de las imágenes no cambien al cargar. Chromium sí permite medir CLS. Los resultados estructurados distinguen ambos casos.

Para reproducir las pruebas Pages se usa la exportación local `production-audit`, que coincide con las expectativas históricas de robots/sitemap:

```bash
node --experimental-strip-types scripts/pages/build.mjs --production-audit
node scripts/pages/prepare-tests.mjs
node --experimental-strip-types scripts/pages/serve.mjs .artifacts/pages/production-audit 4401
# En otra terminal:
AUS_WEBKIT=1 npx playwright test --config scripts/pages/playwright.config.ts publicidad.spec.ts destinations.spec.ts legacy.spec.ts --project=static-escritorio --project=static-movil --project=static-iphone-safari
```

El constructor completo conserva la advertencia histórica de diez PDF mayores a 25 MiB; no se modifican esos archivos ni sus enlaces. Ninguna de estas operaciones carga el artefacto a producción.

## Capturas reales actualizadas

Las capturas contienen GIF en reproducción; representan un instante de sus secuencias. Para Mamografía se espera hasta el mensaje principal antes de capturar. Los tests comprueban además que el bloque no tenga párrafos, rótulos ni desplegables.

| Página | Escritorio 1440 | Pixel 7 | 320 px | iPhone / WebKit |
| --- | --- | --- | --- | --- |
| Inicio | [Ver](capturas/1440-inicio.jpg) | [Ver](capturas/pixel7-inicio.jpg) | [Ver](capturas/320-inicio.jpg) | [Ver](capturas/iphone-safari-inicio.jpg) |
| Actividades | [Ver](capturas/1440-actividades.jpg) | [Ver](capturas/pixel7-actividades.jpg) | [Ver](capturas/320-actividades.jpg) | [Ver](capturas/iphone-safari-actividades.jpg) |
| Escapadas | [Ver](capturas/1440-escapadas.jpg) | [Ver](capturas/pixel7-escapadas.jpg) | [Ver](capturas/320-escapadas.jpg) | [Ver](capturas/iphone-safari-escapadas.jpg) |
| Santa Fe | [Ver](capturas/1440-provincias-santa_fe.jpg) | [Ver](capturas/pixel7-provincias-santa_fe.jpg) | [Ver](capturas/320-provincias-santa_fe.jpg) | [Ver](capturas/iphone-safari-provincias-santa_fe.jpg) |
| Seguridad | [Ver](capturas/1440-seguridad.jpg) | [Ver](capturas/pixel7-seguridad.jpg) | [Ver](capturas/320-seguridad.jpg) | [Ver](capturas/iphone-safari-seguridad.jpg) |

Regenerar: `AUS_WEBKIT=1 AUS_PUBLICIDAD_CAPTURAS=1 npm run test:e2e -- publicidad.spec.ts`. Sin la variable de capturas, las pruebas solo escriben en su directorio de resultados.
