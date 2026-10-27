# Conciliación integral

Fuente: [Google Sheets maestro de Argentina Universo Sur](https://docs.google.com/spreadsheets/d/1fwed8poUbIaLBnMLJta5WkyAnYg_SFc453m-wl3aB1w/edit). Lectura viva de las 18 pestañas; revisión `2026-10-24T00:58:54.849Z` comprobada antes y después. Rangos acotados con margen vacío; ninguna lectura terminó en el borde de los datos. La metadata tipada de fechas de PR17 se contrastó con los seriales observados y la misma revisión; no se adivinaron fechas. La captura viva prevalece sobre el cache anterior.

Snapshot, inventario fila a fila, manifiestos, correspondencias y journals permanecen en `.artifacts/pr24/private/`, fuera de Git. Este documento contiene agregados, no evidencias ni textos de investigación.

| Pestaña | Filas | Tratamiento |
| --- | ---: | --- |
| Inicio | 55 | Contexto/documentación fuente |
| Destinos | 23 | Fichas principales |
| Atractivos | 61 | Fichas principales |
| Experiencias | 30 | Registros asociados, sin aprobación inferida |
| Circuitos | 15 | Registros asociados; sin inventar paradas |
| Agenda | 2 | Fechas originales y metadata, sin completar faltantes |
| Servicios | 18 | Registros privados de investigación |
| Multimedia | 18 | Referencias/derechos originales, sin transferir binarios automáticamente |
| Fuentes | 234 | Trazabilidad privada |
| Evidencias | 756 | Evidencias privadas |
| Datos_variables | 146 | Datos y vigencia originales; siguen privados |
| Relaciones | 91 | Relaciones fuente explícitas |
| Pendientes | 64 | Bloqueantes/consultas originales |
| Jurisdicciones | 24 | Catálogo fuente con su namespace |
| Expansion_Santa_Fe | 19 | Propuestas preservadas; no nuevas fichas autorizadas |
| Gobernanza | 82 | Reglas/contexto original |
| Diccionario | 258 | Diccionario original |
| Exportacion_piloto | 119 | 35 propuestas históricas sin versión + 84 propuestas de la versión vigente |
| **Total** | **2.015** | Filas de origen, no cantidad de entidades nuevas |

Las **84 fichas principales = 23 destinos + 61 atractivos** se validan con la selección explícita del importador PR17. Las 119 propuestas no son 119 entidades: su clave incluye lote, tabla, registro y versión. Las 84 vigentes corresponden a `F8-PR07-PR08-20261023-v1`. No se reasignan IDs por similitud de nombres. Los dos destinos ya publicados por PR19/20 son proyecciones aprobadas de registros existentes, no altas adicionales.

Se resolvieron **4.671 referencias de origen** a IDs presentes. Incluyen fuentes, evidencias, entidades, jurisdicciones, destinos, bloqueantes y componentes condicionados. `lote_id` identifica el lote y `consulta_grupo_id` conserva la agrupación en JSON; no se inventan tablas destino para esos valores. El grafo no sustituye los contratos de relaciones publicables.

## Repositorio

| Catálogo | Registros |
| --- | ---: |
| `public/data/provincias.json` | 24 |
| `public/data/actividades.json` | 72 |
| `public/data/escapadas.json` | 23 |
| Santa Fe: agencias | 22 |
| Santa Fe: eventos | 22 |
| Santa Fe: noticias | 2 |
| Santa Fe: oficinas | 16 |
| Santa Fe: planes | 17 |
| Santa Fe: preguntas frecuentes | 5 |
| `content/escapadas/` | 24 |
| **Total de registros fuente** | **227** |

Se reutilizan los IDs y namespace del mapa PR9 para los tres catálogos generales. Los seis catálogos Santa Fe sin ID de origen conservan localizador de fila; los borradores conservan su ID editorial nativo. Los **23 registros de guías existentes y 24 borradores no significan 47 escapadas nuevas**: representan capas distintas, cuya correspondencia debe aprobarse antes de normalizar. Los 24 borradores siguen retenidos; ninguno publicable. Los JSON públicos derivados no generan copias adicionales del maestro en staging.

**Plan inicial: 2.242 registros fuente, 0 actualizaciones, 0 escrituras públicas.** Replanificando contra el estado resultante simulado: 0 altas, 0 cambios y 2.242 idénticos. Alterando un solo registro en memoria: 1 actualización y 2.241 idénticos. No se modificó el snapshot para estos ensayos.

## Archivos y capacidad

Inventario reproducible mediante `scripts/supabase/reconcile.mjs`, reutilizando `media-inventory.mjs`; incluye archivos de `public/`, los tres XLSX fuente y seis originales de publicidad. Excluye capturas históricas de PR y material de revisión para no inflar capacidad turística. Reporte privado conserva ruta, MIME, tamaño, dimensiones, SHA-256, referencias estáticas, duplicados y bucket propuesto.

| Grupo | Archivos | Bytes |
| --- | ---: | ---: |
| Imágenes turísticas | 306 | 234.682.284 |
| PDF turísticos/seguridad | 24 | 633.579.423 |
| Santa Fe | 6 | 46.781 |
| XLSX generales fuente | 3 | 47.764 |
| Originales de publicidad | 6 | 1.023.560 |
| Otros recursos públicos (fuentes, derivados, etc.) | 26 | 1.617.851 |
| **Total** | **371** | **870.997.663** |

863.515.454 bytes únicos por hash, 12 grupos duplicados. Son candidatos para revisar, no autorización para borrar ni migrar. Los seis archivos del grupo Santa Fe también son XLSX: son nueve libros fuente en total (tres generales + seis de Santa Fe), sin duplicar su peso entre grupos.

`public/pdf/formosa.pdf`: **57.013.841 bytes**, supera el límite actual de 50.000.000 bytes por objeto. No se alteró. El volumen bruto ronda 831 MiB antes de crecimiento, copias, evidencias nuevas y tráfico; no alcanza para certificar que el plan Free sea suficiente. La capacidad remota disponible y el costo real deben confirmarse; no se ampliaron límites ni se cargaron archivos.

La disponibilidad local no acredita licencia de publicación. Derechos, rutas finales de Storage, coordenadas, datos faltantes, aprobaciones y correspondencias entre namespaces quedan como decisiones explícitas para PR25.
