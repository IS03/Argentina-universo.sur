# Guías PDF publicadas como derivados optimizados

Desde el 31/10/2026 las 23 guías de `public/data/escapadas.json` se publican en sus mismas rutas como derivados de los originales: 602,9 MB → 180,2 MB (−70,1 %). El documento de seguridad (`/pdf/seguridad/…`) no es una guía y no cambió.

El linaje histórico (`docs/pr10`, `docs/pr12`, `docs/pr13`, `docs/pr14`) conserva la identidad de cada original. [`derivados.json`](derivados.json) vincula ese original con el archivo publicado (bytes y sha256 de ambos). `lib/pages/published-pdf.ts` es la regla que aplican `editorial:check`, `validate:pages` y las pruebas: un PDF es válido si es el original o su derivado registrado; cualquier otro cambio sigue bloqueado.

## Qué cambió

Solo las seis fotos JPEG de cada guía (137 en total). Cada foto quedó en 2 px por punto del ancho al que se muestra en la página y se recodificó como JPEG calidad 75, color 4:2:0. Un celular abre la página a ~1,1 px/pt.

Se conservan, comparados contra cada original: páginas, cajas y orientación; texto seleccionable y buscable; fuentes; espacios y perfiles de color ICC; metadatos (Info y XMP, byte a byte); anotaciones (los originales no tienen enlaces ni marcadores). A ancho de celular, la diferencia medida es de 37,4 a 45,0 dB de PSNR. Al ampliar 3× o más se suavizan texturas finas (ripio, piedra): pérdida aceptada en la revisión visual del 31/10/2026.

## Original

Los originales siguen en el historial de git, por ejemplo `git show 56d1c80:public/pdf/formosa.pdf > formosa.pdf`. Su sha256 está en `derivados.json` y en el linaje; un retiro futuro de un PDF respalda y compara contra esa identidad original.

Las fotos de `public/img` se optimizaron sin pérdida en el mismo cambio (mismos píxeles; ver `docs/supabase/media-inventory.json`). No forman parte de este registro.
