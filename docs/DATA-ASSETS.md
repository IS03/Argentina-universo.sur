# Datos y archivos pesados (PDF, Excel)

## PDF (`public/pdf/`)

- **Se usan en la web**: la sección **Escapadas** enlaza cada guía con "Ver PDF" (`EscapadasContent.tsx` → `escapada.pdf`).
- Las rutas vienen de `public/data/escapadas.json` (campo `PDF`, ej. `/pdf/salta.pdf`).
- **Qué hacer**: dejarlos en `public/pdf/`. Si el deploy pesa mucho, comprimir los PDF (herramientas online o `ghostscript`) antes de subir; no quitarlos ni moverlos porque la app los sirve.

## Excel (fuente de datos)

- **Antes**: estaban en `public/data/excel/` (actividades, escapadas, provincias). Se desplegaban y sumaban peso sin usarse en la app.
- **Ahora**: están en **`data/excel/`** (raíz del repo, fuera de `public/`).
  - No se sirven por URL.
  - No se copian al build ni al deploy.
  - Son la **fuente** para generar los JSON: los JSON en `public/data/*.json` se generan a partir de estos Excel (con scripts que usan la librería `xlsx` en dev).
- La app solo consume `public/data/actividades.json`, `public/data/escapadas.json` y `public/data/provincias.json`.

Resumen: PDF sí van en `public/` y se usan; Excel van en `data/excel/` y no forman parte del sitio desplegado.

## Contrato de datos y fotografías (PR 01)

Los JSON son el catálogo publicado. Cada `FOTO_*` contiene la URL exacta de una
fotografía existente en `public/img/`, con su extensión y capitalización reales.
No se renombran fotografías ni se sustituyen por otras: Mendoza usa `3.jpeg` y
CABA conserva `2.jpeg`. `lib/catalog.ts` comparte la lectura de fotos y la
normalización entre servidor, inicio y listado de actividades. No hay reglas
especiales por destino ni reemplazos globales de `.png` por `.jpg` al renderizar.

Al reexportar los Excel deben conservarse esas rutas canónicas. El exportador no
está versionado en este repositorio; ejecutar `npm run validate` antes de publicar
cualquier exportación. Los Excel históricos se preservan sin modificar en este PR.

El hero usa las nueve fotos existentes (`1.jpg` a `9.jpg`), declaradas en
`lib/home-images.ts`. Para incorporar otra foto, añadir primero el archivo y luego
su referencia explícita; CI comprueba también las referencias literales de assets
en `app/`, `components/` y `lib/`. Las referencias dinámicas construidas a partir
de variables deben incorporarse al catálogo o a una lista explícita comprobable.

## Clasificación regional

Se mantiene el vocabulario de los seis filtros existentes. Es una clasificación
turística editorial, no una división política ni una afirmación de que todas las
regionalizaciones oficiales son iguales. La tabla de las 24 jurisdicciones se
centraliza en `REGION_POR_PROVINCIA` y CI exige que cada provincia coincida con ella.

| Filtro | Jurisdicciones |
| --- | --- |
| Buenos Aires | Provincia de Buenos Aires y Ciudad Autónoma de Buenos Aires |
| Centro | Córdoba |
| Cuyo | Mendoza, San Juan y San Luis |
| Litoral | Chaco, Corrientes, Entre Ríos, Formosa, Misiones y Santa Fe |
| Norte | Catamarca, Jujuy, La Rioja, Salta, Santiago del Estero y Tucumán |
| Patagonia | Chubut, La Pampa, Neuquén, Río Negro, Santa Cruz y Tierra del Fuego |

La Pampa se incluye en Patagonia: la Secretaría de Turismo nacional incluye
destinos pampeanos como La Adela en sus
[escapadas en la Patagonia](https://www.argentina.gob.ar/jefatura/turismo/escapadas-en-la-patagonia-0).
San Luis pasa de Centro a Cuyo, en consonancia con su
[presentación oficial provincial](https://www.argentina.gob.ar/sanluis).
Se conserva La Rioja en Norte, como en el catálogo existente. La categoría Centro
conserva su nombre público y agrupa Córdoba. El esquema general de seis regiones
puede consultarse en [Visit Argentina](https://argentina.travel/sobre-argentina).
Las escapadas de La Pampa y San Luis usan la misma región que sus provincias.
En una escapada de varias provincias se permite una región perteneciente a alguna
de ellas; la fuente actual identifica Talampaya e Ischigualasto con La Rioja y se
preserva ese contenido en este PR.

## Compatibilidad de URLs

Los slugs publicados se preservan, incluido `catarmaca`. Se corrige el `SLUG` de
las tres actividades de Catamarca para relacionarlas con su provincia. El filtro
`/actividades?provincia=catamarca` continúa funcionando como alias de `catarmaca`.
`/provincias/catamarca` redirige permanentemente (308) a
`/provincias/catarmaca`, sin eliminar la URL anterior. Los slugs de las 72 páginas
de actividades, el resto de provincias y las rutas de los PDF no cambian.

## Agenda de Santa Fe

Los 22 registros originales se conservan sin alterar sus fechas ni contenido.
`Inicio` y `Fin` se interpretan con el offset argentino `-03:00`, sin depender de
la zona horaria del servidor o navegador. La presentación usa
`America/Argentina/Cordoba`. Un evento está vigente si aún no terminó el minuto
indicado por `Fin`; puede estar próximo o en curso. Después pasa al archivo de
**Eventos anteriores**, accesible en la misma página. La tarjeta de la provincia
cuenta y anticipa solamente eventos vigentes.

La agenda se calcula en cada request mediante `connection()` de Next.js; no queda
congelada en el build ni depende de un redeploy. Una pestaña abierta debe recargarse
para actualizar la clasificación. Sin eventos vigentes aparece un mensaje explícito,
sin inventar fechas ni nuevos eventos. La validación admite eventos históricos,
pero rechaza fechas inválidas y `Fin` anterior a `Inicio`.

El `NaN` preexistente de oficinas se reemplaza por `null` (dato ausente). Su texto
visible sigue siendo “No disponible”; los JSON se leen sin reparaciones al vuelo.

## Controles locales y CI

Usar Node.js 22.19 o posterior (`nvm use`) y `npm ci`.

| Comando | Comprueba |
| --- | --- |
| `npm run lint` | ESLint, sin errores ni advertencias |
| `npm run typecheck` | Tipos de rutas Next.js y TypeScript sin emitir archivos |
| `npm run validate` | JSON estricto, esquemas, regiones, referencias entre catálogos, coordenadas, fechas, duplicados e imágenes/PDF existentes |
| `npm test` | Casos de regresión, incluidos datos rotos deliberadamente y límites de fechas/opacidad |
| `npm run build` | Compilación de producción |
| `npm run check` | Todos los controles anteriores en secuencia |

La validación compara nombres de archivo exactamente incluso en macOS, detecta
slugs de actividad que colisionan al normalizar acentos o mayúsculas y revisa todos
los JSON públicos. Los enlaces externos no se consultan: los controles no dependen
de terceros. La existencia de archivos no sustituye comprobar su contenido visual.

GitHub Actions ejecuta estos controles en Linux para cada PR y cada push a `main`,
con permisos de lectura y sin despliegues, migraciones ni merge automático. Para
que un fallo impida un merge manual, configurar el job `checks` como requerido en
la protección de la rama desde GitHub; el workflow por sí solo no modifica esa política.
