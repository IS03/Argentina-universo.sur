# PR 01 — Correcciones, integridad y controles

Fecha de verificación: 23 de octubre de 2026. Base: `3c5e1b0`.

## Resultado

Se conservan las 24 jurisdicciones, 72 actividades, 23 escapadas, las fotografías,
los PDF y los 22 registros históricos de la agenda. No se rediseña la portada ni
se incorpora Supabase. No se cambia ningún slug de página publicado. Los cambios
de rutas en los campos FOTO corrigen referencias inválidas y conservan los archivos.

## Verificación automatizada

| Control | Resultado |
| --- | --- |
| `npm ci` con lockfile | Correcto, sin dependencias nuevas |
| `npm run lint` | Sin errores ni advertencias; no se desactivan reglas |
| `npm run typecheck` | Tipos de rutas y TypeScript correctos |
| `npm run validate` | 24 provincias, 72 actividades, 23 escapadas, 22 eventos y 323 referencias únicas a assets |
| `npm test` | 13 pruebas correctas, incluidos datos rotos deliberadamente |
| `TZ=Pacific/Honolulu npm test` | Las mismas 13 pruebas correctas con otra zona del host |
| `npm run build` | Build de producción correcto; agenda y preview de Santa Fe evaluados por request |
| `git diff --check` | Sin problemas de espacios |

Las regresiones cubren imágenes/PDF inexistentes, capitalización de archivos,
JSON inválido (`NaN`), duplicados de slugs e IDs, relaciones entre catálogos,
regiones ausentes/inconsistentes, coordenadas, fechas imposibles o invertidas,
vencimiento al finalizar el minuto de `Fin`, conservación del archivo y opacidad.

Se compararon los JSON contra la base para comprobar cantidad, orden, textos,
slugs de páginas y rutas PDF. Solo cambian referencias a fotos, regiones y el
slug de relación de las actividades de Catamarca. El archivo de eventos no cambia.
No se modifica ningún archivo binario de fotografías, PDF o Excel.

## Navegador

Pruebas con Playwright sobre `next start` (build de producción), usando Chromium
y dos contextos: escritorio 1440 × 900 e iPhone 13 emulado 390 × 844. El navegador
usa `Pacific/Honolulu` para comprobar que las fechas de la agenda sigan siendo las
de Argentina. La emulación móvil no equivale a una prueba en un iPhone físico/Safari.

| Flujo | Verificación |
| --- | --- |
| Inicio | Fotos cargadas, provincias destacadas y CTA; la opacidad baja al hacer scroll |
| Menú móvil | Abre y cierra |
| Provincias | Patagonia contiene seis jurisdicciones incluida La Pampa; Cuyo contiene tres incluido San Luis |
| Catamarca | El filtro antiguo `?provincia=catamarca` muestra sus tres actividades; alias de provincia devuelve 308 a la URL existente |
| Actividad de Mendoza | La tercera imagen `3.jpeg` carga y se ve en el carrusel |
| Agenda Santa Fe | Estado sin próximos eventos; los 22 anteriores se despliegan; lista y calendario funcionan |
| Preview de Santa Fe | No anticipa eventos vencidos; enlaza al archivo |
| Escapadas | La Pampa aparece al filtrar Patagonia y su PDF responde 200 con tipo `application/pdf` |
| Consola y red local | Sin errores de JavaScript ni respuestas HTTP fallidas en ambos contextos |
| Ciclo del hero | Nueve imágenes durante un ciclo completo de 55 segundos, sin solicitudes fallidas |

Se inspeccionaron capturas de los flujos en escritorio y móvil. Esta verificación
de navegador es local; el workflow de este PR ejecuta lint, tipos, integridad,
pruebas de regresión y build. Automatizar E2E en CI puede hacerse en un PR posterior.
El registro de red incluye cancelaciones `ERR_ABORTED` de prefetch RSC al cambiar
de página; no hubo errores HTTP ni recursos de las vistas fallidos.

## Problemas preexistentes encontrados y tratamiento

- Lint fallaba con **16 errores y 9 advertencias**: usos de `any`, estado derivado
  dentro de efectos, un hook condicional en el carrusel, dependencias omitidas y
  variables sin uso. Se corrigen con tipos compartidos, cálculo derivado directo,
  hooks incondicionales y limpieza de efectos. No se rebaja la configuración.
- TypeScript y build ya pasaban; el build advertía sobre un lockfile ajeno al
  proyecto. Se fija `turbopack.root` al repositorio.
- Las fuentes de fotos tenían prefijos antiguos y extensiones `.png` incorrectas,
  incluido el JPEG de Mendoza. Ahora apuntan a archivos existentes y no requieren
  parches por destino en tres lugares distintos.
- Faltaba región tanto a la provincia como a la escapada de La Pampa. San Luis
  estaba en Centro; pasa a Cuyo junto con su escapada. Criterio completo en
  [DATA-ASSETS.md](DATA-ASSETS.md).
- Las tres actividades de Catamarca usaban un slug distinto al de su provincia.
  Se preserva la URL pública `catarmaca`, se corrige la relación y se admiten los
  enlaces con la otra variante.
- Oficinas contenía un `NaN` que impedía consumir su JSON de forma estándar.
  Se sustituye por `null`, conservando “No disponible” en pantalla.
- Las fechas dependían del huso del host. Al verificar navegador y servidor se
  encontró además un error de hidratación por espacios distintos en “a. m.” entre
  implementaciones de Intl. Se explicitan zona argentina y ciclo de 24 horas.
- La calidad 85 ya se usaba en los carruseles, pero Next.js solo permitía 75.
  Se declaran ambas calidades para eliminar las advertencias de desarrollo.

## Límites y próximos pasos

- Las pestañas abiertas actualizan la clasificación de eventos al recargarse.
- Los exportadores de Excel no están versionados; sus archivos históricos se
  mantienen. Las futuras exportaciones deben respetar el contrato de datos y pasar CI.
- Los controles no verifican disponibilidad de sitios externos ni exactitud
  editorial o geográfica de cada descripción/coordenada.
- Para bloquear merges con checks fallidos, el administrador debe marcar `checks`
  como requerido en la protección de `main`; el PR no modifica esa política.
- Siguiente PR sugerido: accesibilidad del menú móvil (foco, Escape, estado expandido),
  movimiento reducido y pruebas E2E repetibles en CI, manteniendo el diseño actual.
