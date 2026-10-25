# Decisiones humanas y siguientes fases

Ninguna casilla fue aprobada. No hay formularios públicos de revisión, firmas generadas, cambios de estado o permisos nuevos.

## Para cada una de las cuatro fichas piloto

1. Leer el [texto íntegro y su informe](REVIEW-INDEX.md) y decidir si el alcance propuesto es suficiente. CABA: guía urbana y complementos; Iguazú: ciudad/parque frente a excursiones regionales; Talampaya: dos parques frente a Jáchal/Huaco y otros destinos; El Palmar: parque específico, sin PDF propio.
2. Resolver o aceptar expresamente los pendientes editoriales que afectan al texto. Si se cambia cualquier párrafo, ubicación o metadato, regenerar el hash y revisar la versión resultante.
3. Reconfirmar los datos temporales para la fecha real de revisión. En Iguazú es imprescindible reverificar Garganta; el aviso histórico no acredita operación del resto del parque. No extender su fecha por regenerar un build.
4. Seleccionar fotografías o decidir una publicación sin ellas. Para cada selección: revisar archivo original, autor, permiso declarado, encuadre, otros derechos, pie, atribución y condiciones de las variantes. Los seis candidatos siguen sin aprobación de derechos. No basta con una imagen local ya optimizada.
5. Identificar al revisor humano, fecha y **hash exacto** de la versión aceptada. Solo una decisión posterior explícita puede completar ese registro; este PR no lo hace.
6. Decidir por separado el permiso de publicación. CABA, Puerto Iguazú y Talampaya siguen sin él. El Palmar conserva el permiso histórico: confirmar su alcance frente al texto enriquecido, sin inventar una nueva autorización ni aprobación del texto.

## Para cualquier retirada de PDF posterior

- Decidir equivalencia temática sobre el binario original y la versión HTML revisada; aceptar un resumen más corto no significa automáticamente equivalencia. [Matriz y recomendaciones](PDF-MATRIX.md).
- Completar páginas complementarias o reducir el alcance del reemplazo con una decisión documentada; nunca redirigir una guía amplia a un parque o localidad por conveniencia de almacenamiento.
- El responsable debe conservar respaldo fuera del despliegue, bajo su control, con bytes/hash del inventario y prueba de restauración. La presencia en Git es conservación, pero no se registra como respaldo externo verificado.
- Autorizar retirada y la redirección exacta301/308 por guía, vinculadas a hash PDF y hash del contenido. Sin aprobación no se activa nada.
- Publicar primero el HTML aprobado y comprobar acceso, imágenes, mapas, enlaces, canonical y sitemap en Preview. Solo después, con autorización, retirar el binario del artefacto y probar la redirección individual y su destino.
- El Palmar no retira ningún PDF. El documento de seguridad continúa separado y requiere revisión especializada.

Ahorro realizado en PR14: **0 bytes**. Los 24 PDF originales suman 633.579.423 bytes y continúan disponibles. El volumen elegible para retirada depende de decisiones individuales futuras; no se contabiliza hoy como ahorro de infraestructura.

## Próximo PR recomendado

Revisar humanamente el piloto, resolver derechos y decisiones de alcance, y completar las fuentes operativas marcadas. Registrar decisiones por hash sin aprobar el resto de fichas en bloque. Si se autoriza publicar alguna, hacerlo en un PR pequeño distinto, con pruebas de artefactos; separar la eventual retirada de PDF hasta verificar respaldo y equivalencia. Una observación caducada se vuelve a investigar: el generador no cambia fechas automáticamente.

## Necesidades de las fases futuras, sin implementarlas

| Fase | Necesidad a preservar |
|---|---|
|84 fichas de Work | Maestro privado único, IDs originales y relaciones verificadas; importación idempotente/dry-run, investigación separada de aprobación. Conciliación privada autorizada antes de llenar `masterRefs`. |
|Rediseño UX/UI | Secciones y ubicaciones estructuradas, fuentes, accesibilidad y distinción ciudad/región. Posibles guías complementarias no deben cambiar slugs históricos sin plan SEO. Soportar pies/licencias de fotos, avisos temporales y estados vacíos. |
|Publicidad directa/AdSense | Bloques identificados y separados del contenido editorial, reserva de dimensiones para CLS, reglas comerciales sin condicionar la selección turística. Revisar políticas/consentimiento y derechos comerciales de medios antes de activar scripts. No se añaden anuncios, eventos ni cookies. |
|Dominio definitivo en Pages | Mantener 106 URLs, alias histórico, filtros sin JS y URLs PDF hasta reemplazos aprobados. Cuenta del responsable, Preview/GA4 sin cambios, prueba de reglas del dominio y dependencia PDF de Vercel resuelta antes de tocar DNS. |

## Reversión

Antes de merge, cerrar el PR descarta la propuesta sin efecto en producción. Si se fusionara posteriormente, revertir el commit editorial restaura los ocho JSON y sus documentos/contratos; no hay migraciones remotas, borrados o redirecciones que deshacer. Los 16 textos restantes,24 PDF, catálogos y recursos públicos siguen idénticos. Mantener historial PR12/PR13 y la cadena de hashes para entender qué versión se revisó.
