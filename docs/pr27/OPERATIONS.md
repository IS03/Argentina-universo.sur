# Activación de producción, verificación y rollback

La revisión actualizada y los pasos desde el celular están en [cierre de producción](CIERRE-PRODUCCION.md). Incluye los disparadores de Vercel, el estado desconocido de Cloudflare, las condiciones PDF y la [plantilla Preview sin credenciales](cloudflare-preview.env.example). No usar el modo Preview como producción ni retargetear las bases antes de integrar sus prerequisitos.

## Estado de entornos

- **Supabase institucional:** ocho migraciones aplicadas, staging privado completo y un snapshot de la web ya pública, comprobados por API/SQL/HTTP.
- **Prueba local conectada a la DB remota:** variables configuradas en archivo privado y builds Next/Pages ejecutados. Es el entorno no productivo autorizado; no se creó ni desplegó una Preview remota.
- **Vercel del repositorio:** auditoría de variables sin descifrar valores. Solo `NEXT_PUBLIC_GA_ID` en production y cero variables ocultas; ninguna variable Supabase. No se modificó.
- **Cloudflare alojado:** el titular identificó `argentina-universo-sur-preview`; su URL pública pasó 30 E2E, SEO y escaneo privado remotos. Sigue sin acceso autenticado para auditar Dashboard/variables/SHA; Wrangler confirmó `loggedIn:false`, el panel pide login y la Mac estaba bloqueada. No se afirma haber auditado la cuenta o DNS ni haber desplegado el candidato conectado allí. No se configuraron variables remotas ni se desplegó.
- **Supabase Dashboard/Auth:** el acceso API/SQL está autorizado y funciona; el navegador no tiene sesión de Dashboard. Las pruebas authenticated se hicieron con el rol/claims reales en PostgreSQL remoto, no con una sesión de usuario Auth por HTTP. No se crean usuarios editoriales ni se habilita login/panel público.

## Reproducir el build conectado sin mostrar valores

```sh
node --env-file=.artifacts/institucional/private/web-preview.env \
  --experimental-strip-types scripts/supabase/prepare-web-content.mjs
node --env-file=.artifacts/institucional/private/web-preview.env \
  --input-type=module -e "import{spawn}from'node:child_process';const p=spawn('npm',['run','build'],{stdio:'inherit',env:process.env});p.on('exit',code=>process.exit(code));"
node --env-file=.artifacts/institucional/private/web-preview.env \
  --experimental-strip-types scripts/pages/build.mjs
```

No ejecutar `env`, imprimir el archivo, pegar claves en argumentos o subir el perfil a CI. Ese perfil contiene únicamente la clave publicable y flags de prueba, nunca credenciales administrativas.

## Producción — requiere autorización posterior

1. Revisar y mergear manualmente PR25 → PR26 → PR27. Son PRs encadenados; retargetear cada base a main después del merge anterior. No hay merge ni auto-merge solicitado.
2. Confirmar por API ref/organización/región/estado, recibos y RLS; verificar que el snapshot activo conserve el hash autorizado. No renombrar ni crear proyectos como parte del corte.
3. Obtener acceso al entorno de build Cloudflare elegido. Revisar variables existentes por nombre y alcance; retirar/reemplazar cualquier URL/ref personal solo en el entorno autorizado. No alterar GA4, consentimiento o dominios.
4. Configurar **en servidor/build** los tres valores institucionales y `AUS_CONTENT_SOURCE=supabase`. Para producción se recomienda **`AUS_CONTENT_FALLBACK=deny`**: si la DB falla, no sustituir una publicación vigente por otra más antigua; conservar el último despliegue bueno.
5. Ejecutar el build, validadores, SEO, aislamiento privado y E2E sobre un artefacto no productivo. Revisar el informe `source: supabase`, releaseVersion y hash. No copiar claves secret/service_role/PAT al build.
6. Mantener las condiciones de entrega previas de Pages: reglas de compatibilidad y PDFs/tamaños/derechos que aún requieren aprobación no se dan por resueltas por conectar la base. No subir automáticamente un candidato marcado `deploymentAuthorized:false`.
7. **Pedir autorización del corte concreto**, con el artefacto ya revisado y su hash. Solo entonces publicar mediante el flujo autorizado de hosting. No hacer un deploy manual o promoción como efecto colateral de configurar variables.
8. Después del corte: recorrer inicio, provincias, actividades, escapadas, seguridad, privacidad y las dos fichas; comprobar canonical/sitemap, fuentes/fotos/PDF, filtros, consentimiento y ausencia de consultas Supabase/secretos en navegador. Registrar versión/hora y comprobar que una caída de DB no afecta a lo estático servido.

## Rollback

Revertir al último despliegue estático bueno mediante el hosting autorizado; o establecer `AUS_CONTENT_SOURCE=static` y compilar el lector anterior, con aprobación del despliegue. No borrar ni desimportar investigación, paquetes, buckets, usuarios o migraciones para revertir la web. Ante un error de datos privados, detener importación y preparar otra versión compensatoria revisada.

No eliminar secretos o variables de otros proyectos. No cerrar ni borrar cuentas/organizaciones.

## Desvinculación de IS03 para Supabase

No se encontró nunca una base personal de Argentina Universo Sur en las auditorías PR9/24: había otros proyectos de otras aplicaciones, que no se reutilizaron. **No hubo una migración de una DB personal**. La fuente era Google Sheets/archivos; se importó al nuevo institucional expresamente indicado por el titular.

El namespace histórico `git:IS03/Argentina-universo.sur` identifica el repositorio/IDs de origen y se conserva para no romper identidad. No es una conexión a una base ni dependencia de una organización Supabase personal.

La web/build solo usa el ref institucional y una clave publicable de ese proyecto. No depende del OAuth del conector, de una CLI personal, de IS03 en Supabase ni de una clave administrativa. Puede retirarse el acceso del conector **a la organización Supabase personal IS03** sin afectar a esta web. No eliminar su organización/proyectos ni revocar una credencial compartida que todavía usen otras aplicaciones.

Al finalizar aparecieron dos vínculos Supabase separados. La comprobación de organizaciones por cada vínculo identificó uno que expone **solo IS03** y otro que expone **solo Argentinauniversosur**. La comprobación final del proyecto/esquema se repitió seleccionando explícitamente el segundo; no se usó una conexión por defecto. Sus identificadores internos se guardan únicamente en `.artifacts/institucional/private/connections.json`, para distinguirlos sin publicarlos en GitHub.

Puede desvincularse el vínculo de **Supabase → IS03**, conservando **Supabase → Argentinauniversosur**. Esto no elimina organizaciones ni bases ni migra otra aplicación. No revocar credenciales de las aplicaciones personales ni eliminar sus proyectos. No se desvinculó nada en esta entrega.
