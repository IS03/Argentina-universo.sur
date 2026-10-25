# Pruebas y evidencias

Ejecutadas localmente el 2026-10-24 sobre la rama `codex/pr12-escapadas-html` (base `main` `26f7ffb`), Node 22.19.0. Ninguna ficha está aprobada: todas las cifras corresponden a **cero publicaciones**.

| Control | Comando | Resultado |
| --- | --- | --- |
| Lint | `npm run lint` | 0 errores, 0 advertencias |
| TypeScript y rutas | `npm run typecheck` | OK |
| Datos, Supabase, Pages y editorial | `npm run validate` | 23 guías, 1 documento de seguridad aparte, 4 borradores, 0 publicables, 24 PDF intactos, 0 redirects |
| Unitarias | `npm test` | 85/85 |
| Build Next (Vercel) | `npm run build` | OK; `/escapadas/[slug]` sin parámetros |
| Seguridad editorial del build Next | `npm run editorial:audit-next` | 0 hallazgos; 4 fichas retenidas; 132 HTML prerenderizados y 23 JS de cliente escaneados |
| SEO | `npm run audit:seo` | 106 URLs, 0 errores |
| E2E escritorio y móvil | `npm run test:e2e` | 109 aprobadas, 9 omitidas por viewport (`solo móvil`/`solo escritorio`) |
| Pages Preview | `npm run build:pages` + `audit.mjs preview` | 106 páginas canónicas, 0 errores; auditoría editorial aprobada |
| Pages production-audit | `--production-audit` + `audit.mjs production-audit` | 106 páginas, 0 errores |
| Pages consent-test | `--consent-test` + `audit.mjs consent-test` | 106 páginas, 0 errores |
| Navegador sobre los cinco servidores locales (incluye Wrangler) | `npm run test:pages` | 70 aprobadas, 2 omitidas por viewport |
| Enlaces PDF de producción y rutas del Preview | `npm run editorial:links` | 24/24 PDF con `HEAD` 200, `application/pdf` y `content-length` igual al inventario; 4/4 borradores con 404 en el Preview publicado; 0 bytes descargados |

[pdf-link-check.json](pdf-link-check.json) guarda la respuesta de cada `HEAD`. Es una comprobación manual con red: no forma parte del CI para no consultar producción en cada push.

## Barreras contra una publicación no autorizada

- `content/escapadas/index.ts` valida todas las fichas al compilar. Un estado `approved` sin revisión humana ligada al hash exacto, o un registro inválido, **hace fallar `next build`** en lugar de omitirse en silencio.
- `editorial:check` exige que cada JSON de `content/escapadas/` esté importado por ese índice, para que ninguna ficha eluda la barrera del build de Next.
- `editorial:audit-next` revisa los archivos que Next sirve al navegador (`.next/static` y HTML/RSC/metadatos prerenderizados). Los chunks de servidor contienen el catálogo `server-only` y no son públicos, por eso quedan fuera del alcance.
- `build:pages` (el comando configurado en Cloudflare para cualquier rama conectada) reemplaza el catálogo del clon por la proyección pública, quita la ruta de detalle si no hay fichas aprobadas y falla antes de producir el artefacto si encuentra textos, IDs, rutas o claves editoriales retenidas. Un despliegue automático de esta rama en Cloudflare queda, por eso, sin borradores.
- `vercel.json` desactiva los despliegues de esta rama en Vercel para no consumir cuota.

## Validación de las tres fichas

Se volvieron a consultar las 20 URLs únicas citadas (17 referencias de las fichas nuevas y 4 de El Palmar, una de ellas compartida): 19 por HTTP y la de UNESCO desde el navegador, porque bloquea los clientes automáticos (403). Cada afirmación se cotejó con su fuente de sección. Hubo dos correcciones de fidelidad en Ischigualasto: la fuente provincial describe un «circuito principal» recorrido «con un guía autorizado» (no «tradicional» ni «del parque»), y las alternativas que menciona son las noches de luna llena y las caminatas al Cerro Morado. El hash de esa ficha cambió en consecuencia; ninguna revisión quedó invalidada porque no había ninguna.

| Ficha | Fuentes | Localidades / jurisdicciones | Mapas | Estado / permiso / revisión |
| --- | --- | --- | --- | --- |
| CABA | 6 Travel Buenos Aires, 200 | CABA (`caba`) | 1 búsqueda OSM orientativa | draft / false / null |
| Puerto Iguazú | 5 APN + 1 Misiones, 200 | Puerto Iguazú (`misiones`) | 2: ciudad y parque | draft / false / null |
| Talampaya e Ischigualasto | 3 APN + San Juan Turismo, 200; UNESCO verificada desde el navegador | Villa Unión (`la_rioja`), San Agustín del Valle Fértil (`san_juan`) | 2: un parque por jurisdicción | draft / false / null |
| El Palmar (sin cambios) | 4 APN, 200 | — (esquema v1) | 1 | draft / autorización previa / null |

Los IDs son únicos, provienen del origen editorial de Git y se relacionan con `esc_06`, `esc_02` y `esc_13`. `masterRefs` está vacío: no se consultó el Google Sheets maestro. Los enlaces relacionados apuntan a rutas existentes del sitemap. Ninguna ficha contiene fotografías.

## Originales

`git diff HEAD -- public/pdf` está vacío; `validate:pages` y `editorial:check` recalculan los SHA-256 de los 24 PDF y coinciden con el inventario de PR10. No hubo despliegues, cambios de DNS, dominios, Vercel, Supabase, R2 ni servicios pagos.
