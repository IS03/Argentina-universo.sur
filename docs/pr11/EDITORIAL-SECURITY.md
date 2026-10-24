# Corrección de seguridad editorial antes de fusionar

La exportación pública y el Preview de Cloudflare tienen el mismo límite de publicación que la aplicación actual. `noindex` solo controla indexación; nunca permite distribuir borradores.

## Regla preservada

No se modifica `tripPublishable`: se requiere estado `approved`, permiso de publicación, revisión humana identificada con fecha válida y SHA-256 del contenido exacto. Una edición invalida la revisión. La autorización previa de la ficha nueva no equivale a revisión del texto exacto. `content/escapadas/el-palmar.json` sigue intacto, en `draft`, con `review:null`.

El texto puede revisarse en ese archivo y en el diff del PR. No existe una ruta pública de revisión ni se implementó un sistema de autenticación provisional. Una futura revisión visual privada necesitará un entorno con control de acceso real; ni una URL difícil de adivinar ni robots/noindex sirven para ello.

## Barreras implementadas

1. El catálogo es `server-only`; ruta, metadata y sitemap solo reciben fichas aprobadas mediante una proyección explícita de campos públicos. Ni `AUS_STATIC_EXPORT=1` ni el tipo de entorno permiten saltar el gate. Autorización, revisión, notas y propiedades desconocidas de importación no se serializan en esa proyección, ni siquiera dentro de fuentes o relaciones.
2. El preparador copia solo archivos versionados de entrada, sin `.env`, `.artifacts`, `publicidad` ni documentos locales no versionados. Excluye los Excel/CSV/TSV de los recursos públicos. Los seis Excel originales de Santa Fe permanecen intactos en el repositorio; la aplicación utiliza sus JSON derivados.
3. Antes de compilar se reemplaza **solo en el clon temporal** el catálogo editorial por la proyección aprobada. Los JSON completos de borradores quedan fuera de los inputs de Next. Con cero fichas aprobadas, se omite del clon la ruta dinámica de detalle: Next 16.4.3 rechaza un `generateStaticParams` vacío con `output: export`. No se generan parámetros ficticios ni se aprueba contenido para satisfacer el compilador.
4. Se deja de inyectar el prototipo de revisión de PR10 en el build público. Sus plantillas siguen conservadas como investigación, sin ruta de revisión en Pages.
5. Se audita el `out` de Next antes de copiarlo y el artefacto final antes de entregar un reporte exitoso. La estimación de tamaño se audita también. Se revisan rutas y HTML, payloads RSC, JavaScript, JSON, sourcemaps, XML, respuestas API estáticas sin extensión, archivos auxiliares y versiones gzip/Brotli. Se buscan identidad/texto de borradores, rutas de revisión, payloads/identificadores del contrato del maestro, snapshots y hojas de cálculo. Se normalizan escapes HTML/JSON/URL habituales. Un hallazgo detiene el build con error; no se oculta el problema agregando noindex.
6. Al comenzar un build se retiran su candidato y sus reportes anteriores; un fallo no deja un candidato antiguo del mismo modo aparentando estar validado. Los originales del repositorio no se eliminan.

El scanner es una defensa adicional basada en el catálogo y el contrato conocidos; no es un detector universal de secretos o información privada arbitraria. La principal garantía es **no introducir ni compilar registros no aprobados o snapshots privados**, además de no exportar campos editoriales por defecto.

## Comprobaciones

- Regresiones con borradores sintéticos en HTML, RSC, JavaScript, mapas de fuentes y compresión; los artefactos contaminados deben fallar, incluso con entidades o escapes.
- Pruebas de proyección y del catálogo vacío/con aprobación sintética. Estas fixtures no modifican ni aprueban registros reales.
- Canary privado no versionado en `public/`: la copia explícita no lo incluye. Payloads del maestro y Excel en un artefacto sintético son rechazados.
- Builds reales de Preview, compatibilidad y consentimiento: ausencia de la ficha pendiente y del prototipo, sin datos privados del contrato conocido. En navegador se comprueba 404 en HTML y RSC para esos detalles en los tres modos y el emulador oficial de Pages; el sitemap sigue con 106 URL.
- CI ejecuta unitarias, exportación y auditoría editorial automáticamente. Evidencias: `evidence/editorial-security-*.json`, junto a SEO y navegador.

No se accedió nuevamente al Google Sheets ni se exportaron sus 84 fichas. La revisión corresponde a los inputs locales y a los artefactos generados; no certifica ni altera el contenido remoto del maestro. No se creó un nuevo maestro ni se cambiaron estados editoriales, fuentes, aprobaciones o permisos.
