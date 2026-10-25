# Correspondencia e identidad

Se reutiliza el envelope `schemaVersion:1` de [PR9](../supabase/IMPORT.md), las migraciones existentes y el contrato visual de [PR15](../pr15/FICHAS-WORK.md). El `schemaVersion:2` de Escapadas corresponde a otro contrato; no se convierte el maestro en escapadas ni se reescriben sus `masterRefs`.

| Maestro / campo | Preparación privada PR17 | Destino futuro PR9 / presentación |
| --- | --- | --- |
| `id` + pestaña + origen | `originalIdentity`, ID intacto; UUIDv5 `internalId` | `editorial.import_rows(origin,sheet,original_id)`, UUID en `entries`; `Destino.id` original solo en revisión privada |
| `nombre`, `slug` | payload original + copia normalizada | `entries.name/slug`; no crear URL ni cambiar canónicas |
| `jurisdiccion_id` | FK a `Jurisdicciones.id` | `destinations.jurisdiction_id`; slug visual exige conciliación explícita |
| `destino_id` de Atractivos | FK a destino, sin inferir por provincia | `attractions.destination_id`; agrupación exacta del componente |
| `perfil`, `descripcion_original` | texto privado, no aprobación | resumen/atractivo de la vista de revisión; futura proyección por campos revisados |
| `categoria` | conservar valor original | tipo visual mediante correspondencia explícita, sin clasificación por nombre |
| `latitud/longitud`, ubicación | validar par y rango; conservar evidencia | coordenadas de `entries`; mapas futuros requieren revisión específica |
| `fuente_ids`, `Fuentes` | referencias, URLs, título, institución, fechas | `editorial.sources`; lista visual solo tras selección y validación |
| `Evidencias` | IDs, entidad/campo/hallazgo/localizador/estado intactos | `editorial.evidence`; nunca volcado dentro del cuerpo público |
| fechas numéricas de Sheets | `originalPayload` intacto; `normalizedPayload` con ISO y `dateConversions` trazables | fechas semánticas; fórmula/valor de origen siguen en staging privado |
| `Datos_variables` | soporte privado; componentes vinculados a su entidad; decisión `pending` | `editorial.variable_facts` y `fact_evidence`; ninguna tarifa/horario por aprobación general de texto |
| `Relaciones` | extremos y tipo comprobados | FKs / `circuit_stops` en otra fase; no inferir logística desde el orden |
| `estado_verificacion`, `estado_editorial`, `dictamen_publicacion` | `documentary` conserva cada dimensión original | documentación, nunca `approval_status=approved` |
| `Exportacion_piloto` | clave lote/tabla/registro/versión; original preservado | propuesta, nunca otra entidad ni un permiso |
| `ficha_practica_propuesta`, campos permitidos, exclusiones/trazas | privados; no parseados automáticamente para UI | revisión de cada dato práctico antes de proyectar |
| `Multimedia` | conservar autoría, licencia, evidencias y estados | staging; después `media_assets` con revisión independiente |
| campos desconocidos / otras pestañas | conservar soporte/payload completos | `import_rows.original_payload`, sin forzarlos a una tabla errónea |

## Hashes y diferencias

- `sourceHash`: SHA-256 canónico del payload original de la entidad y sus metadatos de fecha; cambiar un título/slug no cambia su UUID.
- `reviewHash`: hash de preparación de entidad, fuentes, evidencias, variables, relaciones y propuesta seleccionada. **No es una firma ni aprobación humana**; el hash definitivo de publicación deberá corresponder a la proyección pública exacta.
- `checksum`: snapshot completo, selección, revisión y metadatos de fechas. Cualquier modificación del soporte se detecta aunque el texto de una entidad no cambie.
- `operation`: insert/update/unchanged por identidad estable; `changedFields` incluye cambios de payload y señal de metadatos. Las filas ausentes aparecen en `retainedMissing`, sin delete.
- `supportChanges`: diferencias privadas por ID de fuente/evidencia/variable o clave compuesta de propuesta. Las filas sin identidad editorial (gobernanza/diccionario) usan solo una clave de diagnóstico de snapshot, nunca un ID de ficha ni un UUID de entidad.

El namespace `git:IS03/Argentina-universo.sur` del catálogo histórico y el origen del maestro siguen separados. No se vinculan fichas por compartir nombre o provincia. No se asocia Córdoba capital a Norte de Córdoba ni Colón a toda Entre Ríos. Las conciliaciones de slugs de jurisdicción, categorías y futuras rutas deben registrarse explícitamente en revisión privada.

## Presentación y seguridad

`prepareWorkReview` acepta solo un plan privado estructuralmente válido, con fichas retenidas, y un mapeo explícito. No decide publicación. No crea localidades administrativas, no lee el JSON de propuestas prácticas ni usa coordenadas o fotos implícitamente. Los datos prácticos/mapas/fotos se pasan por separado para revisión; el fixture sintético demuestra sus campos. El indicador de revisión de derechos de una foto en este adaptador es una entrada de demostración privada, **no un sistema de autorización de medios**.

`DestinoArticle` reutiliza tarjetas, mapas, fuentes, datos prácticos y fotos responsivas de PR15. Solo recibe campos visuales; no imprime `referenciasMaestro`, payloads, estados internos ni JSON embebido. En PR17 no lo importa ninguna ruta de `app/`. Para una publicación futura habrá que proyectar también IDs públicos opacos para anclas y relaciones: los identificadores originales de investigación no se enviarán al visitante.
