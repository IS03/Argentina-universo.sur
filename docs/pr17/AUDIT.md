# Auditoría de contratos y lectura autorizada

## Hallazgos y correcciones

1. **IDs:** PR9 usa un UUIDv5 interno de `(origen, pestaña, ID original)`. PR15 espera el ID editorial en `Destino.id`. Se conservan ambos por separado: `internalId` para staging; `originalIdentity.originalId` y `Destino.id` para la revisión privada. No se deriva identidad del nombre ni se sustituye el ID original.
2. **Fechas:** `UNFORMATTED_VALUE` devuelve fechas de Sheets como números de serie. El validador previo interpretaba ocho de esos números como fechas inválidas en campos que ya comprobaba; ampliar los controles sin decodificar las celdas produciría miles de falsos errores. Se leyeron los `CellData` de las columnas de fecha. Solo se convierten números enteros cuyo tipo observado sea `DATE` y cuyo valor coincida con el snapshot. Se conservan valor original, formato mostrado, fórmula cuando existe y hash de la celda. No se interpretan cadenas localizadas ni números sin metadatos. Se decodificaron 2.778 celdas de fecha. El formato visible puede ser ISO o `dd/mm/yyyy` según la celda.
3. **Dependencias:** `Expansion_Santa_Fe` contiene IDs que ya utilizan evidencias y relaciones, pero PR9 no los indexaba como IDs originales. Se corrige la omisión y se reconocen las relaciones documentadas; esas filas siguen como contexto privado, sin convertirse en destinos ni ampliarse la selección.
4. **Propuestas:** 119 filas no equivalen a 119 fichas. Se selecciona una versión explícita y se exige una propuesta inequívoca por cada par pestaña/ID. No se elige «la última» por orden de filas.
5. **Decisiones:** `publicable`, dictámenes documentales, previsualizaciones y celdas aisladas de aprobación no son decisiones humanas verificables. Se preservan en el payload privado; el resultado preparado queda siempre `draft / review:null / publicationAuthorized:false / approvalStatus:pending / publicationPermitted:false`.
6. **Logs y archivos:** antes se imprimían errores con IDs y la protección del output solo comprobaba un prefijo de ruta. Ahora stdout contiene únicamente cantidades/códigos; los detalles quedan privados. Se rechazan symlinks, rutas fuera de `.artifacts/`, entradas legibles por otros usuarios, flags desconocidos y modos de escritura remota. El output usa archivo temporal, permisos `0600` y rename atómico.
7. **Modelo visual:** un destino no es automáticamente una localidad administrativa; no se inventan localidades. Las propuestas prácticas, coordenadas y fotografías del maestro no se copian automáticamente al componente.

## Alcance de la consulta

Se usaron metadatos con límites de grilla, encabezados y rangos finitos por pestaña, seguido de lecturas de las columnas de fecha con `CellData`. Los metadatos de modificación del archivo permanecieron iguales antes y después de los valores y del contraste de fechas. El proveedor no devolvió una revisión transaccional de Sheets: la comprobación detecta cambios declarados durante la lectura, pero no sustituye una exportación congelada/confirmada para una futura aplicación real.

Se preservaron las pestañas de contexto y soporte, sin incorporarlas a las 84 entidades seleccionadas. El manifiesto de rangos y los metadatos detallados están en el área privada local. No se leyeron ni editaron otros documentos privados de Drive en este PR. No se necesita una nueva credencial para el dry-run realizado; un futuro operador necesitará acceso de lectura al mismo maestro y a sus metadatos de celda.

## Qué quedó validado y qué no

El dry-run final no detecta errores estructurales: identidad, selección, relaciones existentes/tipadas, duplicados, fechas, URLs HTTPS, fuentes, evidencias y componentes numéricos pasan el contrato. Repetir el snapshot deja las 84 entidades `unchanged`.

Esto **no verifica nuevamente el contenido de las 234 fuentes externas**, la actualidad operativa de cada atractivo, la precisión de cada coordenada ni los derechos de las 18 filas de multimedia. No se considera que HTTP 200 pruebe una afirmación: el importador no hace solicitudes a esos enlaces. Los estados parciales, contradictorios, vencidos y los pendientes documentales originales permanecen íntegros y aparecen en `reviewFindings` o en el soporte privado. No se resolvieron contradicciones editoriales automáticamente.

No se ejecutó ninguna consulta, migración ni advisor contra Supabase remoto. Las migraciones versionadas siguen sin cambios. Las pruebas de PostgreSQL existentes se ejecutan localmente con PGlite: no acreditan un proyecto remoto configurado.

## Referencias técnicas públicas

- [Representación de fechas y formatos de Google Sheets](https://developers.google.com/workspace/sheets/api/guides/formats#about_date_and_time_values): números de serie desde 30/12/1899; formato/locale independientes del valor.
- [DateTimeRenderOption](https://developers.google.com/workspace/sheets/api/reference/rest/v4/DateTimeRenderOption): comportamiento de `UNFORMATTED_VALUE` y `SERIAL_NUMBER`.
- [RLS y grants de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security): se revisó la documentación y el changelog actuales; PR17 no cambia el esquema ni requiere actualizaciones remotas. Se mantiene la separación entre esquema privado, grants y políticas de PR9.
