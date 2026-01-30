# Fuente de datos (Excel)

Estos archivos son la **fuente** para generar los JSON que usa la web. **No se sirven ni se despliegan** (están fuera de `public/`).

- `actividades.xlsx` → se exporta/convierte a `public/data/actividades.json`
- `escapadas.xlsx` → se exporta/convierte a `public/data/escapadas.json`
- `provincias.xlsx` → se exporta/convierte a `public/data/provincias.json`

La app solo consume los `.json` en `public/data/`. Los Excel se usan en scripts de generación (por ejemplo con la librería `xlsx` en dev) y no forman parte del bundle ni del deploy.
