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

## Pendiente fuera de este PR

- La planilla fuente `public/santa-fe/oficinas_informes.xlsx` todavía contiene `info@loreipsumcom`.
  No se modificó: es un archivo fuente inventariado por hash (`docs/supabase/media-inventory.json`).
  Si se vuelve a exportar a JSON sin corregirla, `npm run validate` lo va a rechazar.
- Villa Ocampo figura con `turismo@reconquista.gov.ar` (correo de otra localidad). Es válido en
  forma, pero conviene confirmarlo con la fuente.
