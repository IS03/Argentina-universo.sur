# PR14 — Revisión y enriquecimiento de Escapadas

Base: `main` `aeac1d1d99506373cf95ef262e3fad6383817588`, con PR13 fusionado. Consulta editorial: **25/10/2026**. Rama `codex/pr14-revision-escapadas`.

Se revisan íntegramente CABA, Puerto Iguazú, Talampaya e Ischigualasto y El Palmar, y se amplía la cobertura documental de Jujuy, San Luis, Entre Ríos y Río Gallegos. **24 fichas en borrador; cero publicables.** La revisión documental realizada por herramientas no se registra como revisión humana.

## Material para revisar

- [Ocho textos completos e informes con hashes](REVIEW-INDEX.md): cuatro piloto y cuatro enriquecimientos prioritarios.
- [Fuentes, contenido leído y límites](SOURCES.md); datos estructurados en `source-register.json`.
- [Carencias resueltas, contradicciones y pendientes](GAPS.md).
- [Comparación temática con los PDF](PDF-MATRIX.md), sin equivalencia autorizada.
- [Matriz de fotografías](PHOTO-MATRIX.md): seis archivos concretos del piloto, cuarenta briefs anteriores revisados y alternativas faltantes.
- [Decisiones humanas y fases siguientes](DECISIONS.md).
- [Pruebas y alcance de las auditorías](RESULTS.md).

`revisions.json` conserva identidad, estados y hashes de las 24 fichas de base, el antes/después de las ocho modificadas y los hashes de los documentos históricos PR13. `claim-ledger.json` vincula párrafos y descripciones de ubicaciones a fuentes y SHA-256; no demuestra por sí solo la verdad de una afirmación ni sustituye criterio editorial. Cambiar texto o metadatos exige regenerar el material de revisión; nunca genera permisos o firmas.

El Palmar se adapta al esquema2 y conserva ID, autorización histórica, `publicationAuthorized: true`, `status: draft` y `review: null`. Ese permiso previo no equivale a lectura o aprobación del nuevo texto. Las otras23 fichas conservan `publicationAuthorized: false`. Ninguna supera `tripPublishable`.

## Investigación privada y derechos

Se reutilizó localmente el registro privado acotado de correspondencias e incidencias del PR13. No se afirma una nueva lectura del maestro ni de los contratos de Drive en este PR. No hubo escritura, importación, copia de previsualizaciones, exportación completa ni asignación de nuevos IDs del maestro. Las correspondencias originales siguen fuera de Git, en `.artifacts/pr13/private/` y en el espacio privado ignorado de esta revisión. No se crea otro maestro. `masterRefs` permanece vacío en los ocho textos.

Los documentos versionados contienen redacción original, evaluación de fuentes públicas y propuestas de revisión. Las extracciones de los PDF, capturas, cuerpos de fuentes y registros privados permanecen ignorados. El repositorio público sí permite leer los borradores como código/documentación para revisión; los artefactos del sitio y las rutas públicas los excluyen. No se presenta `noindex` como control de acceso.

## Reproducción

```sh
# Requiere el commit base en el historial local para reconstruir hashes anteriores.
npm run editorial:report-pr14
npm run editorial:check-pr14
npm run editorial:check
npm run editorial:plan
npm run check
npm run build:pages -- --production-audit
npm run build:pages -- --consent-test
npm run build:pages
# Requiere los servidores locales indicados en docs/pr11 y la configuración de scripts/pages.
npm run test:pages
# Opcional: red, solo HEAD sobre PDFs de producción y rutas retenidas del Preview existente.
npm run editorial:links -- --pr14
```

Los comandos de revisión escriben en directorios fijos de `.artifacts/` y `docs/pr14/`, nunca en `public/`. `editorial:report-pr13` rechaza reescribir su informe histórico con los textos nuevos. Los contratos PR13 siguen controlando IDs, lotes, PDFs y permisos, con la cadena explícita de revisiones PR14; el nuevo control valida independientemente el texto actual, fuentes y documentos exactos. Los otros 16 borradores y todos los documentos PR13 permanecen idénticos.

## Infraestructura

No cambia el renderizado público, los filtros, las URLs, SEO, GA4, consentimiento, privacidad ni proveedores. No activa Supabase, R2 o pagos. La única configuración de despliegue es la exclusión de esta rama del Preview automático de Vercel, siguiendo PR10–PR13 para evitar cuota personal. No toca producción. La integración existente de Pages puede generar el Preview automático de rama al abrir el PR; no se crean proyectos ni se despliega manualmente.

Los 24 PDF originales y sus enlaces siguen disponibles. No hay redirecciones nuevas, borrados ni ahorros realizados de PDF. Los respaldos externos y su restauración todavía deben verificarse antes de decidir una retirada. `publicidad/` sigue fuera de los commits.
