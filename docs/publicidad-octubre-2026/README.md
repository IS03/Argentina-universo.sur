# Publicidad institucional · pauta de octubre de 2026

Reorganización de las seis creatividades institucionales según las ubicaciones contratadas para octubre de 2026. Se usan exactamente los mismos archivos públicos de PR #21 (GIF y JPEG idénticos byte por byte a los originales de `publicidad/`, con sus cuadros, tiempos, repeticiones, textos alternativos y alternativas estáticas para movimiento reducido). Solo cambian la ranura de cada campaña y el diseño de las páginas que las reciben.

## Ubicaciones finales

| Campaña | Archivo · tamaño | Ranura (`lib/publicidad.ts`) | Escritorio (≥ 1280 px) | Móvil y tablet (< 1280 px) |
| --- | --- | --- | --- | --- |
| JJSS – Gracias | GIF 800 × 600 | `portada-central` | Inicio, columna central, primer bloque después del hero, centrado (máx. 800 px) | Primer bloque después del hero, a todo el ancho útil |
| JJSS – APSV | GIF 200 × 200 | `portada-lateral-izquierda` | Inicio, columna izquierda real de 200 px, `position: sticky` debajo del encabezado; se suelta al terminar la grilla, antes de «Planificá tu viaje» y del pie | En el flujo, centrada entre «Provincias destacadas» y «Explorá por región»; nunca fija; siempre 200 × 200 |
| Mil Aulas – Rosario | GIF 300 × 600 | `portada-lateral-derecha` | Inicio, columna derecha de 300 px junto a «Explorá por región», opuesta a APSV | En el flujo, centrada después de «Explorá por región» (máx. 300 px) |
| Obras Hídricas | JPG 600 × 300 | `actividades-antes-explorador` | Qué hacer, arriba del contenido y antes del explorador, centrada | Igual, escalada al ancho disponible |
| Salud – Octubre Rosa | GIF 1140 × 100 | `escapadas-antes-guias` | Escapadas, inmediatamente después del encabezado y antes de las guías | Igual, escalada proporcionalmente sin recorte |
| Economía – Desendeudamiento | GIF 250 × 250 | `provincias-lateral-mapa` | Viajar por Argentina, columna derecha de 250 px junto al mapa (lado de la leyenda), `sticky` mientras se recorre la tarjeta | En el flujo, centrada después de la tarjeta del mapa y antes de las regiones; no tapa el mapa |

Retiros respecto de la distribución anterior:

- Santa Fe (`/provincias/santa_fe`) ya no muestra Octubre Rosa; Seguridad ya no muestra APSV; Actividades ya no muestra Economía; Escapadas ya no muestra Obras Hídricas ni Mil Aulas. Las ranuras `santa-fe-tras-encabezado` y `seguridad-antes-consejos` siguen definidas pero vacías: sin campaña no generan HTML ni márgenes.
- Escapadas ya no tiene el bloque «Antes de descargar» ni su margen. Los enlaces, nombres, pesos y descargas de los PDF no cambiaron.
- `footer-patrocinio` y `escapada-lateral` siguen disponibles, sin campañas y sin reservar alto.

### Decisiones de diseño

- **Portada.** Desde 1280 px el contenido posterior al hero se organiza en una grilla `200px | contenido | 300px` (máximo 1440 px). APSV ocupa la columna izquierda en las dos filas (JJSS + destacadas, y regiones), por eso su `sticky` tiene recorrido real. Mil Aulas va en la columna derecha a la altura de «Explorá por región». En esta grilla, «Explorá por región» pasa de banda a panel con el mismo fondo y borde, y sus seis regiones se ordenan en 3 × 2.
- **Por qué no «Continuar explorando».** Esa sección solo aparece cuando el visitante tiene historial en el navegador; un banner allí desaparecería para quien entra por primera vez.
- **Columnas condicionadas.** La grilla lateral se arma según las campañas activas: si se apaga APSV o Mil Aulas, su columna desaparece y el contenido recupera el ancho. Sin campañas laterales, la portada vuelve al diseño de una columna.
- **Hero.** Para que JJSS quede entre lo primero visible, la altura mínima del hero bajó de `min(64svh, 38rem)` a `min(56svh, 34rem)` y el margen superior móvil de 4 rem a 3 rem. Textos y botones no cambian. JJSS entra en la primera pantalla desde 320 × 568 hasta 1920 × 1080 (prueba E2E).
- **Viajar por Argentina.** La columna de Economía va a la derecha, del lado de la leyenda (el más liviano); con ella la leyenda pasa a una columna y el mapa se sigue dibujando a su tamaño máximo (36 rem de alto), sin achicarse. Por debajo de 1280 px el anuncio no entra al costado sin reducir el mapa, así que va después de la tarjeta.
- **Sin adornos.** Los anuncios siguen sin títulos, bordes, fondos, tarjetas, descripciones ni botones añadidos. Ninguna creatividad se estira por encima de su tamaño natural.

## Vigencia

El pedido indica **octubre** sin fecha de inicio ni de fin. No se inventó un vencimiento ni se programó una baja automática: cada campaña se apaga con `activa: false` en `CAMPANAS` y una nueva build. **Pendiente de confirmación comercial:** fechas exactas de inicio y fin, y URLs de destino (siguen sin enlace, como en PR #21).

## Bloqueadores de anuncios

Las rutas (`/publicidad/…`), el `aside aria-label="Publicidad"` y los recursos se conservan. Cuando una imagen falla o un filtro oculta el bloque, el navegador retira la ranura y los márgenes de su contenedor. Las columnas laterales del Home y del mapa recuperan el ancho disponible. No se reintenta la descarga ni se usan rutas alternativas. Las imágenes pendientes conservan su reserva hasta que hay un fallo confirmado.

## Pruebas

- `tests/publicidad.test.mjs`: cada campaña en su ranura contratada y con su ancho natural, una ranura por campaña, inventario coherente, ubicaciones viejas vacías, sin campos de fecha inventados, Escapadas sin «Antes de descargar», columnas laterales condicionadas y sin `fixed`.
- `tests/e2e/publicidad.spec.ts`: además de las pruebas de PR #21 (sin adornos, proporción, `object-contain`, animación de los cinco GIF, movimiento reducido, CLS con imágenes demoradas, sin JavaScript a 320 px), ahora recorre 320 × 568, 375 × 667, 393 × 852, 412 × 915, 768 × 1024, 1024 × 768, 1366 × 768 y 1920 × 1080 (más Pixel 7 e iPhone 13/WebKit) y verifica en cada una: ubicación de cada creatividad, tamaño (APSV 200 × 200, Economía 250 × 250, Mil Aulas 300 de ancho en escritorio), centrado en el flujo, `sticky` solo en escritorio y debajo del encabezado, que APSV no invada el pie, que el mapa no se achique, que ningún anuncio tape ni sea tapado por enlaces o controles al recorrer toda la página, y sin desborde horizontal. También: cada campaña aparece una sola vez en el sitio y el sitio funciona con un bloqueador.
- `scripts/publicidad/auditar-pages.mjs`: en el artefacto de Cloudflare Pages, cada campaña aparece una sola vez y solo en su página (Qué hacer cuenta sus variantes por filtro como la misma página), y Santa Fe y Seguridad no tienen campañas.

## Corrección incluida fuera de la publicidad

A 320 px, la tarjeta del mapa de `/provincias` desbordaba 44 px en horizontal (también en producción al 27/10/2026): la grilla de una columna tomaba el ancho mínimo del texto de la leyenda. Se fijó la columna a `minmax(0, 1fr)` en la tarjeta y en la lista. Como Economía va en esa página, sin esta corrección no se cumplía «sin scroll horizontal».

## Lo que no cambia

Sin cambios en Supabase (cliente, migraciones, configuración, tipos), importadores, sistema editorial, fuentes, documentos PDF, contenidos de `content/`, GA4, consentimiento, DNS, Cloudflare ni Vercel. El diff toca solo: `lib/publicidad.ts`, `components/HomeContent.tsx`, `components/ViajeArgentina.tsx`, `app/escapadas/page.tsx`, `docs/pr21/inventario.json` (solo el campo `ubicacion`), `docs/pr21/README.md` (nota de reemplazo), `scripts/publicidad/auditar-pages.mjs`, las pruebas de publicidad y esta carpeta.

## Verificación local (27/10/2026)

| Control | Resultado |
| --- | --- |
| Lint / TypeScript | Correctos, sin advertencias |
| `npm run validate` | Correcto |
| Pruebas unitarias | 182 aprobadas, 0 fallos |
| Build Next | Correcta |
| `editorial:audit-next` / `audit:seo` | 0 errores / 108 páginas, 0 errores |
| Pages `preview`, `production-audit`, `consent-test` + `scripts/pages/audit.mjs` | 108 páginas canónicas por artefacto, 0 errores |
| `scripts/publicidad/auditar-pages.mjs` en los tres artefactos | 6 campañas, 11 recursos con hash correcto, cada campaña una sola vez y solo en su página |
| E2E completos de Next, con iPhone/WebKit | 173 aprobados, 9 omisiones previstas por dispositivo, 0 fallos |
| E2E de Pages (`test:pages`, con iPhone/WebKit) | 120 aprobados, 2 omisiones de Workers que no aplican a la exportación estática, 0 fallos |
| CLS de publicidad con imágenes demoradas | 0 en las cuatro páginas con campañas (Chrome escritorio, Pixel 7, WebKit) |

En esta máquina, los puertos habituales de `test:pages` (4401–4410) estaban ocupados por servidores de otra sesión sobre el checkout compartido. Para no tocarlos, la corrida usó los mismos specs generados por `scripts/pages/prepare-tests.mjs` y la misma configuración, cambiando solo los puertos a 4501–4510 (Wrangler desde el tooling local de este worktree). Los E2E de Next corrieron con la configuración del repositorio sin cambios.

La prueba del bloqueador espera a que la red quede ociosa antes de navegar: sin eso, WebKit informaba como error de página el prefetch RSC de `/provincias` que la propia navegación de la prueba cancelaba. No es un error visible para el usuario ni de la publicidad.

## Capturas

- `capturas/antes-*` y `capturas/despues-*`: escritorio 1440 × 900 y Pixel 7, primera pantalla de Inicio, Qué hacer, Escapadas, Viajar por Argentina, Santa Fe y Seguridad, más página completa de Inicio, Escapadas y Viajar por Argentina. Se tomaron con movimiento reducido (cuadro estático de cada GIF).
- `capturas/pantallas/`: primera pantalla de las cuatro páginas en 320 × 568, 375 × 667, 393 × 852, Android 412 (Pixel 7), tablet 768 × 1024, 1366 × 768 y 1920 × 1080, con animación normal; además, la vista de las columnas laterales de Inicio (APSV fija y Mil Aulas junto a regiones en escritorio; APSV y Mil Aulas en el flujo en móvil) y Economía en el flujo de Viajar por Argentina.
- `capturas/ajustes/`: tres capturas nuevas inspeccionadas: Home sin columnas bloqueadas a 1366 px, ampliación de Octubre Rosa a 393 px (con movimiento reducido para leer el mensaje) y entrada del Home a 320 × 568.

## Ajustes tras la auditoría visual

- **JJSS a 320 px:** solo por debajo de 361 px se reducen los espacios verticales. El banner empieza en y=504 en lugar de y=560: hay 64 px visibles al entrar, con los mismos textos y botones de al menos 44 px.
- **Octubre Rosa en móvil:** tocar la creatividad abre un diálogo con el mismo GIF a 1140 × 100, desplazable horizontalmente. Incluye cierre, Escape, foco contenido y retorno al disparador. Un eventual destino comercial se presenta como enlace separado dentro del visor. En escritorio conserva el comportamiento anterior.
- **Verificación acotada:** pruebas de bloqueo de red y CSS, imágenes demoradas, recuperación de columnas y márgenes, visor a 393/320 px y espaciado a 320 px, en Chrome y WebKit; sin repetir la batería general.

## Limitaciones

- **320 × 568:** JJSS sigue necesitando scroll para verse completo; el ajuste de espaciado mejora su presencia inicial sin reducir textos ni botones.
- **Tablet horizontal y notebooks de 1024–1279 px:** no hay columnas laterales (no entran 200 + 300 px sin comprimir el contenido); los anuncios van en el flujo como en móvil.
- **JavaScript deshabilitado o bloqueado:** se conserva el HTML del banner; la recuperación dinámica y el visor requieren JavaScript. Si se retira una ranura, no se vuelve a cargar automáticamente al desactivar el bloqueador: se recupera con una recarga normal.
- **Vigencia y URLs:** pendientes de confirmación comercial (ver «Vigencia»).
