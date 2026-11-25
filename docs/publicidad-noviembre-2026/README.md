# Publicidad institucional · pauta de noviembre de 2026

Facturar a: Ministerio de Gobierno e Innovación Pública. Reemplaza las seis creatividades de octubre por las seis de noviembre, en las mismas ranuras contratadas (ver [pauta de octubre](../publicidad-octubre-2026/README.md)). Archivos publicados byte por byte; los GIF conservan cuadros, tiempos y repeticiones.

| Pedido | Archivo | Ranura | Página |
| --- | --- | --- | --- |
| Obras que Sí – Newbery · B. Home central 800 × 600 | `OBRAS QUE SI -HIDRICAS-newbery_banner-__800x600.gif` | `portada-central` | Inicio, después del hero |
| Género 4 · B. Lateral completo 200 × 200 | `GENERO 4_200X200.gif` | `portada-lateral-izquierda` | Inicio, columna izquierda |
| Mil aulas Rosario · B. Home lateral | `mil-aulas_ROSARIO 600x300.gif` | `portada-lateral-derecha` | Inicio, columna derecha estática (300 × 150 en escritorio; ancho completo en móvil) |
| Obras hídricas · B. Central secciones | `obras hidricas_300x600 jpg.jpg` | `actividades-antes-explorador` | Qué hacer: columna derecha que acompaña el scroll en escritorio (≥ 1280 px); arriba del explorador en móvil |
| Obras que Sí – 3° carril · B. Cabecera superior 1140 × 100 | `3°CARRIL-nuevo-tramo_banner-web_1140x100.gif` | `escapadas-antes-guias` | Escapadas |
| Dengue · B. Lateral cuadrado 250 × 250 | `Dengue_Objetivo_250x250.gif` | `provincias-lateral-mapa` | Viajar por Argentina |

**Tamaños cruzados en el pedido:** la factura indica Mil aulas 300 × 600 y Obras hídricas 600 × 300, pero los archivos miden al revés. Se respetó la ubicación pedida (confirmada por el responsable): Mil aulas en el lateral del Home, escalada al ancho de la columna (300 px), y Obras hídricas en secciones. Si llega una versión 300 × 600 de Mil aulas, basta reemplazar el archivo.

- Originales de octubre conservados en `publicidad/anteriores-2026-10/`.
- El visor ampliable en móvil ahora aplica a cualquier banner panorámico (proporción ≥ 8:1), hoy el 3° carril.
- Sin URLs de destino ni fechas de vigencia (pendientes); la baja es manual con `activa: false`.

## Revisión de escritorio y móvil (25/11/2026)

- Por ser vertical, Obras hídricas ocupaba toda la primera pantalla de Qué hacer. En escritorio pasa a una columna lateral `sticky` junto al explorador (como Dengue en el mapa); si un bloqueador la retira, el explorador recupera el ancho.
- Mil aulas usa el ancho completo en móvil; en escritorio la columna la limita a 300 px.
- Verificado en 1440 × 900, 1280 × 800, iPhone 13 y Pixel 7: sin desborde horizontal; Género sigue el scroll en escritorio y va en el flujo en móvil.
