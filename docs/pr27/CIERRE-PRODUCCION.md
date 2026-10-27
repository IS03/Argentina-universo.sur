# Cierre institucional y preparación de producción

Revisión del 27/10/2026. **Estado: producción bloqueada, sin merge ni despliegue autorizado.** El código conectado se valida en local contra la DB institucional real. No se certifica un Preview remoto de Cloudflare ni sus ajustes sin acceso a la cuenta.

Evidencia agregada sin datos privados: [informe de cierre](evidence/cierre.json). Se repitieron los tres builds Pages con conexión real y fallback denegado, 113 E2E aprobadas y dos omisiones previstas, SEO de 108 URLs en Preview/production-audit, seis campañas/once recursos y escaneo privado sin errores. Las E2E incluyen escritorio, Pixel 7, 320 px y WebKit iPhone; Wrangler es el emulador local real, no el CDN remoto. En el sitio público actual se verificaron diez rutas/metadatos y HEAD de los 24 PDF: todos 200; los hashes de los 24 originales locales coinciden con la matriz. Las cinco denegaciones HTTP de Supabase volvieron a pasar. No hubo cambios de código de aplicación en este cierre.

## GitHub y efecto de un merge

`main` sigue en `e4fd7ec` (merge de PR24). PR25 → main, PR26 → `codex/pr25-supabase-institucional`, PR27 → `codex/pr26-importacion-institucional`: abiertos, sin conflictos, sin auto-merge. Las comprobaciones anteriores están verdes; cualquier nuevo commit vuelve a requerir CI.

La API de GitHub responde **Branch not protected** para main y devuelve cero rulesets. La CI valida código/artefactos; no es una aprobación de publicación ni impide por sí sola que un proveedor construya en paralelo. No se cambió la protección del repositorio.

**Vercel sí presenta evidencia real de despliegue automático de main:** el último merge `e4fd7ec` tiene un deployment Production exitoso (`dpl_EbbcxcH7FNMt5Nacs6J2teDfAfoy`). `vercel.json` deshabilita estas tres ramas de PR, pero no main. Tratar cualquier merge como capaz de actualizar producción hasta verificar y pausar el disparador con el titular. `[CF-Pages-Skip]` no protege Vercel y tampoco garantiza el mensaje final de un merge/squash. No se cambió su configuración remota.

Para preparar una pausa desde el celular: abrir el proyecto Vercel **argentina-universo.sur → Settings → Build and Deployment → Ignored Build Step**; registrar el valor anterior y seleccionar **Only build preview**, verificando que los builds production se omitan antes del primer merge. Es una configuración propuesta para el titular, no aplicada aquí. No pausar el sitio servido, desconectar dominios ni borrar el proyecto. Este mecanismo no es un bloqueo de despliegues manuales que ignoren ese ajuste. [Configuración oficial del build](https://vercel.com/docs/project-configuration/project-settings). Una alternativa versionada es `git.deploymentEnabled.main=false`, pero debe estar vigente desde la primera integración y verificarse; agregarla solo al último PR no protege los merges de PR25/26.

**Cloudflare: desconocido, no supuesto.** No hay conector Cloudflare; Wrangler 4.152.0 devuelve `loggedIn:false` y el panel disponible redirige a login. La ausencia de checks de Pages en GitHub no demuestra que no exista un proyecto, hook o integración. No se modificaron variables, DNS ni dominios. Si el proyecto usa Git, main es su rama productiva y tiene activados los despliegues automáticos, fusionar puede publicar inmediatamente. [Integración Git y pausa de builds](https://developers.cloudflare.com/pages/configuration/git-integration/).

## Habilitar revisión de Cloudflare

Desde el celular se puede entrar a [Cloudflare](https://dash.cloudflare.com/), elegir la cuenta del titular y abrir **Workers & Pages → proyecto Pages**. Comunicar nombre de cuenta, Account ID, proyecto y URL de su panel, sin claves. Si no existe, informar ese hecho; no crear otro proyecto por suposición. Revisar **Build → Branch control → Edit**: rama de producción y estado de **Enable automatic production branch deployments**. Mantenerlo apagado durante la revisión; no habilitarlo todavía. Revisar también Deploy Hooks, repositorio vinculado, dominios y último deployment.

Iniciar sesión desde el teléfono no autentica este entorno de trabajo. Para habilitar aquí la inspección API, en este equipo ejecutar la CLI ya instalada:

```sh
node .artifacts/pages/tooling/node_modules/wrangler/bin/wrangler.js login
node .artifacts/pages/tooling/node_modules/wrangler/bin/wrangler.js whoami --json
```

El titular completa el login/OAuth en el navegador y verifica la cuenta elegida. No enviar tokens por chat. Después se pueden listar los proyectos y leer la configuración del proyecto identificado. Si hay varias cuentas, comprobar explícitamente el Account ID antes de cualquier escritura. Autorizar solo el proyecto institucional; no modificar otras aplicaciones ni activar facturación. Ningún login, instalación o cuenta nueva se ejecutó en esta revisión.

## Configuración preparada para el build

La [plantilla Preview](cloudflare-preview.env.example) contiene solo nombres, identidad pública y clave vacía. En el proyecto institucional verificado, **Settings → Variables and Secrets**, seleccionar **Preview** y cargar esos valores. La clave debe ser **Publishable key** del proyecto `vpbonlzixodxvbybkffv`, obtenida por el titular en Supabase → Settings → API Keys; nunca secret/service_role/PAT/contraseña de DB. No pegarla en GitHub ni publicarla en capturas o logs. No se requiere ninguna variable `NEXT_PUBLIC_SUPABASE_*`.

| Ajuste de prueba | Valor |
| --- | --- |
| Root | raíz del repositorio |
| Node | 22.19.0, según `.nvmrc` |
| Build | `npm run build:pages && node --experimental-strip-types scripts/pages/audit.mjs preview && node --experimental-strip-types scripts/publicidad/auditar-pages.mjs preview` |
| Output | `.artifacts/pages/preview` |
| Rama candidata | `codex/pr27-web-supabase-institucional`, SHA concreto revisado |
| Fuente | Supabase institucional, fallback `deny` |
| Dominio | solo Preview, sin asociar/cambiar dominios de producción |

La creación inicial de un proyecto Git puede desplegar inmediatamente: no pulsar Save and Deploy antes de comprobar cuenta, alcance de Preview, derechos y privacidad. No elegir una rama de PR como producción del sitio existente. Si se habilitan previews Git, limitar ramas explícitamente a la candidata, manteniendo producción desactivada. No crear bindings, Functions, R2 ni servicios pagos. Las variables `CF_PAGES*` son del proveedor; no falsificarlas para forzar un build productivo.

En producción, la identidad/clave publicable y `AUS_CONTENT_SOURCE=supabase`, `AUS_CONTENT_FALLBACK=deny` usarán un alcance separado. **Todavía no configurar ni activar ese alcance.** El builder actual solo ofrece preview, consent-test y production-audit; no existe un comando de release productivo aprobado. `production-audit` contiene archivos incompatibles con Pages y `consent-test` usa GA ficticio: ninguno se sube. El modo Preview tampoco sirve de producción: genera noindex, bloquea robots, omite GA4 y depende del hosting actual para los PDF. [Variables y configuración de build](https://developers.cloudflare.com/pages/configuration/build-configuration/).

## Condiciones que siguen abiertas

| Condición | Comprobación / cierre necesario |
| --- | --- |
| Cuenta y proyecto Pages | Sin acceso. Verificar titular, Account ID, plan Free, ramas, hooks, variables y dominios. |
| Preview remoto real | No existe una URL verificada en esta entrega. Ejecutar sobre el SHA revisado después de habilitar acceso y resolver las condiciones del Preview. |
| PDF | 24 originales intactos; los 24 mantienen pendientes reemplazo, backup y redirect en `docs/pr11/content-plan.json`. 23 guías + documento de seguridad; no son 24 destinos aprobados. |
| Tamaño PDF | Diez exceden los 25 MiB por archivo de Pages; detalle en el informe de cierre. No comprimir/sustituir ni retirar originales sin revisión. |
| Continuidad PDF | Preview enlaza a `www.argentinauniversosur.com/pdf/...`. Cambiar ese mismo dominio a Pages sin resolver las rutas rompería la continuidad. Antes del corte: reemplazos exactos aprobados + backup restaurable por hash + redirects revisados, o una alternativa de alojamiento explícitamente autorizada que conserve los enlaces. No usar El Palmar como sustituto de Entre Ríos. |
| Imágenes | Revisión de derechos pendiente; comprobar además carga, variantes, logos/textos completos y publicidad en dispositivos reales del Preview. |
| Privacidad | Aprobar la variante Cloudflare ya implementada en `app/privacidad/page.tsx`, manteniendo publicidad directa, GA4/consentimiento y proveedores reales. El delta histórico de PR11 que decía «sin publicidad» quedó superado por PR21; no copiar esa afirmación. |
| Rutas heredadas y zona | Revisar las tres reglas propuestas para query/alias y apex→www, capacidad, orden, sintaxis y ausencia de bucles en la zona autorizada. La prueba local es un modelo, no prueba del motor remoto. No cambiar DNS aquí. |
| Release productivo | Implementar y revisar el modo de release solo al cerrar los bloqueos; verificar GA4 real con consentimiento y hostname oficial. El informe actual sigue `deploymentAuthorized:false`. |
| Corte y rollback | Capturar configuración anterior y deployment vigente, completar Preview/CDN/TLS/pruebas y obtener autorización del artefacto exacto antes de publicar. |

Los PDF sobredimensionados son bariloche, caba, entrerios, formosa, neuquen, salta, sanluis, santiago, talampaya y ushuaia. [Límites actuales de Pages](https://developers.cloudflare.com/pages/platform/limits/). No se activa un plan pago para resolverlos.

## Integración ordenada, después de la autorización

1. Antes de **cualquier** merge, verificar y pausar los despliegues automáticos de producción tanto de Vercel como del eventual Pages. Registrar los ajustes anteriores. No asumir que GitHub CI o los commits Skip los bloquean.
2. Revisar PR25 y sus checks sobre el SHA final. Fusionar con **Create a merge commit**, sin borrar la rama todavía. No usar squash/rebase en esta pila: eliminarían la relación de ancestros que permite una transición simple de bases.
3. PR26 → Edit junto a la base → cambiar a **main** tras integrar PR25. Revisar que Files changed muestre solo su importación, comprobar el diff y esperar los checks del nuevo contexto. Fusionar mediante merge commit cuando esté autorizado.
4. Repetir con PR27 → main tras integrar PR26. Confirmar que el diff contenga solo la conexión y este cierre, y volver a validar.
5. Si se elige squash pese a lo anterior, rebasar PR26/27 sobre los nuevos commits, con backup de ramas y CI nuevo antes de continuar; no resolverlo con un merge ciego. No retargetear anticipadamente los PRs actuales: hoy las bases correctas son sus prerequisitos abiertos.
6. No volver a ejecutar el bootstrap ni resetear Supabase al fusionar: las ocho migraciones y los dos recibos ya existen. Verificar historial/identidad y aplicar solo futuras migraciones nuevas revisadas. No volver a importar con IDs o journals nuevos.

En el celular, GitHub web permite revisar Files changed/checks y usar **Edit** para cambiar la base. El merge queda pendiente de autorización; ninguna de esas acciones se ejecutó en esta revisión.

## Verificación del Preview y del corte

Registrar cuenta/proyecto, SHA Git, deployment ID/URL, fecha UTC, hash de publicación `a06a9ee8beb348cb8116202756d26f87229bc0feee6529dbb455715c0963c841`, y recibos de importación. El log debe indicar `source:supabase`, nueve catálogos y dos fichas; un build con fallback no acredita conexión.

En una URL real de Preview: 200 en inicio, actividades, Santa Fe, seguridad, escapadas, privacidad y las dos fichas; navegación sin JS cuando corresponda; cinco GIF animados y sus alternativas reduced-motion, JPEG estático, seis campañas y ninguna decoración adicional; imágenes/fuentes/PDF sin fallos; 320 px, Pixel 7, iPhone/WebKit y escritorio sin overflow/hidratación/CLS. Verificar las 108 canonicals/sitemap, redirects de fotos/Catamarca y noindex/GA4 apagado del Preview. No interpretar pruebas locales como latencia/CDN/TLS remoto.

Escanear HTML, RSC, JS, JSON y el directorio exacto de upload con las agujas privadas locales, sin subir snapshot o logs de investigación. Revisar 404 de borradores, ausencia de consultas/SDK/claves Supabase en navegador, cinco denegaciones HTTP remotas y RLS. Tras autorizar producción: repetir sobre el hostname oficial; robots/indexación y GA4 requieren el comportamiento productivo aprobado. Aceptar/rechazar/revocar consentimiento sin duplicar medición. Comprobar todos los PDF, SSL, apex/www y rutas de legado en el proveedor real.

## Rollback y cuenta personal

Antes del corte registrar último deployment productivo bueno y respaldos verificables. Si Pages ya tuviera producción, **Deployments → All deployments → ⋯ del deployment anterior → Rollback to this deployment** revierte a una producción exitosa; un Preview no es objetivo de rollback. Si es el primer traslado desde Vercel, no hay todavía una producción Pages anterior: mantener Vercel y restaurar el DNS/configuración registrada mediante autorización del corte. [Rollback Pages](https://developers.cloudflare.com/pages/configuration/rollbacks/).

Ante fallo, pausar nuevas publicaciones, volver al deployment/hosting registrado y verificar rutas/PDF/SEO/consentimiento. Alternativamente, compilar el lector anterior con `AUS_CONTENT_SOURCE=static` requiere otro despliegue autorizado: cambiar la variable no modifica el HTML ya servido. No resetear/borrar la DB ni desimportar staging para revertir la web.

El cliente fija el proyecto institucional; Vercel solo declara GA4 y cero variables Supabase. No hay dependencia de Supabase IS03 en código, perfil de build o consultas. Cloudflare permanece pendiente de inspección de variables, por falta de acceso. El conector **Supabase → IS03** puede desvincularse para esta aplicación conservando **Supabase → Argentinauniversosur**; no eliminar proyectos ni credenciales que usen otras apps. No existió una DB personal de Argentina Universo Sur en la arquitectura auditada: el origen importado fue Sheets/archivos.

## Qué puede resolver el titular desde el celular

- Identificar cuenta y proyecto Pages, abrir Branch control y comprobar/pausar producción; revisar Deploy Hooks y dominios. No crear ni desplegar un proyecto por ensayo.
- Leer/autorizar la variante de privacidad, los derechos y cada decisión pendiente de PDF/backup/redirect; una aprobación debe referir al contenido y respaldo concreto, no inventarse por marcar una casilla.
- Revisar PR25/26/27 y CI, y ajustar bases después de cada merge autorizado. Mantener merges pendientes ahora.
- Cargar variables **Preview** en el proyecto identificado, obteniendo la clave publicable institucional desde Supabase sin compartirla en chat/capturas. Configurar variables no equivale a autorización de despliegue.
- Abrir la futura URL real de Preview, revisar páginas y PDF en su teléfono y autorizar después el corte exacto.

Requieren el entorno de trabajo o acceso técnico habilitado: OAuth de Wrangler en este equipo, builds/escaneos completos, pruebas automatizadas remotas, backup/restauración por hashes, cambios de reglas y preparación del release productivo. La falta de acceso Cloudflare no se sustituye por una suposición.
