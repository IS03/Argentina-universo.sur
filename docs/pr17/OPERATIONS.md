# Operación privada y publicación futura

## Preparar una lectura coherente

1. Utilizar exclusivamente el acceso autorizado al maestro original; no usar hojas públicas inventadas, credenciales de otra aplicación ni copias como nueva fuente de verdad.
2. Leer metadatos del archivo y de las 18 pestañas (título, ID, grilla); registrar modificación/revisión antes de los datos. Leer encabezados exactos y rangos finitos hasta la última fila con ID. Detectar truncamientos antes de asumir que se completó una pestaña.
3. Capturar valores `UNFORMATTED_VALUE` y conservarlos. Para columnas de fecha, capturar `effectiveValue`, `formattedValue`, `effectiveFormat.numberFormat` y fórmula original cuando exista. No ejecutar fórmulas localmente ni inferir años/fechas desde texto libre.
4. Construir el envelope de PR9 con `source.kind:"work"`, `revision`, `capturedAt` UTC, `modifiedBefore`, `modifiedAfter`, `proposalVersion` explícita, `tables` y la selección verificada de 84 pares pestaña/ID. No seleccionar las 119 propuestas ni ampliar el alcance con entidades de contexto.
5. Agregar `dateCells`, objeto privado indexado por `pestaña/ID/campo`: `{type:"DATE", serial:<valor efectivo>, display:<formato mostrado>, formula?:<fórmula>}`. La conversión requiere coincidencia exacta del serial con el payload, entero y tipo DATE. DATETIME/fracciones y formatos sin metadatos quedan bloqueados, sin truncar horarios.
6. Volver a leer la modificación del archivo después de los valores y del contraste de celdas. Si cambia, descartar/repetir la captura; no mezclar revisiones. Antes de un ejecutor futuro será necesaria una revisión congelada o confirmada adicionalmente.
7. Guardar exclusivamente en `.artifacts/pr17/private/` (directorio `0700`, archivos `0600`). No adjuntar snapshots ni planes completos a issues, PR, logs o artifacts de CI. No usar `public/`, `content/`, Google Sheets públicos ni secretos `NEXT_PUBLIC_*`.

El conector se usa como transporte de lectura autorizado; la CLI es offline y no contiene OAuth, descargas, Supabase ni un modo `apply`. Este PR no agrega procesos periódicos ni acceso remoto al build.

## Ejecutar

```sh
npm run import:dry-run -- .artifacts/pr17/private/snapshot.json
npm run import:dry-run -- .artifacts/pr17/private/snapshot.json --previous=.artifacts/pr17/private/snapshot.json --output=.artifacts/pr17/private/repeated-plan.json
```

El plan completo queda privado y el proceso devuelve 0 solo si pasa el contrato. Stdout muestra cantidades/códigos agregados, nunca IDs, URLs, textos o mensajes de error originales. `canStage:true` significa **apto para preparación privada**, no aprobado/publicable. El importador no escribe remotamente ni cambia archivos de contenido.

Los registros originales, sus estados y propuestas se conservan separados de los estados locales de preparación. Los ausentes nunca se borran. Un cambio en una fuente/evidencia altera el checksum/hash de preparación aunque el texto no cambie. La clasificación numérica identifica sus componentes por ID y entidad; no los convierte en información práctica ni autoriza importes.

## Demostración sintética y pruebas de aislamiento

```sh
npm run build
npm run editorial:preview-work
# Servir solo el fixture sintético local; nunca exponer .artifacts/ completo:
python3 -m http.server 4420 --bind 127.0.0.1 --directory .artifacts/pr17/synthetic-preview
npm run editorial:audit-work -- --private-snapshot=.artifacts/pr17/private/snapshot.json
```

La demostración rechaza argumentos y no carga un snapshot real. Usa 84 fichas sintéticas, muestra un destino con sus atractivos, fuentes/mapa/datos prácticos de prueba y una ilustración generada por código en WebP a 400/800 px. Los derechos sintéticos no acreditan ninguna fotografía real. El preview local no se incorpora a Pages y no hay un servidor editorial con datos reales.

El build y `validate` bloquean rutas/importaciones públicas de Work en esta fase. Las auditorías Next/Pages rechazan claves editoriales, canarios, referencias originales reconocibles, entradas privadas y borradores de Escapadas. La auditoría local adicional busca los IDs efectivos y fragmentos largos de textos retenidos (perfiles, descripciones, hallazgos, propuestas y trazas) en HTML, RSC, JS, JSON, sitemap y auxiliares, también comprimidos. Así también detecta una copia literal que omita los IDs; no pretende identificar todas las paráfrasis posibles. Los informes de seguridad no incluyen las cadenas buscadas. En CI no se comparte el snapshot; se ejecutan fixtures/mutaciones y reglas genéricas.

## Publicación posterior — requiere otro PR

1. Confirmar selección/revisión del maestro, resolver incidencias y conciliar jurisdicciones/categorías/rutas sin coincidencias automáticas por nombres.
2. Definir un contrato de proyección pública con whitelist por campo. No copiar `originalPayload`, evidencias, datos variables, notas, contactos de investigación, permisos ni previsualizaciones.
3. Revisar las afirmaciones de esa proyección contra sus fuentes y fechas. Tratar por separado geografía, logística, cifras, vigencias y licencias fotográficas. Resolver o excluir explícitamente los seis componentes numéricos observados; no modificar el maestro desde un script de build.
4. Presentar al responsable el texto exacto, medios, exclusiones, relaciones y hash. Registrar una decisión humana de esa versión/campos. Después, registrar un permiso independiente para el canal público. Una celda histórica o `reviewHash` de preparación no basta.
5. Asignar IDs públicos opacos a anclas y relaciones; mantener los IDs originales solo en conciliación privada. Crear rutas/canónicas en un PR revisable que habilite expresamente el bloqueo actual. Repetir auditorías de filtración, SEO, móvil, mapas y consentimiento antes de publicar.
6. Si se decide activar Supabase en otra fase, verificar proyecto/cuenta autorizada, aplicar transacciones idempotentes a staging privado con controles de PR9 y validar RLS en un entorno autorizado. No es un paso de este PR.

## Reversión

La fuente pública actual no cambia. Revertir este PR elimina herramientas/controles/componentes nuevos sin alterar las 106 URLs ni los PDF. Los snapshots privados se conservan o eliminan localmente según decisión del responsable, nunca mediante un commit. No hay transacción remota, dominio, proveedor, GA4 ni despliegue de producción que revertir. Conservar las copias originales y los 24 borradores de Escapadas.
