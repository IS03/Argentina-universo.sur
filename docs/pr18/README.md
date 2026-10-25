# PR18 — Primer lote de Work para revisión final

Tres destinos reales preparados, **ninguno publicado ni aprobado**: Rosario, Santa Fe capital y Alta Gracia. No se agregan rutas `/destinos/`, cambios de proveedor ni llamadas remotas al visitante. Las 106 URLs SEO y las 24 Escapadas retenidas se conservan.

## Selección acotada

| Destino | Alcance propuesto | Motivo de selección y límite |
| --- | --- | --- |
| Rosario | Monumento a la Bandera, macro, Isla de los Inventos | Tres atractivos relacionados en el maestro, fuentes municipales/institucionales específicas y una fotografía fluvial con licencia comercial verificable. No se promete ascenso al mirador, programación, horarios ni gratuidad. |
| Santa Fe capital | Puente Colgante, Parque/Museo de la Constitución, Manzana Jesuítica | Cobertura histórica y geográfica específica; posibilidad de distinguir parque, museo y conjunto educativo. Se excluye la Reserva Ecológica UNL retenida; no se extrapola UNESCO de Córdoba. |
| Alta Gracia | Estancia Jesuítica, Museo Casa del Che, Museo Manuel de Falla | Fuentes de los administradores, patrimonio nacional y UNESCO; tres instituciones con domicilios propios. El Tajamar no se incorpora como registro independiente retenido; no se extiende UNESCO a las casas museo. |

La selección utiliza tres candidatas acotadas y nueve atractivos relacionados candidatos; excluye componentes numéricos pendientes y registros retenidos. Son categorías documentales, **no permisos**. Los nombres anteriores definen el alcance turístico propuesto; los IDs originales, relaciones y estados detallados están exclusivamente en el paquete privado.

## Acceso al maestro y trazabilidad

Lectura autorizada del maestro de 18 pestañas; sin escrituras. Se contrastó la captura privada de PR17 con una lectura nueva de Destinos `A1:X24`, Exportacion_piloto `A1:U120` y cabecera/11 filas pertinentes de Atractivos. Las filas seleccionadas y propuestas coincidieron; modificación del archivo observada: `2026-10-24T00:58:54.849Z`. No se investigaron masivamente nuevos destinos.

El paquete conserva identidades originales, parentescos, jurisdicciones, hashes de filas, 103 referencias originales de evidencia y referencias multimedia anteriores. Las comprobaciones nuevas están separadas de las referencias del maestro. Los IDs de presentación se derivan de los UUID internos de PR17 y no sustituyen identidades editoriales.

Se redactaron tres textos originales de unas 650 palabras cada uno, con nueve atractivos, SEO, información práctica prudente, enlaces relacionados y mapas. Se leyeron los cuerpos de 16 páginas institucionales y se conservaron copias privadas con SHA-256; un HTTP 200 no acredita una afirmación. Fechas publicadas/modificadas se registran cuando son inequívocas; la consulta no se presenta como actualización de la institución.

Los mapas son búsquedas textuales de OpenStreetMap basadas en domicilios documentados; no son coordenadas de acceso inspeccionadas ni itinerarios garantizados. La revisión humana debe confirmar este alcance. No hay mapas embebidos, geolocalización ni solicitudes adicionales al abrir la ficha.

## Entrega privada y límites del PR público

El contenido real del maestro y los textos derivados no deben incorporarse al repositorio público. En el workspace autorizado:

- `.artifacts/pr18/private/review/REVISAR.md`: índice de lectura y decisiones.
- `.artifacts/pr18/private/review/{rosario,santa-fe-capital,alta-gracia}.md`: textos íntegros, alcance, fuentes, límites, correcciones, exclusiones y cuatro hashes por ficha.
- `.artifacts/pr18/private/review/approval-package.json`: contenido estructurado y evidencias del lote, sin decisiones completadas.
- `.artifacts/pr18/private/review/capturas/`: seis capturas privadas de escritorio/móvil.
- `.artifacts/pr18/private/paquete-revision-pr18.zip`: entrega privada acotada; sin exportación completa del maestro ni clave de acceso.

Estos archivos están ignorados por Git, con permisos privados. **No se adjuntan al PR, a logs ni a artefactos de CI.** La revisión desde otra máquina requiere transferir el ZIP por un canal privado autorizado; clonar GitHub no recupera este contenido. El maestro sigue siendo la fuente de referencia, no se crea otro catálogo independiente.

## Implementación reutilizable

- `lib/destinos/editorial-page.ts`: proyección tipada de lectura, sin estados ni filas privadas.
- `components/destinos/DestinoEditorialArticle.tsx`: ficha completa con diseño de PR15–16, foto responsiva, navegación nativa, atractivos, información práctica, fuentes y enlaces; sin ruta pública.
- `scripts/editorial/review-batch.mjs`: validación del lote contra el contrato PR17, cuatro hashes, SSR local, documentos completos y auditoría de exclusión.
- `scripts/editorial/review-assets.mjs`: validación de licencia/metadatos/originales y variantes WebP reproducibles con la política PR11.
- `scripts/editorial/review-server.mjs`: servidor privado de revisión, separado de Next y Cloudflare.
- `tests/review-batch.test.mjs`: pruebas sintéticas sin exponer datos reales al CI.

La presentación usa HTML completo sin JavaScript; reutiliza CSS y fuentes del build actual. Las fotografías usan `srcset`/`sizes`, dimensiones explícitas y 320/640/960/1280 px; no utiliza `/_next/image` ni servicios pagos. El componente de fuentes añade modo compacto opcional conservando su comportamiento anterior por defecto.

## Reproducir la revisión local

Requiere Node según `.nvmrc`, dependencias instaladas, build Next y los insumos **privados autorizados**. El CI no necesita el maestro.

```sh
npm run build
npm run editorial:review-batch -- .artifacts/pr18/private/batch.json .artifacts/pr17/private/snapshot.json .artifacts/pr18/private/review .artifacts/pr18/private/processed
npm run editorial:serve-review -- .artifacts/pr18/private/review
```

Leer localmente `review/access.json` para abrir la URL con clave. No publicar la clave. El servidor solo escucha en `127.0.0.1`, exige Host/Origin correctos y una ruta aleatoria; sirve únicamente HTML, CSS, fuentes y WebP incluidos en el manifiesto, comprobando su hash en cada solicitud. Rechaza JSON, Markdown, originales, navegación de directorios, escrituras y contenido modificado. Aplica CSP sin scripts y sin conexiones externas, no-store y protección contra iframes. `noindex` es complementario; **no es el control de acceso**.

No usar `serve`, un túnel público, Pages ni un Preview de Vercel para esta carpeta. No es un sistema multiusuario ni sustituye una autenticación remota. No hay interfaz que registre aprobaciones o publique. Regenerar sobre decisiones humanas existentes se rechaza: usar una nueva carpeta para otra versión.

## Decisiones y publicación posterior

Para **cada ficha y versión** deben resolverse separadamente:

1. Alcance y nueve relaciones distribuidas entre las tres fichas: aceptar, excluir o ampliar.
2. Texto/SEO exactos y hash `payload`: aceptar o solicitar cambios.
3. Fotografía, recorte, pie, atribución y licencia: aceptar, sustituir o excluir; verificar hash `media`.
4. Datos prácticos y búsquedas de mapas: aceptar el alcance sin horarios/tarifas garantizados o pedir verificación adicional.
5. Permiso expreso e independiente de publicación, responsable, fecha y canal.

Todos los valores permanecen `draft`, `review: null`, `publicationAuthorized: false`, con cinco decisiones nulas. Modificar cualquier sección exige nuevos hashes y revisión de esa versión. La autorización previa de El Palmar no se extiende a estas fichas ni cambia las 24 Escapadas retenidas.

Después de decisiones verificables, un PR posterior podrá implementar el manifiesto público mínimo, rutas canónicas y sitemap para las fichas autorizadas, con pruebas contra filtraciones y Preview público solo de esa proyección. Este PR no contiene ese interruptor. No retira PDF, habilita anuncios ni importa las restantes fichas del maestro.

## Costos, publicación y reversión

Cero servicios o recursos nuevos. Se desactiva el Preview automático de Vercel solo para esta rama mediante `vercel.json`; no cambia producción. Cloudflare sigue construyendo el sitio público actual, sin datos del lote. La biblioteca de componentes y scripts añade código fuente, no 12 imágenes ni contenido real al despliegue.

Revertir este PR elimina las herramientas de revisión y el componente no conectado. No requiere reversión de base de datos, dominios, archivos públicos ni proveedor. Los originales fotográficos y paquetes privados deben conservarse por el responsable. Las decisiones futuras de importación de 84 fichas, UX/UI, AdSense/publicidad directa y traslado de dominio siguen pendientes; cualquier publicidad requerirá su propia revisión de privacidad/consentimiento.

Véanse [fuentes y hashes](SOURCES-AND-HASHES.md), [derechos fotográficos](PHOTOGRAPHS.md) y [validaciones](VALIDATION.md).
