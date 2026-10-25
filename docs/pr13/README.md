# PR13 — Investigación editorial B02–B06

Veinte fichas originales estructuradas, representando las veinte guías pendientes. Se suman a las tres de B01; El Palmar continúa como ficha adicional. **24 borradores en total, 0 publicables, 0 PDF retirados.** No se interpreta “investigada” como “completa”, “equivalente” ni “aprobada”.

## Material para revisión

- [Inventario con textos completos y hashes](EDITORIAL-INVENTORY.md).
- Informes por lote: [B02](B02.md), [B03](B03.md), [B04](B04.md), [B05](B05.md), [B06](B06.md).
- [Fuentes leídas, fechas, afirmaciones y límites](SOURCES.md); contrato estructurado en `research-register.json`.
- [Contradicciones y carencias](CONTRADICTIONS.md).
- [Matriz temática de PDF](PDF-MATRIX.md); identidad, hash original, diferencias y redirección inactiva en `pdf-equivalence.json`.
- `photo-proposals.json`: imagen principal y complementaria por destino, **40 propuestas pendientes**, sin originales identificados ni derechos suficientes. URL institucional es pista de búsqueda, no licencia. No se descargaron fotos ni generaron variantes.
- [Plan de revisión y retirada](RELEASE-PLAN.md).
- [Pruebas y límites de verificación](RESULTS.md).

## Privacidad y trazabilidad

Se consultaron los contratos privados y rangos acotados del maestro antes de redactar cada lote. Se reutilizaron enlaces y hallazgos pertinentes; no hubo exportación completa, copia de sus textos, importación ni modificación del maestro. Las coincidencias reales de IDs y sus evidencias permanecen en el registro privado local ignorado por Git (`.artifacts/pr13/private/`). No constituye otro maestro; es un registro de correspondencia de esta investigación, sin escritura remota. Conservarlo en el archivo privado del responsable antes de descartar este entorno; no subirlo al PR ni como artefacto de CI.

Los únicos textos nuevos que se versionan son redacción original y evaluaciones de fuentes públicas. `masterRefs` permanece vacío en los veinte borradores; no se publican IDs de Work. Las cuatro fichas existentes conservan sus bytes y permisos; un control de hash detecta modificaciones accidentales. El permiso anterior de El Palmar no se cambia y sigue sin revisión humana, por lo que permanece retenido.

## Reproducción local

```sh
npm run editorial:report-pr13
npm run editorial:check-pr13
npm run editorial:check
npm run editorial:plan
npm run check
npm run build:pages -- --production-audit
npm run build:pages -- --consent-test
npm run build:pages
# Servidores y pruebas Pages: ver docs/pr11/ y scripts/pages/playwright.config.ts
npm run test:pages
```

`editorial:report-pr13` genera documentos de revisión desde JSON y notas públicas; no accede a Drive. La revisión local va a `.artifacts/pr13/review/` y los veinte documentos de lectura originales se reflejan en `docs/pr13/review/`. Nunca se crea una ruta web de revisión ni un servidor de borradores. El build estático reemplaza los inputs editoriales por su proyección aprobada antes de compilar. Las auditorías recorren HTML, RSC, JS, JSON, sitemap y auxiliares públicos; no confían en noindex.

## Límites de este PR

No cambia diseño, catálogos públicos, analíticas, consentimiento, privacidad, permisos editoriales, infraestructura ni DNS. No crea Supabase/R2 ni consume sus recursos. Se añade únicamente la exclusión de la rama PR13 en `vercel.json`, siguiendo las ramas PR10–PR12, para evitar un Preview automático en cuotas personales; no modifica despliegues existentes ni producción. Cloudflare continúa siendo Preview. La investigación de arquitectura y la publicidad futura permanecen como fases posteriores, sin scripts ni servicios nuevos.
