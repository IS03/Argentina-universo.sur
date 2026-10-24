# Contrato de importación y correspondencia

## Maestro y alcance verificados

El maestro sigue siendo [Argentina Universo Sur — Maestro de investigación turística — Santa Fe](https://docs.google.com/spreadsheets/d/1fwed8poUbIaLBnMLJta5WkyAnYg_SFc453m-wl3aB1w/edit). Se verificaron sus 18 pestañas por metadatos, encabezados y rangos acotados, en lectura. No se exportaron fichas, evidencias privadas ni contactos al Git público.

Pestañas: Inicio, Destinos, Atractivos, Experiencias, Circuitos, Agenda, Servicios, Multimedia, Fuentes, Evidencias, Datos_variables, Relaciones, Pendientes, Jurisdicciones, Expansion_Santa_Fe, Gobernanza, Diccionario y Exportacion_piloto.

El alcance pedido es una selección de **84 fichas**, con 55 candidatas a aprobación final acotada, 3 con componentes numéricos sujetos a otra decisión y 26 borradores. Estas cantidades provienen del contexto editorial; **no se reinterpretan como aprobaciones**. La existencia actual de más IDs en algunas pestañas y de varias propuestas por entidad en Exportacion_piloto exige identificar la selección concreta y la revisión del maestro antes de producir un snapshot. No importar automáticamente todas las filas ni confundir la cantidad de propuestas con la cantidad de fichas.

Falta acordar para el primer lote: lista de 84 `(pestaña, ID)` o subconjunto explícitamente autorizado, revisión/checksum del maestro, whitelists por campo y versión, dictámenes humanos firmes, delimitación de los tres componentes numéricos y resolución de localidades/servicios. El acceso de lectura al maestro no autoriza una publicación ni sustituye esos pasos.

## Correspondencia de entidades y columnas

| Origen | Destino futuro | Conservación |
| --- | --- | --- |
| Jurisdicciones | `entries` + `jurisdictions` | ID J-* privado, nombre, slug existente y región de catálogo |
| Destinos | `entries` + `destinations` | id, jurisdiccion_id, slug; textos originales permanecen privados hasta proyección humana |
| Atractivos | `entries` + `attractions` | id, destino_id, categoria y coordenadas solo si tienen evidencia válida |
| Experiencias | `entries` + `activities` | id, destino_id; no generar un slug público definitivo desde un título sin revisar |
| Circuitos | `entries` + `circuits` + `circuit_stops` | id y relaciones `parada`; no transformar orden editorial en logística validada |
| Agenda | `entries` + `events` | id, destino_id, atractivo_id, fechas reales y fecha_texto_fuente |
| Fuentes | `editorial.sources` | id, url, institución, consulta, alcance y limitaciones |
| Evidencias | `editorial.evidence` | id, entidad_id, campo, hallazgo, fuente_id, localizador y estado original |
| Datos_variables | `editorial.variable_facts` + `fact_evidence` | id, entidad_id, valor, importe/moneda, vigencias y referencias; siempre privado |
| Multimedia | staging; luego `media_assets` | ID original, autoría/licencia y estados; una URL disponible no acredita derechos |
| Relaciones | staging; después FKs/`circuit_stops` | id, origen_id, tipo, destino_id y orden; validar cada tipo antes de materializar |
| Exportacion_piloto | staging privado | identidad de propuesta = lote_id + tabla + registro_id + version_propuesta; nunca un alta adicional de la entidad |
| Servicios y otras pestañas | `import_rows.original_payload` | Conservar sin encajar en una tabla incorrecta; especialización pendiente |

Encabezados observados de revisión: `estado_verificacion`, `estado_editorial`, `dictamen_publicacion`, `alcance_revision`, `bloqueantes_ids`, `practica_campos_permitidos`, `practica_exclusiones` y `practica_trazabilidad`. La propuesta de Exportacion_piloto distingue además `aprobacion_humana`, `permiso_publicacion` y `componentes_condicionados_ids`. Estos campos se preservan como documentación original; ningún valor histórico `publicable`, `exportar` o `aprobable_acotado` se copia a `publication_permitted`.

Se conservan campos desconocidos en `original_payload`. El contrato de normalización definitivo se contrastará con el diccionario completo del maestro; no se presume que se hayan leído/validado todos los campos o las 84 fichas en PR09.

## Formato del snapshot privado

`schemaVersion: 1`, `source.spreadsheetId` igual al maestro original, `source.revision` no vacía, `tables` con filas como objetos y encabezados originales, y `selection` con pares `sheet`/`id`. No es otra planilla ni un nuevo maestro: es un respaldo transitorio, fechado, del lote autorizado. Guardarlo exclusivamente en `.artifacts/` o en el bucket privado con acceso restringido.

Ejemplo **de forma**, con ID sintético (no es una ficha investigada):

```json
{
  "schemaVersion": 1,
  "source": {
    "spreadsheetId": "1fwed8poUbIaLBnMLJta5WkyAnYg_SFc453m-wl3aB1w",
    "revision": "REVISION_DEL_SNAPSHOT_AUTORIZADO"
  },
  "tables": {
    "Destinos": [{"id": "D-FIXTURE", "nombre": "Ejemplo sintético"}]
  },
  "selection": [{"sheet": "Destinos", "id": "D-FIXTURE"}]
}
```

La CLI exige por defecto 84 IDs seleccionados: este ejemplo incompleto se rechaza. Las pruebas usan muestras pequeñas explícitas para cubrir las reglas. Un futuro lote de otra cantidad necesita un alcance acordado y una adaptación explícita de la CLI, no eliminar la validación de selección.

```sh
npm run import:dry-run -- .artifacts/master-snapshot.json
npm run import:dry-run -- .artifacts/master-snapshot.json --previous=.artifacts/previous-snapshot.json --output=.artifacts/import-plan.json
```

La herramienta comprueba identidad del maestro, selección, IDs obligatorios y duplicados, slugs presentes, coordenadas, fechas ISO realmente existentes, orden temporal y referencias a fuentes/entidades. Distingue propuestas por lote. No resuelve entidades ambiguas, no inventa fechas y no consulta URLs externas automáticamente.

Las entidades presentes como contexto pero fuera de `selection` aparecen en `contextOnly`, sin operaciones de importación de entidades. No se amplía el lote por leer más filas: las dependencias faltantes requieren una selección/autorización explícita o una entidad ya existente. La documentación de soporte permanece privada.

El plan muestra inserts/updates/unchanged, huellas SHA-256, campos modificados y registros ausentes que **se retendrán**. UUIDv5 usa el namespace URL estándar y la tupla exacta origen/pestaña/ID. Cambiar el ID del maestro cambia el namespace lógico y por eso se rechaza. Los ID originales nunca se sustituyen por el UUID.

`canStage=true` significa solo que pasan estas comprobaciones iniciales. **No significa aprobación, exportación ni permiso de publicación.** El plan no escribe en la base y fija todas sus propuestas en pending/false. Los estados originales permanecen en el snapshot privado. No existe una opción `--apply` ni un modo que publique contenido.

## Ejecutor futuro (no implementado en PR09)

1. Obtener una revisión coherente del maestro con sus dependencias y respaldo privado. Validar checksum y alcance; no leer hojas en momentos distintos sin detectar cambios.
2. Simular contra el snapshot previo y presentar diferencias. Resolver referencias y mapeos pendientes; no borrar automáticamente registros faltantes.
3. Crear `import_batches` y una transacción de staging. Registrar el ID de lote con `set_config('aus.import_batch_id', ..., true)` después de crear el lote; los triggers vinculan los cambios a él.
4. Usar la clave `(origin,sheet,original_id)` de `import_rows` con `ON CONFLICT`, comparando hash y revisión previa para rechazar escrituras concurrentes obsoletas. Separar lote/revisión de propuesta del ID de entidad. No generar una ficha por cada propuesta de Exportacion_piloto.
5. Conservar cada payload original. Insertar dependencias en orden y crear relaciones con FKs; ante error hacer rollback de toda la unidad de importación. Un reintento con el mismo checksum debe quedar sin cambios.
6. Mantener drafts/pending/false. Proyectar solamente campos revisados en una etapa posterior; nunca volcar datos variables, trazas de investigación o notas internas dentro de `entries.body`.
7. Presentar la versión completa de ficha, detalle y medios al revisor humano. Registrar identidad/alcance/versión y posteriormente una decisión de publicación independiente. La aprobación del texto no aprueba coordenadas, agenda, importes, fotografías ni permisos de imagen.

## Catálogos y SEO actuales

`legacy-catalog-map.json` es regenerable: nombres/IDs de origen, UUID estables, región, relaciones, imágenes, PDF y rutas actuales. Incluye hashes de los tres JSON para detectar cambios. Los tests comparan el mapa completo con sus fuentes. No mezcla el namespace `git:IS03/Argentina-universo.sur` con el maestro de Sheets: la conciliación entre ambos orígenes requerirá una tabla de correspondencias revisada, no una coincidencia automática por nombre.

- `ProvinciaRaw.SLUG` → slug y `/provincias/<slug>`; `ZONA` → región existente. `LAT/LON` y capital se preservan, sin inferir coordenadas nuevas.
- `ActividadRaw.ACTIVIDAD` → slug calculado exactamente con `createSlug` actual; `SLUG` sigue siendo la jurisdicción, no el slug de la actividad.
- `EscapadaRaw.ID` se conserva; `PROVINCIAS` se valida contra jurisdicciones y el PDF mantiene su ruta exacta, incluso Unicode. No se crea una URL de detalle de escapada inexistente.
- Se preservan las 106 entradas actuales del sitemap y las rutas de Santa Fe; `/privacidad` conserva su política de indexación actual. No se generan `lastModified` desde importaciones/builds.
- El alias histórico `/provincias/catarmaca` sigue redirigiendo a `/provincias/catamarca` mediante la configuración actual de Next; el esquema no introduce un segundo redirect ni un bucle.
- Imágenes, PDF, SVG del mapa, coordenadas de Leaflet, filtros y consentimiento de GA4 continúan usando su implementación actual. Para assets futuros, conservar rutas originales hasta definir y probar proxy/redirect/cache; no sustituir enlaces masivamente.
