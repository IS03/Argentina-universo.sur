# Validación del PR19

## Contenido y permisos

La instrucción expresa del titular autorizó las cinco decisiones para cada ficha el 26/10/2026. Se verificaron los ocho hashes privados R2 y los originales/variantes antes de copiar exclusivamente las dos proyecciones autorizadas. El recibo y la declaración permanecen privados. La firma digital es inexistente y no se atribuye autenticación criptográfica al titular.

| Ficha | payload SHA-256 autorizado, sin cambios |
| --- | --- |
| Santa Fe capital | `e1aeed28652e5de80021ec37f756611c50ff72220878d3e6632c7511a571d721` |
| Alta Gracia | `6250a983aad83b6d2ae4e986e23e5850d30f6daa1a135021fdf456422b91afec` |

Los cuatro hashes por ficha y los digests adicionales de variantes están en `lib/destinos/authorized.ts` y `content/destinos/release.json`. El CI recalcula los payloads y las variantes públicas; los objetos privados de alcance/evidencia/media se verificaron localmente y no se suben para ejecutar el CI. Las ocho variantes, **352332 B**, son los mismos bytes aprobados, con dimensiones comprobadas mediante Sharp.

## Batería local

| Verificación | Resultado |
| --- | --- |
| Lint y TypeScript | Correctos, sin advertencias de lint |
| Validaciones de datos/editoriales, imágenes y PDF | Correctas; 24 Escapadas retenidas y 24 PDF originales intactos |
| Unitarias | 157 aprobadas, cero fallos; 10 nuevas de publicación/autorización/seguridad |
| Build Next + auditoría editorial | Correcto; dos destinos autorizados y 24 Escapadas retenidas |
| Auditoría SEO Next | 108 URLs, cero errores; las 106 anteriores se conservan |
| E2E Next, escritorio/móvil/consentimiento | 133 aprobadas, 9 omisiones previstas por entorno |
| Builds Pages Preview, production-audit, consent-test | Correctos; SEO de 108 URLs sin errores en cada modo |
| E2E Pages/Wrangler/consentimiento | 80 aprobadas, 2 omisiones del prototipo Workers fuera de alcance |
| Comparación de texto y mapas en DOM | Igualdad exacta con los JSON aprobados, en Next/Pages y sin JS |
| Inspección visual | 6 vistas: escritorio 1440 px, Pixel 7 y 320 px; sin desborde ni anclas rotas |
| Contraste y foco | 4 vistas, mínimo 5,05:1 en texto muestreado, 0 incumplimientos; foco sólido de 3 px |

Las pruebas negativas bloquean decisión ausente o denegada, permiso web independiente ausente, canal incorrecto, declaración/versiones distintas, cambios de texto/mapa/créditos/SEO/fuentes, bytes fotográficos alterados y rutas de Rosario o registros sintéticos. Un manifiesto modificado no puede autorizar una imagen con checksum distinto de los pins.

En GitHub Actions apareció una carrera en la prueba heredada del carrusel de portada: `img.complete` podía anticiparse a `decode/onLoad` de Next Image al adelantar el reloj simulado. Se corrigió únicamente la sincronización de la prueba, reteniendo la segunda descarga para comprobar que no avanza antes de cargar, esperando su decodificación y comprobando después el avance. Diez repeticiones entre escritorio y móvil pasaron; no se modifica el carrusel ni se añaden reintentos que oculten fallos.

La auditoría local adicional utiliza el snapshot privado del maestro: no se encontraron IDs/textos privados en los archivos públicos de Next y los tres builds Pages. La revisión R2 distingue las dos versiones autorizadas del borrador de Rosario por sus cuatro hashes; se mantienen bloqueados sus textos, rutas y variantes. Los originales JPEG de las tres fichas permanecen fuera del despliegue, incluso para las fotos aprobadas. No se incluye ninguna evidencia privada ni la autorización original en GitHub.

## Rendimiento local

Medición visual de referencia del commit `ea2da24`; los cambios posteriores ajustan nombres accesibles y saneamiento de errores, sin cambiar contenido, fotografías o composición. Chrome, tres corridas por página y perfil, caché fría. Escritorio: 20 Mbps, latencia añadida 40 ms, CPU 1×. Móvil: Pixel 7 DPR 2,625, 1,6 Mbps, latencia añadida 150 ms y CPU 4×. Medición sobre el export estático local; transferencia sin compresión HTTP de CDN. No son datos de campo ni una estimación de INP de usuarios.

| Ficha / perfil | LCP mediano | FCP mediano | CLS máximo | Transferencia mediana |
| --- | ---: | ---: | ---: | ---: |
| Santa Fe / escritorio | 156 ms | 156 ms | 0 | 457190 B |
| Alta Gracia / escritorio | 160 ms | 160 ms | 0 | 466568 B |
| Santa Fe / móvil | 1880 ms | 760 ms | 0 | 465133 B |
| Alta Gracia / móvil | 1864 ms | 756 ms | 0 | 464146 B |

La foto seleccionada en escritorio es 960w: 49734 B en Santa Fe y 58010 B en Alta Gracia. En Pixel 7 se selecciona 1280w: 87970 y 85882 B respectivamente. En 320 px con DPR 1, 320w. No hay `/_next/image` ni solicitudes externas al abrir estas páginas; los mapas y las fuentes son enlaces que requieren acción del visitante.

Next efectúa algunas comprobaciones HEAD de enlaces y cancela solicitudes con `net::ERR_ABORTED`; se cuentan como solicitudes, distinguiéndolas de errores reales de recursos o ejecución. No se modificó el Navbar global para ocultarlas. No hubo errores de página ni de recursos en las muestras, excluidas únicamente esas cancelaciones HEAD.

La referencia `ea2da24` del export Preview midió **106418892 B / 2055 archivos**, incluidos los 352332 B de fotos nuevas. Frente a la referencia PR18 (105382445 B), aumenta 1036447 B entre páginas, RSC, recursos y fotografías. Los JPEG originales, evidencias y capturas de documentación no forman parte del despliegue; los PDF continúan enlazados a sus URLs vigentes.

## Capturas de la presentación final

| Ficha | Escritorio | Móvil |
| --- | --- | --- |
| Santa Fe capital | [Ver captura](capturas/santa-fe-capital-desktop.webp) | [Ver captura](capturas/santa-fe-capital-mobile.webp) |
| Alta Gracia | [Ver captura](capturas/alta-gracia-desktop.webp) | [Ver captura](capturas/alta-gracia-mobile.webp) |

Las capturas reproducen fotografías de ElGuruCesar (CC BY-SA 4.0) y Banfield (CC BY-SA 2.5 Argentina), con los créditos completos visibles en la página y los originales enlazados en los payloads. La conversión de las capturas a WebP no altera los archivos fotográficos aprobados.

## Verificaciones remotas y límites

El PR deberá enlazar GitHub Actions y el Preview Cloudflare del commit exacto; la descripción se actualizará con su estado y la auditoría remota. Los informes detallados de pruebas, laboratorio y capturas originales PNG están en `.artifacts/pr19/`, fuera del repositorio.

Esta entrega no cambia DNS ni retira la dependencia existente de los PDF de Vercel. La compatibilidad sin JavaScript de las consultas históricas `?provincia=` conserva la dependencia de reglas de zona documentada desde PR11; el payload aprobado mantiene esos enlaces y no se cambia para resolverla en este PR. No se activan anuncios, servicios remotos ni modificaciones de consentimiento. La presentación final y el merge requieren revisión del titular.
