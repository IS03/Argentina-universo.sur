# PR20 — Una ficha para leer y preparar una visita

## Alcance y versión

Base: `main` tras el merge de PR19 (`3ad83002be4aca1e13b97e8bed7ed0eac8acac26`). Se trabaja en `codex/pr20-fichas-destinos`. Este PR cambia presentación e interacción de Santa Fe capital y Alta Gracia. No modifica los JSON R2, pins, permisos editoriales, fotografías, SEO, relaciones ni fuentes. Las dos páginas siguen siendo las únicas proyecciones autorizadas.

## Presentación

- Texto principal de 18 px (resumen de 19 px), interlineado de 1,85 y medida de lectura de hasta 66 caracteres. Metadatos y créditos de 15 px, etiquetas de 14 px; se conserva el sistema de colores, Geist e Instrument Serif.
- Portada con fotografía completa, su proporción y todos los créditos; no hay fotos nuevas, cambios de exposición ni recortes CSS de la imagen. Las variantes y sus bytes son los mismos.
- Índice de seis capítulos con numeración, bordes e indicador del destino del ancla mediante CSS `:target`/`:has`. No hay pastillas blancas, scrollspy, listeners de scroll ni necesidad de JavaScript. En móvil se distribuye en dos columnas. El indicador sigue el ancla elegida; no simula seguir la lectura al desplazarse manualmente.
- «Para elegir» se convierte en una sección independiente, con fondo tinta, textos aprobados y accesos directos a los tres atractivos. No se escriben resúmenes turísticos nuevos ni se infieren recorridos.
- Atractivo principal destacado y los demás como piezas editoriales de lectura abierta, con índices grandes, títulos y separadores; se reemplaza el conjunto de tarjetas compactas.
- Información práctica y ubicaciones organizadas por filas. Las citas se integran al final de los párrafos y enlazan a fuentes visibles con regreso a la primera cita.

## Lista, compartir e imprimir

`VisitPlanner` es la única isla cliente nueva. Recibe únicamente nombre, canonical y los tres nombres/IDs públicos de presentación. El artículo, mapas y fuentes se renderizan en servidor como HTML; no se envía el payload editorial completo como props del planificador.

La persona selecciona lugares con casillas nativas. Se genera texto con sus nombres exactos y enlaces al ancla pública de cada atractivo, más la ficha completa. Es una lista sin orden de visita; no calcula tiempos, rutas, distancias ni disponibilidad. No acepta notas personales.

- **Copiar lista:** usa el portapapeles mediante una acción explícita. Si el navegador lo rechaza, enfoca y selecciona el texto de solo lectura para copiarlo manualmente.
- **Compartir lista:** invoca el selector nativo del sistema cuando está disponible. La cancelación no se trata como éxito ni borra la selección. Si no existe o falla, se ofrece copiar. No hay SDK, URL de un proveedor social, petición al servidor ni servicio contratado. El destino elegido por la persona en el selector nativo queda bajo su control.
- **Compartir ficha:** comparte o copia su canonical, sin añadir parámetros de seguimiento ni guardar la selección en la URL. No se promete reconstruir automáticamente la selección al abrir el enlace; el mensaje lleva la lista explícita.
- **Imprimir ficha:** abre el diálogo del navegador; la hoja de impresión conserva contenido, fuentes, créditos y la lista elegida, oculta controles e índice y añade URLs de consulta. No genera ni aloja un PDF nuevo en el servidor.
- **Vaciar / recargar:** la selección se elimina. No se usa localStorage, sessionStorage, cookies, geolocalización ni red para guardar o compartir datos automáticamente.

Sin JavaScript el contenido completo, imágenes, fuentes e índice funcionan. Los botones de mejora permanecen deshabilitados y un aviso explica que puede imprimirse desde el menú del navegador. No hay botones que prometan una acción de red sin funcionar ni se ocultan atractivos.

## Comparativas

Las capturas ANTES corresponden al árbol de `main`/PR19 sin diferencias de aplicación respecto de `b499175`, servido desde el export estático anterior. DESPUÉS corresponde a la nueva exportación local. Mismo Chrome, fuentes cargadas, movimiento reducido y estado de consentimiento rechazado cuando el banner está presente. No son capturas de producción modificada.

| Ficha / pantalla | ANTES | DESPUÉS |
| --- | --- | --- |
| Santa Fe / 1440 × 1000 | [Ver](capturas/santa-fe-capital-desktop-before.webp) | [Ver](capturas/santa-fe-capital-desktop-after.webp) |
| Santa Fe / Pixel 7 · 412 × 839 · DPR 2,625 | [Ver](capturas/santa-fe-capital-pixel7-before.webp) | [Ver](capturas/santa-fe-capital-pixel7-after.webp) |
| Santa Fe / 320 × 800 · DPR 1 | [Ver](capturas/santa-fe-capital-320-before.webp) | [Ver](capturas/santa-fe-capital-320-after.webp) |
| Alta Gracia / 1440 × 1000 | [Ver](capturas/alta-gracia-desktop-before.webp) | [Ver](capturas/alta-gracia-desktop-after.webp) |
| Alta Gracia / Pixel 7 · 412 × 839 · DPR 2,625 | [Ver](capturas/alta-gracia-pixel7-before.webp) | [Ver](capturas/alta-gracia-pixel7-after.webp) |
| Alta Gracia / 320 × 800 · DPR 1 | [Ver](capturas/alta-gracia-320-before.webp) | [Ver](capturas/alta-gracia-320-after.webp) |

Ejemplos del planificador con dos lugares seleccionados: [Santa Fe](capturas/santa-fe-capital-plan.webp) · [Alta Gracia](capturas/alta-gracia-plan.webp).

Los archivos de documentación son capturas convertidas a WebP; no sustituyen ni modifican las fotografías turísticas aprobadas. Las capturas reproducen imágenes de ElGuruCesar (CC BY-SA 4.0) y Banfield (CC BY-SA 2.5 Argentina), con autoría, obra original, transformaciones y licencias visibles en cada ficha. `docs/` no forma parte del artefacto Pages.

Reproducción: `node scripts/pr20/capture.mjs http://127.0.0.1:4490 before` o `after`, sirviendo el export correspondiente con `scripts/pages/serve.mjs`. Los PNG y métricas quedan en `.artifacts/pr20/`, sin versionar.

## Seguridad, límites y reversión

Se conservan 108 canonicals, las 24 Escapadas retenidas, los PDF originales y sus enlaces. Rosario y los demás registros del maestro no se importan ni publican. No hay cambios de consentimiento, GA4, publicidad, DNS, Supabase o datos privados. La rama excluye únicamente su propio Preview de Vercel; el Preview se realiza en el proyecto Cloudflare existente.

El registro de decisiones y los pins de PR19 permanecen intactos. Cualquier cambio de contenido o fotografía sigue requiriendo una revisión editorial independiente; la UI de selección no altera decisiones.

Para revertir: revertir este PR y reconstruir. Las URLs, payloads y medios no cambian, por lo que no hay migración de datos, redirects ni DNS que revertir. Mantener el PR abierto hasta la revisión visual del titular.

[Pruebas y mediciones](VALIDATION.md).
