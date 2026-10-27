# PR27 — Web conectada al Supabase institucional durante el build

Depende de PR26 y PR25. El proyecto remoto operativo es exclusivamente `vpbonlzixodxvbybkffv`, organización `mzfanqzfjskgapsulpip`. No se modifica producción, ningún proyecto de IS03, dominio, plan o recurso multimedia existente.

## Conexión implementada y ejecutada

La lectura de prueba **real** con clave publicable recuperó la versión 1 desde Supabase: **nueve catálogos y las dos proyecciones autorizadas**. Hash canónico:

`a06a9ee8beb348cb8116202756d26f87229bc0feee6529dbb455715c0963c841`

No es una conexión simulada ni una aplicación apuntada a un proyecto personal. El entorno no productivo configurado está en `.artifacts/institucional/private/web-preview.env`, ignorado, permisos 600, sin credenciales administrativas. Los builds Next/Pages conectados se ejecutaron con fallback denegado para probar que leían realmente el proyecto institucional.

La migración `approved_web_build_release` guarda una publicación de build **de los archivos que ya eran públicos**, separada del staging. La migración `pin_legacy_web_release` limita en DB su hash al contenido histórico exacto autorizado: ni un operador con service_role puede insertar una investigación distinta bajo ese puente. No se fabricaron revisiones humanas, actores o aprobaciones; se conserva el digest de la autorización existente de PR19.

RLS deja leer solo la versión activa y permitida. No existen escrituras de navegador. Los 203 registros de catálogo y las dos proyecciones públicas son un artefacto de publicación, no nuevas entidades ni una segunda importación de las 2.242 filas privadas. `public.entries` sigue sin registros porque no se normalizó ni aprobó investigación por inferencia.

## Flujo

1. `prebuild` valida los contratos PR19/archivos aprobados, actualiza el artefacto con `prepare-web-content.mjs` y comprueba el aislamiento antes de compilar. Se actualiza antes de consumirlo para no bloquearse por un candidato generado antiguo.
2. El cliente compartido de PR9 usa solo URL institucional y clave publicable, sin sesión/cookies. Consulta `web_build_releases` activa y futuras `entries` con permiso, revisión y versión vigentes.
3. Verifica hashes de catálogos, los dos permisos históricos, payload, assets y DTOs. No consulta `editorial`, fuentes privadas ni evidencias.
4. Genera atómicamente `content/supabase/build-cache.json`, ignorado por Git. Contiene solo publicación aprobada. Los lectores existentes priorizan ese artefacto; las URLs y normalizadores se conservan.
5. Next compila y Pages copia explícitamente el artefacto validado a su workspace aislado antes de exportar. El navegador recibe HTML/JS/assets estáticos: no SDK Supabase ni consultas de DB.

No hay SDK ni clave administrativa en el navegador. La clave publicable no se imprime y no requiere `NEXT_PUBLIC_*`. Los originales de imágenes/PDF permanecen donde estaban.

## Modos y fallback

| Variable | Función |
| --- | --- |
| `AUS_CONTENT_SOURCE=static` | Fuente anterior; valor predeterminado para no cambiar producción por merge |
| `AUS_CONTENT_SOURCE=supabase` | Obtiene publicación institucional antes de compilar |
| `AUS_CONTENT_FALLBACK=allow` | Si el servicio falta/falla, borra candidato previo y usa la fuente estática |
| `AUS_CONTENT_FALLBACK=deny` | Falla el build ante indisponibilidad; conserva el despliegue anterior hasta una activación explícita |
| `SUPABASE_PROJECT_REF` | Debe ser `vpbonlzixodxvbybkffv` |
| `SUPABASE_URL` | Debe ser la URL institucional exacta |
| `SUPABASE_PUBLISHABLE_KEY` | Clave publicable del institucional; nunca secret/service_role |

Una configuración ajena/incompleta, un hash alterado, campos privados, permisos desactualizados o assets distintos **bloquean**, incluso con fallback permitido. Fallback no sirve para ocultar un fallo de integridad. Una caída de DB después de compilar no afecta al sitio estático.

Los cambios de catálogo histórico continúan sujetos a revisión de sus pins. No se utiliza el puente legado para publicar nuevas fichas.

## Nuevas fichas sin una ruta o import manual por destino

El build consulta genéricamente `public.entries` de tipo destination. RLS y `publishedCandidate` exigen `publication_permitted`, estado verified/approved y `approved_version = content_version`. La aprobación humana por versión y alcance continúa en los contratos PR9.

El cuerpo público futuro tiene exactamente `{page, assets}`. `page` cumple el DTO turístico y `assets` declara los archivos con SHA-256/tamaño; ambos deben estar incluidos en la aprobación de alcance (`body.page`, `body.assets`, además de los demás campos y `details` que exige PR9). El build valida referencias de fuentes públicas, canonical, slug, campos permitidos, créditos y bytes locales. Ningún dato se proyecta automáticamente desde investigación.

Las fichas que superan esas comprobaciones entran en `generateStaticParams`, sitemap y enlaces provinciales mediante el lector existente, sin añadir imports ni código por slug. Las auditorías SEO/editoriales y las expectativas del sitemap también leen ese artefacto aprobado, en lugar de una lista fija de dos rutas. Revalidan los hashes de los assets y rechazan cualquier ruta adicional que no figure allí. Los assets nuevos deben usar una ubicación como `/media/published/`; `/media/review/` conserva el namespace reservado de los dos permisos históricos. Un cambio de versión que invalida la aprobación no se consume. Publicar/despublicar requiere el futuro operador/panel autenticado y una compilación autorizada; este PR no habilita un panel ni permisos generales. Las dos fichas históricas mantienen sus pins exactos.

## Seguridad y pruebas

- 184 unitarias: identidad, staging, paquetes, RLS, snapshot permitido y rechazo de mutaciones.
- Pruebas del build: fuente remota con hash exacto; 503 → fallback estático; modo deny → error; candidato anterior eliminado; datos alterados nunca hacen fallback; ficha futura sintética aprobada genera ruta sin código y versiones/campos/assets inválidos se bloquean.
- Pruebas SQL remotas: anon/authenticated pueden leer solo el snapshot aprobado y continúan sin acceso a las once tablas privadas. Un claim publisher no habilita edición.
- Asesores remotos: sin ERROR/WARN. INFO: 11 tablas privadas con deny-by-default, ocho FK cuyo primer campo ya es PK único y 25 índices aún sin uso. No se cambian permisos o eliminan índices para silenciar INFO.
- Builds conectados Next y Cloudflare Pages; auditorías SEO de 108 páginas y controles editoriales sin errores. Consentimiento/GA4, destinos exactos, publicidad y mapas se prueban con E2E.
- El escaneo del snapshot privado se aplica a HTML, RSC, JavaScript y JSON de los artefactos. No se publica la investigación como prueba.

Ver [activación, verificación y rollback](OPERATIONS.md). Resultados: Next 164 aprobadas + 2 específicas de navegador sin DB; nueve omisiones por dispositivo. Pages/WRangler 111 aprobadas, dos omisiones previstas; dos E2E adicionales sobre el artefacto de fallback. Chrome escritorio, Pixel 7 y WebKit iPhone incluidos. La prueba de CLS se repitió en los tres proyectos tras corregir su carga de fuentes locales en Linux.
