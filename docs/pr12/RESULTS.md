# Pruebas y evidencias

Ejecutadas localmente el 2026-10-24/25 (tercera corrida, tras el rediseño de avisos operativos) sobre la rama `codex/pr12-escapadas-html` (base `main` `26f7ffb`), Node 22.19.0. Ninguna ficha está aprobada: todas las cifras corresponden a **cero publicaciones**.

| Control | Comando | Resultado |
| --- | --- | --- |
| Lint | `npm run lint` | 0 errores, 0 advertencias |
| TypeScript y rutas | `npm run typecheck` | OK |
| Datos, Supabase, Pages y editorial | `npm run validate` | 23 guías, 1 documento de seguridad aparte, 4 borradores, 0 publicables, 24 PDF intactos, 0 redirects |
| Unitarias | `npm test` | 93/93 |
| Build Next (Vercel) | `npm run build` | OK; `/escapadas/[slug]` sin parámetros. Con `AUS_BUILD_DATE=2026-10-23` (anterior a las fechas editoriales) falla, como se espera |
| Seguridad editorial del build Next | `npm run editorial:audit-next` | 0 hallazgos; 4 fichas retenidas; 132 HTML prerenderizados y 23 JS de cliente escaneados |
| SEO | `npm run audit:seo` | 106 URLs, 0 errores |
| E2E escritorio y móvil | `npm run test:e2e` | 109 aprobadas, 9 omitidas por viewport (`solo móvil`/`solo escritorio`) |
| Pages Preview | `npm run build:pages` + `audit.mjs preview` | 106 páginas canónicas, 0 errores; auditoría editorial aprobada |
| Pages production-audit | `--production-audit` + `audit.mjs production-audit` | 106 páginas, 0 errores |
| Pages consent-test | `--consent-test` + `audit.mjs consent-test` | 106 páginas, 0 errores |
| Navegador sobre los cinco servidores locales (incluye Wrangler) | `npm run test:pages` | 70 aprobadas, 2 omitidas por viewport. En un primer intento fallaron 8 pruebas con `ECONNREFUSED 127.0.0.1:4410`: un proceso Wrangler local de la corrida anterior seguía ocupando el socket. Se cerró y la repetición pasó completa |
| Enlaces PDF de producción y rutas del Preview | `npm run editorial:links` | 24/24 PDF con `HEAD` 200, `application/pdf` y `content-length` igual al inventario; 4/4 borradores con 404 en el Preview publicado; 0 bytes descargados |

[pdf-link-check.json](pdf-link-check.json) guarda la respuesta de cada `HEAD`. Es una comprobación manual con red: no forma parte del CI para no consultar producción en cada push.

## Barreras contra una publicación no autorizada

- `content/escapadas/index.ts` valida todas las fichas al compilar. Un estado `approved` sin revisión humana ligada al hash exacto, o un registro inválido, **hace fallar `next build`** en lugar de omitirse en silencio.
- `editorial:check` exige que cada JSON de `content/escapadas/` esté importado por ese índice, para que ninguna ficha eluda la barrera del build de Next.
- `editorial:audit-next` revisa los archivos que Next sirve al navegador (`.next/static` y HTML/RSC/metadatos prerenderizados). Los chunks de servidor contienen el catálogo `server-only` y no son públicos, por eso quedan fuera del alcance.
- `build:pages` (el comando configurado en Cloudflare para cualquier rama conectada) reemplaza el catálogo del clon por la proyección pública, quita la ruta de detalle si no hay fichas aprobadas y falla antes de producir el artefacto si encuentra textos, IDs, rutas o claves editoriales retenidas. Un despliegue automático de esta rama en Cloudflare queda, por eso, sin borradores.
- `vercel.json` desactiva los despliegues de esta rama en Vercel para no consumir cuota.
- Los avisos operativos (`operationalNotices`) son parte del texto retenido: la auditoría también busca su contenido en los artefactos públicos.

## Avisos operativos: Garganta del Diablo

### Fuentes y fechas

| Fuente | Fecha del comunicado | Consulta | Qué dice |
| --- | --- | --- | --- |
| [Concesionaria — página del circuito](https://iguazuargentina.com/area-cataratas/circuito-garganta/) | No muestra fecha (WordPress registra la última modificación de la página el 30/07/2026) | 2026-10-24 | «ESTADO: CERRADO», cierre preventivo por aumento del caudal del río Iguazú |
| [APN — noticia](https://www.argentina.gob.ar/noticias/parque-nacional-iguazu-abierto-todo-el-ano) | 2026-09-17 | 2026-10-24 | Pasarelas retiradas en agosto como medida preventiva; el resto del parque sigue funcionando |
| [Concesionaria — novedad](https://iguazuargentina.com/parque-nacional-iguazu-conoce-los-circuitos-disponibles-mientras-garganta-del-diablo-permanece-cerrado/) | 2026-08-03 19:45 (UTC−03:00) | 2026-10-24 | Sin fecha establecida de reapertura |

**Aviso del 11/10/2026 a las 17:00, indicado por el responsable: no se encontró.** Se buscó en la sección de novedades, la portada, horarios, preguntas frecuentes, las páginas de los circuitos y en el listado público de entradas y páginas de WordPress del sitio. No hay contenido de esa fecha sobre Garganta del Diablo, y las novedades de octubre son del 7 y del 15. No se citó ni se fechó sin verificarlo. Queda como pendiente en la ficha hasta tener su URL.

### Modelo

La descripción permanente del atractivo («se recorre habitualmente por una pasarela sobre el lecho superior del río») sigue separada de sus restricciones. Cada `operationalNotice` tiene:

- `guidance`: indicación **permanente** y atemporal para consultar el estado oficial, con enlace a `officialStatusSourceId`. Se muestra siempre.
- `observation`: registro **histórico** redactado en pasado («En la consulta del 24 de octubre de 2026, la concesionaria indicaba…»). Nunca afirma un estado presente.
- Fechas separadas:
  - en cada fuente, `publishedAt` (fecha del comunicado, si la muestra) y `checkedAt` (consulta);
  - en el aviso, `verifiedAt` (verificación editorial) y `expiresAt` (último día de build que puede incluir la observación, como máximo 14 días después de verificar);
  - la **fecha de publicación** es la `review.date` de la versión aprobada que contiene el aviso. Se deriva de la revisión y no se guarda aparte, para no fabricarla.

### Por qué es seguro en un sitio estático

- **Sin JavaScript y sin recompilar:** el HTML publicado sigue siendo cierto. La observación es pasada y muestra sus tres fechas («Registro verificado el…, publicado el…; vale como referencia hasta el…; después puede no reflejar el estado actual»). La indicación permanente apunta al estado oficial. No hay lógica en el navegador.
- **Un build posterior a `expiresAt` no falla: omite la observación** y deja la indicación permanente. Si fallara, Cloudflare seguiría sirviendo el despliegue anterior con la observación vieja. La caducidad nunca rompe la compilación.
- **Fallan:** las fechas posteriores al día del build (consulta, comunicado, verificación, revisión o actualización editorial); una aprobación más de 7 días después de verificar, antes de verificar o después de la caducidad; y las fuentes consultadas después de la verificación que sostienen o publicadas después de su consulta. Son errores de datos, no paso del tiempo.
- `AUS_BUILD_DATE=AAAA-MM-DD` fija la fecha para builds reproducibles y pruebas. Por defecto se usa la fecha UTC del build.
- `editorial:check` informa los avisos vigentes y caducados sin fallar.
- Límite conocido: si nadie vuelve a compilar, la observación sigue visible después de caducar. Por eso muestra su fecha límite y la frase de advertencia. Una recompilación periódica (por ejemplo, un deploy hook programado) evitaría eso, pero requiere configurar Cloudflare y queda fuera de este PR.

### Pruebas

Las nuevas pruebas cubren:
- revisión antigua recompilada meses después: no falla, se omite la observación y queda la indicación;
- builds antes, el mismo día y después de `expiresAt`;
- fechas futuras de revisión, verificación y consulta;
- ventanas de vigencia y de aprobación;
- formato de fecha y hora del comunicado;
- HTML sin JS antes y después de la caducidad;
- datos reales de Iguazú;
- detección de la indicación y la observación retenidas en artefactos públicos.

Solo cambió el hash de Puerto Iguazú, ahora `9432f740…`. No se fabricó ninguna revisión. CABA, El Palmar y Talampaya conservan sus hashes.

## Integración Cloudflare antigua: check `Workers Builds: argentina-universo-sur`

En el PR aparece un check fallido «Workers Builds: argentina-universo-sur» con el mensaje «Preview creation failed: This Worker does not exist on your account». Viene de una conexión Git de Cloudflare Workers con un Worker que el responsable ya eliminó; no corresponde al proyecto Pages correcto `argentina-universo-sur-preview`, cuyo check «Cloudflare Pages» aprueba. No despliega nada y no depende del código del PR.

- Este PR no recrea el Worker ni modifica `argentina-universo-sur-preview`.
- Para que el check deje de aparecer, el responsable debe quitar esa conexión Git residual (o la GitHub App de Cloudflare Workers sobre el repositorio) desde su cuenta. Es un cambio externo que no se puede resolver desde el repositorio.
- Si en el futuro se conectara un Worker o proyecto nuevo, su comando de build debe ser `npm run build:pages`: otro comando no aplicaría la exclusión de borradores.

## Validación de las tres fichas

Se volvieron a consultar las 20 URLs únicas citadas originalmente (17 referencias de las fichas nuevas y 4 de El Palmar, una de ellas compartida): 19 por HTTP y la de UNESCO desde el navegador, porque bloquea los clientes automáticos (403). Cada afirmación se cotejó con su fuente de sección. Hubo dos correcciones de fidelidad en Ischigualasto: la fuente provincial describe un «circuito principal» recorrido «con un guía autorizado» (no «tradicional» ni «del parque»), y las alternativas que menciona son las noches de luna llena y las caminatas al Cerro Morado. El hash de esa ficha cambió en consecuencia; ninguna revisión quedó invalidada porque no había ninguna.

| Ficha | Fuentes | Localidades / jurisdicciones | Mapas | Estado / permiso / revisión |
| --- | --- | --- | --- | --- |
| CABA | 6 Travel Buenos Aires, 200 | CABA (`caba`) | 1 búsqueda OSM orientativa | draft / false / null |
| Puerto Iguazú | 6 APN + 1 Misiones + 2 concesionaria, 200 | Puerto Iguazú (`misiones`) | 2: ciudad y parque | draft / false / null |
| Talampaya e Ischigualasto | 3 APN + San Juan Turismo, 200; UNESCO verificada desde el navegador | Villa Unión (`la_rioja`), San Agustín del Valle Fértil (`san_juan`) | 2: un parque por jurisdicción | draft / false / null |
| El Palmar (sin cambios) | 4 APN, 200 | — (esquema v1) | 1 | draft / autorización previa / null |

Los IDs son únicos, provienen del origen editorial de Git y se relacionan con `esc_06`, `esc_02` y `esc_13`. `masterRefs` está vacío: no se consultó el Google Sheets maestro. Los enlaces relacionados apuntan a rutas existentes del sitemap. Ninguna ficha contiene fotografías. Ninguna fuente quedó sin uso ni duplicada, y todos los `sourceIds` resuelven.

## Originales

`git diff HEAD -- public/pdf` está vacío; `validate:pages` y `editorial:check` recalculan los SHA-256 de los 24 PDF y coinciden con el inventario de PR10. No hubo despliegues, cambios de DNS, dominios, Vercel, Supabase, R2 ni servicios pagos.
