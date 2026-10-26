# PR21 · Publicidad directa

## Auditoría previa

- Repositorio: `IS03/Argentina-universo.sur`. Base obtenida mediante `git fetch origin`: `81548345e2c7c34080abe64eb88fb3e3cc354af6`, merge del [PR20](https://github.com/IS03/Argentina-universo.sur/pull/20), del 26/10/2026.
- Sin PR abiertos al comenzar. Checkout inicialmente separado de una rama, coincidente con `origin/main`.
- Único cambio local inicial: `?? publicidad/`, con los seis originales y `.DS_Store` (ignorado). No había cambios de código que preservar. Se creó `codex/pr21-publicidad-directa` desde esa base.
- Se revisaron `lib/publicidad.ts`, `components/publicidad/EspacioPublicitario.tsx`, `docs/pr15/PUBLICIDAD.md`, sus contratos unitarios, las cinco páginas públicas elegidas, la ranura lateral de `TripView`, privacidad, consentimiento y los adaptadores de Pages.
- El anuncio ficticio «Negocio turístico de ejemplo» era únicamente una vista previa. Se retiró ese camino: ninguna campaña real deriva de fixtures.
- Los originales permanecen completos, ahora versionados en `publicidad/`; solo los derivados de `public/publicidad/` se sirven en la web. No hay archivos faltantes.

## Inventario y ubicaciones

Pesos exactos en bytes. El peso web es el de la imagen principal; los demás cuadros están en el desplegable. Identificación por lectura visual de todos los cuadros originales; no acredita por sí sola la identidad del contratante comercial.

| Original en `publicidad/` | Formato · dimensiones · cuadros | Peso original → principal web | Anunciante visible / campaña | Página pública y ubicación | URL |
| --- | --- | ---: | --- | --- | --- |
| `JJSS_Banners_800x600.gif` | GIF · 800 × 600 · 4 | 567.366 → 128.968 | Santa Fe Provincia · Juegos Suramericanos | `/`, entre regiones y planificación | No entregada; sin enlace |
| `PROTEC_ING_banners_Junio_2026_250x250.gif` | GIF · 250 × 250 · 3 | 49.090 → 9.918 | Santa Fe Provincia + Banco Santa Fe · protección de ingresos | `/actividades`, después del listado | No entregada; sin enlace |
| `SF-Provincia_Bnnr-Mamografia_1140x100.gif` | GIF · 1140 × 100 · 15 | 24.785 → 6.246 | Santa Fe Provincia · Ministerio de Salud · Agencia de Control del Cáncer | `/provincias/santa_fe`, después de las secciones | No entregada; sin enlace |
| `Suramericanos-APSV_200x200.gif` | GIF · 200 × 200 · 18 | 55.158 → 14.274 | APSV + Santa Fe Provincia · seguridad vial | `/seguridad`, después de los consejos y antes de enlaces relacionados | No entregada; sin enlace |
| `displays_obras hidricas_600x300 jpg.jpg` | JPEG · 600 × 300 · 1 | 210.142 → 37.660 | Santa Fe Provincia · obras hídricas | `/escapadas`, después de las guías | No entregada; sin enlace |
| `displays_rosario_mil-aulas_300x600.gif` | GIF · 300 × 600 · 2 | 117.019 → 16.204 | Santa Fe Provincia · Programa 1000 aulas | `/escapadas`, después de las guías, junto a obras hídricas en escritorio | No entregada; sin enlace |

Contenido visible:

- **Juegos:** «3,5 millones de gracias», agradecimiento a atletas, voluntarios, familias, entrenadores, profesores/equipos, público, sponsors e hinchas; logotipos de XIII Juegos Suramericanos Santa Fe 2026, ODESUR y Santa Fe Provincia.
- **Ingresos:** plan para desendeudarse sin comprometer ingresos; «Consultá cómo ordenar tus deudas»; recuperar tranquilidad y seguir progresando; marcas de Provincia y Banco Santa Fe.
- **Mamografía:** «Es hora», «Es ahora», «Si tenés más de 40, hacete una mamografía hoy»; gratuidad en salud pública y detección del cáncer de mama; firmas institucionales. Es texto de la creatividad del anunciante.
- **APSV:** «Te vamos a hinchar», «Hasta que lo uses», «Usá el casco», con logotipos de APSV, Juegos, ODESUR y Provincia.
- **Obras:** «En Santa Fe nos adelantamos haciendo. 300 obras hídricas en marcha», fotografía de obra, «Obras que sí» y Provincia.
- **Aulas:** «124 aulas nuevas en Rosario» y «Sí a más oportunidades para enseñar y aprender», Programa 1000 aulas, «Obras que sí» y Provincia.

[inventario.json](inventario.json) registra hashes SHA-256 de cada original y derivado, dimensiones, pesos, textos alternativos e índices exactos de cuadros. No se dedujeron URLs de marcas, nombres de archivo ni sitios institucionales. No se entregaron fechas de inicio/fin ni el nombre contractual del anunciante; no hay vencimientos automáticos. El titular deberá confirmar destinos y vigencia, especialmente de las campañas vinculadas a eventos.

## Integración visual y técnica

Se extendió el sistema existente. Se reutilizan tres ranuras públicas de PR15. `escapada-lateral` permanece disponible sin campañas: las fichas de Escapadas siguen retenidas y no se usan como única ubicación. Se agregaron únicamente las ranuras de Santa Fe y Seguridad para distribuir las campañas con contexto, fuera de mapas, menús, botones y textos editoriales. Ninguna ficha aprobada ni dato turístico cambió.

Las imágenes son WebP estáticos de cuadros completos, sin recorte ni redibujo. No se conservó el bucle automático de los GIF. Los mensajes y firmas de sus cuadros estables se mantienen en «Ver secuencia de la campaña», un `details` nativo que funciona sin JavaScript. Se excluyen únicamente cuadros vacíos, transiciones y textos parciales de animación:

| Campaña | Cuadro principal (índice desde cero) | Cuadros adicionales |
| --- | ---: | --- |
| Juegos | 0 | 1, 2, 3 |
| Ingresos | 0 | 1, 2 |
| Mamografía | 9 | 2, 6, 11, 14 |
| APSV | 17 | 0, 2 |
| Obras | 0 | — |
| Aulas | 0 | 1 |

Cada campaña tiene rótulo visible «Publicidad», anunciante, borde y fondo de los tokens actuales. `width`, `height` y `aspect-ratio` reservan la proporción antes de descargar la imagen. `object-contain`, ancho fluido y techo individual conservan textos y logotipos. La banda de 1140 × 100 es muy panorámica: además de mostrarla entera, se transcribe su texto para que sea legible en móvil; no se inventó una creatividad vertical. Las campañas se adaptan a 320, 768, Pixel 7 y 1440 px. Abrir deliberadamente un desplegable expande el contenido.

Los seis principales pesan **213.270 bytes**, un **79,2 % menos** que los originales (1.023.560 bytes). Los 18 WebP, incluidas las secuencias, suman 472.444 bytes. Carga diferida nativa; no se promete que el navegador nunca adelante una descarga de cuadros ocultos. No hay dependencias nuevas, scripts de anuncios, peticiones de creatividades a terceros, panel administrativo, Supabase, píxeles, almacenamiento ni medición publicitaria nueva.

El HTML de servidor y el exportado son deterministas. Los `img` locales ya optimizados funcionan sin `/_next/image` ni funciones de servidor en Pages. GA4, Consent Mode y sus controles conservan su implementación; `/privacidad` explica la publicidad local y distingue la medición general existente de enlaces externos, sujeta al consentimiento.

## Activar, desactivar, enlazar o sustituir

Editar únicamente la entrada de `CAMPANAS` en [lib/publicidad.ts](../../lib/publicidad.ts):

1. **Desactivar:** `activa: false`. **Reactivar:** `activa: true`. Reconstruir para actualizar el HTML. Si una ranura queda vacía, desaparece sin dejar un hueco.
2. **Destino confirmado:** agregar `url: "https://destino-confirmado/..."`. Ausente, vacío o inválido muestra la creatividad sin enlace. Los enlaces válidos abren otra pestaña con `rel="sponsored noopener noreferrer"`. No agregar URLs de ejemplo a campañas reales.
3. **Ubicación:** cambiar `ubicacion` por un ID de `ESPACIOS` que esté montado en una página pública. El ancho máximo se regula con `anchoMaximo`; nunca usar un recorte para adaptarlo.
4. **Sustituir:** conservar el original anterior, incorporar el archivo entregado a `publicidad/`, actualizar `original`, `imagen` y, si corresponde, `secuencia` con dimensiones reales, `alt`, índices de cuadros y rutas nuevas en `/publicidad/*.webp`. Usar nombres nuevos para evitar cachés de creatividades antiguas. Mantener mensajes y marcas completos. Eliminar la secuencia de la configuración si la nueva creatividad es estática. Retirar de `public/publicidad/` los derivados anteriores que ya no estén declarados; los originales de `publicidad/` se conservan. La auditoría de Pages comprueba que solo se exporten los derivados declarados.
5. Regenerar y verificar:

   ```bash
   node --experimental-strip-types scripts/publicidad/optimizar.mjs
   npm run lint
   npm run typecheck
   npm test
   npm run build
   # Pages solo copia entradas versionadas; agregar los nuevos derivados antes de compilar.
   git add public/publicidad lib/publicidad.ts docs/pr21/inventario.json
   npm run build:pages
   node --experimental-strip-types scripts/publicidad/auditar-pages.mjs preview
   npm run test:e2e -- publicidad.spec.ts
   ```

El optimizador genera únicamente los derivados declarados, sin sobrescribir originales. Conserva sus dimensiones, elimina metadatos de edición de los recursos web y regenera el inventario. Antes de entregar otra campaña, revisar también sus fechas, autorización, textos y destino confirmado.

## Verificación y evidencias

Verificación local con Node 22.19.0 y Google Chrome, 26/10/2026:

| Control | Resultado |
| --- | --- |
| `npm run lint` | Sin errores ni advertencias |
| `npm run typecheck` | Correcto |
| `npm run validate` | Correcto: catálogos, medios, contratos y aislamiento editorial |
| `npm test` | 166 aprobadas, 0 fallos |
| `npm run build` | Correcto |
| `npm run editorial:audit-next` | 0 errores; 24 fichas retenidas, sin filtraciones en HTML/RSC/JS públicos |
| `npm run audit:seo` | 108 páginas, 0 errores |
| `npm run build:pages` | Preview correcto; incluye los 18 recursos locales |
| `node --experimental-strip-types scripts/pages/build.mjs --production-audit` | Exportación local completa correcta, sin desplegar |
| Auditoría SEO/editorial de ambos artefactos Pages | 108 canonicals en cada uno, 0 errores |
| `scripts/publicidad/auditar-pages.mjs preview` y `production-audit` | 6 campañas / 18 recursos, hashes intactos, sin originales en el artefacto |
| `npm run editorial:audit-work` | 0 errores; se conservan los dos únicos destinos autorizados |
| Suite E2E completa de Next (`--workers=3`) | 155 aprobadas, 9 omisiones previstas por dispositivo, 0 fallos |
| E2E de Pages: `publicidad`, `destinations`, `legacy`, proyectos `static-escritorio` y `static-movil` | 62 aprobadas, 2 omisiones de Workers (no aplican a exportación), 0 fallos |

Los nuevos E2E de publicidad pasan en ambos formatos: los seis principales y sus secuencias responden con imágenes reales, proporción correcta y sin desbordamiento a 320, 768, 1440 px y Pixel 7 (393 px CSS). Comprueban ausencia de errores de hidratación, HTML sin JavaScript y enlaces según la configuración. Con las imágenes publicitarias demoradas, sus dimensiones antes/después coinciden y se observó **CLS 0** en las cinco páginas, tanto en escritorio como móvil. Es una medición local reproducible, no una promesa sobre todas las conexiones y dispositivos.

La suite completa conserva las regresiones existentes de GA4: aceptar, rechazar, revocar y sincronizar decisiones, sin cargas antes del consentimiento. No se cambió código de analítica. Las fotografías, textos y funciones de los dos destinos aprobados se verificaron también en Pages.

Primera ejecución adicional de compatibilidad contra Preview: 60 aprobadas, 2 omisiones y 2 fallos del contrato histórico que exige un sitemap en `robots.txt` de producción. Preview lo bloquea expresamente. Se repitió la suite completa contra el modo `production-audit`, que es su entorno correcto: 62 aprobadas, sin fallos. No se alteraron ni SEO ni esas pruebas para ocultar el desajuste.

La exportación completa mantiene los **10 PDF históricos mayores al límite de 25 MiB** que ya identifica el constructor. No se modificaron sus archivos ni sus enlaces. El Preview usa la política de PDF existente; no se realizó una carga ni despliegue a producción.

La CI incorpora una comprobación del artefacto Pages: los 18 recursos deben conservar sus hashes y aparecer en el HTML de sus páginas públicas. [Resultados estructurados](resultados/resumen.json), [E2E Next y CLS](resultados/e2e-next.json), [E2E Pages y CLS](resultados/e2e-pages.json).

### Capturas reales

Capturadas por Playwright sobre la build de Next, con la secuencia cerrada y el banner en contexto. Se revisaron visualmente los seis anuncios, marcas, menús, rótulos y el apilado móvil. Las pruebas de Pages capturan además el mismo recorrido en sus artefactos locales.

| Página / campañas | Escritorio 1440 px | Pixel 7 | Mínimo 320 px |
| --- | --- | --- | --- |
| Inicio / Juegos | [Captura](capturas/1440-inicio.jpg) | [Captura](capturas/pixel7-inicio.jpg) | [Captura](capturas/320-inicio.jpg) |
| Actividades / Ingresos | [Captura](capturas/1440-actividades.jpg) | [Captura](capturas/pixel7-actividades.jpg) | [Captura](capturas/320-actividades.jpg) |
| Escapadas / Obras + Aulas | [Captura](capturas/1440-escapadas.jpg) | [Captura](capturas/pixel7-escapadas.jpg) | [Captura](capturas/320-escapadas.jpg) |
| Santa Fe / Mamografía | [Captura](capturas/1440-provincias-santa_fe.jpg) | [Captura](capturas/pixel7-provincias-santa_fe.jpg) | [Captura](capturas/320-provincias-santa_fe.jpg) |
| Seguridad / APSV | [Captura](capturas/1440-seguridad.jpg) | [Captura](capturas/pixel7-seguridad.jpg) | [Captura](capturas/320-seguridad.jpg) |

Para regenerar capturas de documentación: `AUS_PUBLICIDAD_CAPTURAS=1 npm run test:e2e -- publicidad.spec.ts`. Sin esa variable, las capturas se escriben únicamente en la salida de pruebas y no modifican la documentación versionada. Las secuencias son desplegables normales; no hay reproducción automática ni overlays.
