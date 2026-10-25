# Pruebas y evidencias

Ejecutadas localmente el 2026-10-24 (segunda corrida, tras la corrección de Puerto Iguazú) sobre la rama `codex/pr12-escapadas-html` (base `main` `26f7ffb`), Node 22.19.0. Ninguna ficha está aprobada: todas las cifras corresponden a **cero publicaciones**.

| Control | Comando | Resultado |
| --- | --- | --- |
| Lint | `npm run lint` | 0 errores, 0 advertencias |
| TypeScript y rutas | `npm run typecheck` | OK |
| Datos, Supabase, Pages y editorial | `npm run validate` | 23 guías, 1 documento de seguridad aparte, 4 borradores, 0 publicables, 24 PDF intactos, 0 redirects |
| Unitarias | `npm test` | 88/88 |
| Build Next (Vercel) | `npm run build` | OK; `/escapadas/[slug]` sin parámetros |
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

La ficha de Puerto Iguazú presentaba Garganta del Diablo como un recorrido disponible. APN informó el [17/09/2026](https://www.argentina.gob.ar/noticias/parque-nacional-iguazu-abierto-todo-el-ano) que las pasarelas de ese circuito se retiraron en agosto como medida preventiva ante crecidas. La concesionaria del Área Cataratas indicó el [03/08/2026](https://iguazuargentina.com/parque-nacional-iguazu-conoce-los-circuitos-disponibles-mientras-garganta-del-diablo-permanece-cerrado/) que no hay una fecha establecida para la reapertura. La nota de la concesionaria es de agosto: en la consulta del 2026-10-24 no se halló un comunicado oficial de octubre. La prensa del 13/10/2026 informó que el circuito seguía cerrado, pero no se usa como fuente de la ficha.

- **Descripción permanente:** el párrafo de actividades describe el atractivo («se recorre habitualmente por una pasarela») sin afirmar que esté abierto ni cerrado.
- **Condición variable:** el cierre es un `operationalNotice` con sección, fuentes y `verifiedAt: 2026-10-24`. El artículo lo muestra como «Estado verificado el…».
- **Reverificación obligatoria:** con estado `approved`, la validación exige que cada aviso se haya verificado como máximo 7 días antes de la revisión humana (`OPERATIONAL_NOTICE_MAX_AGE_DAYS`) y nunca después. Si no se cumple, fallan `next build`, `build:pages`, la proyección pública y el planificador de retirada. Además, `pendingReviews` registra la tarea de reverificar con APN antes de publicar.
- **Hashes:** solo cambió el de Puerto Iguazú (`e5f61dee…` → `eea7fc2b…`). No había revisión que invalidar y no se fabricó ninguna. CABA, El Palmar y Talampaya conservan sus hashes.

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
| Puerto Iguazú | 6 APN + 1 Misiones + 1 concesionaria, 200 | Puerto Iguazú (`misiones`) | 2: ciudad y parque | draft / false / null |
| Talampaya e Ischigualasto | 3 APN + San Juan Turismo, 200; UNESCO verificada desde el navegador | Villa Unión (`la_rioja`), San Agustín del Valle Fértil (`san_juan`) | 2: un parque por jurisdicción | draft / false / null |
| El Palmar (sin cambios) | 4 APN, 200 | — (esquema v1) | 1 | draft / autorización previa / null |

Los IDs son únicos, provienen del origen editorial de Git y se relacionan con `esc_06`, `esc_02` y `esc_13`. `masterRefs` está vacío: no se consultó el Google Sheets maestro. Los enlaces relacionados apuntan a rutas existentes del sitemap. Ninguna ficha contiene fotografías. Ninguna fuente quedó sin uso ni duplicada, y todos los `sourceIds` resuelven.

## Originales

`git diff HEAD -- public/pdf` está vacío; `validate:pages` y `editorial:check` recalculan los SHA-256 de los 24 PDF y coinciden con el inventario de PR10. No hubo despliegues, cambios de DNS, dominios, Vercel, Supabase, R2 ni servicios pagos.
