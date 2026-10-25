# Matriz de sustitución de PDF

Todas las redirecciones están **pendientes e inactivas**. Las URLs de destino son propuestas; hoy sus borradores responden 404. No usar esta tabla como un archivo `_redirects`.

| ID | Ruta conservada | MB | HTML propuesto | Alcance/equivalencia |
| --- | --- | ---: | --- | --- |
| esc_08 | `/pdf/bariloche.pdf` | 34.49 | `/escapadas/san-carlos-de-bariloche` | Texto y equivalencia pendientes |
| esc_06 | `/pdf/caba.pdf` | 37.65 | `/escapadas/caba` | Texto preparado; equivalencia no revisada |
| esc_01 | `/pdf/cañafate.pdf` | 19.32 | `/escapadas/el-calafate-y-el-chalten` | Texto y equivalencia pendientes |
| esc_10 | `/pdf/cba.pdf` | 25.35 | `/escapadas/norte-de-cordoba` | Texto y equivalencia pendientes |
| esc_14 | `/pdf/chaco.pdf` | 23.90 | `/escapadas/chaco` | Texto y equivalencia pendientes |
| esc_11 | `/pdf/entrerios.pdf` | 29.06 | `/escapadas/entre-rios` | Texto y equivalencia pendientes |
| esc_23 | `/pdf/formosa.pdf` | 57.01 | `/escapadas/formosa` | Texto y equivalencia pendientes |
| esc_18 | `/pdf/gallegos.pdf` | 19.78 | `/escapadas/rio-gallegos` | Texto y equivalencia pendientes |
| esc_02 | `/pdf/iguazu_2.pdf` | 14.46 | `/escapadas/puerto-iguazu` | Texto preparado; equivalencia no revisada |
| esc_05 | `/pdf/jujuy.pdf` | 21.39 | `/escapadas/jujuy` | Texto y equivalencia pendientes |
| esc_22 | `/pdf/lapampa.pdf` | 20.93 | `/escapadas/la-pampa` | Texto y equivalencia pendientes |
| esc_15 | `/pdf/mendoza.pdf` | 21.33 | `/escapadas/mendoza` | Texto y equivalencia pendientes |
| esc_21 | `/pdf/misiones.pdf` | 23.04 | `/escapadas/misiones` | Texto y equivalencia pendientes |
| esc_19 | `/pdf/neuquen.pdf` | 45.34 | `/escapadas/neuquen` | Texto y equivalencia pendientes |
| esc_03 | `/pdf/pinamar.pdf` | 19.76 | `/escapadas/pinamar` | Texto y equivalencia pendientes |
| esc_04 | `/pdf/pto_madryn_1.pdf` | 24.27 | `/escapadas/puerto-madryn` | Texto y equivalencia pendientes |
| esc_09 | `/pdf/salta.pdf` | 31.62 | `/escapadas/salta` | Texto y equivalencia pendientes |
| esc_16 | `/pdf/sanjuan.pdf` | 16.45 | `/escapadas/san-juan` | Texto y equivalencia pendientes |
| esc_17 | `/pdf/sanluis.pdf` | 33.41 | `/escapadas/san-luis` | Texto y equivalencia pendientes |
| esc_20 | `/pdf/santiago.pdf` | 28.13 | `/escapadas/santiago-del-estero` | Texto y equivalencia pendientes |
| esc_13 | `/pdf/talampaya.pdf` | 35.46 | `/escapadas/talampaya-e-ischigualasto` | Texto preparado; equivalencia no revisada |
| esc_12 | `/pdf/ushuaia.pdf` | 34.18 | `/escapadas/ushuaia` | Texto y equivalencia pendientes |
| esc_07 | `/pdf/ventana.pdf` | 15.87 | `/escapadas/sierra-de-la-ventana` | Texto y equivalencia pendientes |

Total turístico: **632,210,942 bytes** (632.21 MB decimales). Documento de seguridad aparte: 1.368.481 bytes. Total original: 633.579.423 bytes. Ahorro realizado por retirada en este PR: **0 bytes**.

Uso: las 23 guías permanecen enlazadas desde `/escapadas`. Vercel sirve los originales; Pages Preview conserva sus enlaces absolutos a producción. El documento de seguridad sigue en `/seguridad` y no forma parte del lote turístico.

Cada reemplazo requiere: HTML publicable con revisión de su hash; equivalencia temática aprobada por separado; respaldo privado del responsable, fuera de los despliegues, con hash/tamaño y restauración comprobados; aprobación explícita de retirada; prueba del 308 exacto y de su destino. `editorial:plan` solo genera una simulación y nunca escribe redirects o elimina archivos.

El Palmar no es un reemplazo equivalente de toda la guía de Entre Ríos. Tampoco Puerto Iguazú sustituye toda Misiones. No se normalizan las rutas Unicode ni los nombres de PDF históricos.
