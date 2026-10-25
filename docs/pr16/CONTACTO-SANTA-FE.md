# Corrección del contacto de la oficina de turismo de Santa Fe capital

## Problema

`public/santa-fe/json/oficinas_informes.json` tenía `"Correo/Web": "info@loreipsumcom"` para la
localidad «Santa Fe». Es un texto de relleno («lorem ipsum») sin punto en el dominio. Venía de la
planilla fuente `public/santa-fe/oficinas_informes.xlsx`. `OficinasSection` lo mostraba como enlace
`mailto:` porque aceptaba cualquier cadena que contuviera «@».

## Fuente verificada

- Página oficial de la Municipalidad de Santa Fe:
  https://santafeciudad.gov.ar/santafe_capital/informacion-para-turistas
- Consultada el **2026-10-25**.
- Sección: «Dirección de Turismo — Bv. Gálvez 1150 (oficinas administrativas) — Horarios: lunes a
  viernes de 7 a 15 hs.».
- Correo publicado: **turismo@santafeciudad.gov.ar**.
  - La página lo protege con la ofuscación de correos de Cloudflare (`data-cfemail`). Se descargó el
    HTML y se decodificó localmente (XOR con la clave del propio atributo). El mismo valor también
    figura en texto dentro del HTML.
- Coherencia con el registro existente: la misma página publica los teléfonos 0342-4571831 y
  4574124 y el WhatsApp 342-4063525, que son los del registro «Santa Fe».

## Cambio aplicado

- Solo cambió `Correo/Web` → `turismo@santafeciudad.gov.ar` (correo de la Dirección de Turismo
  municipal).
- Teléfonos, direcciones y horarios quedaron intactos, incluido un espacio no separable original.

## Datos no actualizados (decisión del titular)

Los horarios del registro **no coinciden** con los que la Municipalidad publicaba el 2026-10-25.
No se modificaron ni se asume cuáles están vigentes:

| Centro | Registro del sitio | Página municipal (2026-10-25) |
| --- | --- | --- |
| Terminal de ómnibus | L a V 7 a 20 hs; sáb., dom. y feriados 8 a 20 hs | L a V 7:30 a 20 hs; sáb. y dom. 8 a 20 hs |
| Peatonal San Martín | L a V 8 a 13 y 14 a 19 hs; sáb. 9 a 13 y 16 a 19 hs | L a V 8 a 13 y 15 a 21 hs; sáb. 10 a 13 hs |
| Puerto (cabecera Dique 1) | sin horario | L a V 9 a 19 hs; sáb. y dom. 13 a 20 hs |

## Barreras para que no vuelva a pasar

- `npm run santa-fe:oficinas`: exportación reproducible desde la planilla, con las correcciones
  documentadas (ver más abajo).

- `lib/contacto.ts` valida cada correo con reglas estrictas y rechaza marcadores de relleno o de
  prueba (lorem, ipsum, example, ejemplo, test, prueba…). Separa los textos con varios contactos
  («a@x.gob.ar / www.x.gob.ar», «a@x.com; b@y.com») y nunca usa la cadena completa como dirección.
- `OficinasSection` y `AgenciasSection` solo enlazan correos y webs válidos.
- `npm run validate` falla si `oficinas_informes.json` o `agencias.json` tienen un correo inválido o
  de relleno.
- Pruebas: `tests/contacto.test.mjs` (unitarias) y una E2E en `tests/e2e/pr16.spec.ts` que revisa
  todos los `mailto:` de Oficinas y Agencias.

## Efectos visibles adicionales

- Villa Ocampo y Moisés Ville tenían varios contactos en un solo campo y generaban un `mailto:`
  inválido. Ahora muestran un enlace por correo válido.
- Las webs de Esperanza, Villa Ocampo y Sauce Viejo estaban en los datos pero no se mostraban,
  porque no empezaban con `http`. Ahora aparecen como enlaces: las tres respondieron 200 el
  2026-10-25.
- Bora Bora Viajes muestra sus dos correos por separado.

## Villa Ocampo (commit posterior)

- La planilla atribuía a Villa Ocampo `turismo@reconquista.gov.ar`, que es el correo de Reconquista
  (también figura en la fila de Reconquista). Ninguna fuente oficial lo atribuye a Villa Ocampo.
- El sitio oficial de turismo de Villa Ocampo, https://www.turismovillaocampo.gob.ar/contacto.html
  (consultado el **2026-10-25**), publica **turismovocampo55@gmail.com**.
  - El sitio protege la dirección con el ocultamiento de Joomla; se reconstruyó desde el HTML.
  - En la misma página figuran la dirección «Av. San Martin y Ruta Nacional N° 11, 3580 Villa Ocampo»
    y el teléfono +549 3482 466300.
- Se publica ese correo. La web `www.turismovillaocampo.gob.ar` se mantiene.
- El teléfono del registro (`TE: 3482466209`) **no coincide** con el del sitio oficial y no se
  modificó: queda para revisión del titular.

## Teléfonos y WhatsApp

- `wa.me` exige el número internacional solo con dígitos. Antes el enlace conservaba el «+»
  (`wa.me/+54341…`).
- Para celulares argentinos, el formato internacional es 54 + 9 + código de área sin 0 + número sin
  15. Los números marcados «WA» son celulares:
  - la Municipalidad de Santa Fe publica el mismo WhatsApp como «0342 - 154063525»;
  - el Ente Turístico Rosario enlaza el suyo como `wa.me/5493415795884`.
- Resultado:
  - `https://wa.me/5493415795884` (Rosario);
  - `https://wa.me/5493424063525` (Santa Fe).
- `lib/telefono.ts` también corrige los enlaces `tel:`, que quedan en formato nacional (0 + área +
  abonado):
  - Rosario («0341 – 4802230») generaba `tel:0341`;
  - Helvecia (dos números separados por raya) y una agencia con dos números («341 6500820 / 341
    5908198») generaban enlaces inválidos.
- Un número incompleto o ambiguo no genera enlace.
- El texto del campo se muestra completo, como en los datos: antes la tarjeta ocultaba el teléfono
  fijo cuando había WhatsApp.

## Sincronización con la planilla XLSX original

La planilla `public/santa-fe/oficinas_informes.xlsx` es una fuente histórica inventariada por hash
(`docs/supabase/media-inventory.json`, sha256 `c6aaac90…db99`). **No se modificó.** La corrección es
reproducible durante la exportación:

1. Las correcciones viven en `data/correcciones/oficinas_informes.json`. Cada una tiene:
   - localidad y campo;
   - el valor que hoy tiene la planilla (`valorEnPlanilla`);
   - el valor publicado;
   - motivo, y fuente oficial con URL y fecha de consulta.
2. `npm run santa-fe:oficinas` (también corre dentro de `npm run validate`, y por lo tanto en CI):
   - verifica que la planilla siga coincidiendo con su hash de inventario;
   - la exporta;
   - aplica cada corrección **solo si** la planilla todavía tiene `valorEnPlanilla`;
   - valida los correos;
   - compara el resultado con `public/santa-fe/json/oficinas_informes.json`.
   Sin las correcciones, la exportación coincide byte a byte con el JSON publicado (incluidos el
   `null` y los espacios no separables).
3. Para regenerar el JSON: `node --experimental-strip-types scripts/santa-fe/exportar-oficinas.mjs --write`.

Cuando el titular quiera corregir también la planilla original:

1. Editar la celda en el XLSX con el valor publicado.
2. Ejecutar `npm run inventory:media` para registrar el nuevo hash, y revisar el cambio de
   `docs/supabase/media-inventory.json` en el mismo PR.
3. Quitar de `data/correcciones/oficinas_informes.json` la entrada que ya no hace falta.
4. Ejecutar `npm run validate`: si la planilla cambió y la corrección sigue, falla con «La planilla
   cambió en …», para que nadie pise un dato nuevo sin revisarlo.
