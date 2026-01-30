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
