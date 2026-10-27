# Estado remoto y activación pendiente

Auditoría de solo lectura realizada el 26/27 de octubre de 2026 mediante la conexión Supabase disponible:

| Control | Resultado |
| --- | --- |
| Organización visible | IS03 |
| Plan informado por la organización | Free |
| Proyecto dedicado `argentina-universo-sur` | No existe en la lista accesible |
| Otros proyectos | Pertenecen a otras aplicaciones; no se consultaron sus tablas, claves o buckets ni se reutilizaron |
| Organización autorizada expresamente para esta alta | Pendiente de confirmación |
| Cotización concreta, cupo aplicable y costos aceptados | Pendientes |
| Creación, vinculación o migraciones remotas | No realizadas |
| Importación de investigación real | No realizada |
| Pruebas reales remotas de RLS/Storage | Pendientes; pruebas locales reales completas en VALIDATION.md |

Se solicitó confirmar IS03 antes de consultar la cotización. La herramienta `get_cost` exige confirmar primero la organización; la creación exige además aceptar el costo devuelto. La instrucción del usuario también condiciona la aplicación remota a autorización. Por eso no se creó un recurso por inferencia ni se tomó acceso a otras aplicaciones como autorización.

La [tarifa oficial consultada](https://supabase.com/pricing) ofrece Free a USD 0 con máximo de dos proyectos activos, 500 MB de base por proyecto, 1 GB de archivos, 5 GB de egreso y pausa por inactividad. Pro parte de USD 25/mes, con consumo y proyectos adicionales según tarifa. **Esto no es una cotización ni certifica cupo disponible.** El inventario bruto de archivos es aproximadamente 831 MiB; hay que sumar crecimiento, evidencias, copias y egreso. Un PDF ya excede el máximo por objeto configurado. No se cambió plan, límite ni facturación.

## Lo que falta exactamente

1. Confirmar la organización IS03 o indicar otra organización autorizada; verificar derechos de administración/facturación.
2. Consultar `get_cost` para esa organización y un proyecto; confirmar cupo, límites aplicables y región. Obtener aceptación explícita de costo/plan/posibles consumos antes de crear.
3. Crear **un proyecto nuevo** llamado exactamente `argentina-universo-sur`. Revisar identidad, organización, región y estado antes de vincular. No reciclar ni renombrar un proyecto ajeno.
4. Autorizar explícitamente aplicación del esquema. Revisar el SQL de las tres migraciones y el inventario/historial remoto antes de `db push`. Nunca `db reset` remoto. Mantener `editorial` fuera de los esquemas expuestos y revisar autoexposición de tablas en el Dashboard remoto.
5. Ejecutar el SQL en el dedicado, comprobar historial, tipos y asesores de seguridad/rendimiento; revisar grants, RLS, funciones y visibilidad/MIME/límites de los tres buckets.
6. Ejecutar la matriz de permisos sobre fixtures sintéticos en ese proyecto: anon, authenticated, operador, borrador, versión aprobada, cambio de versión, archivos privados y URLs públicas. La prueba local no acredita la configuración del remoto.
7. Entregar credenciales al proceso operador mediante un gestor de secretos/variables privadas: `SUPABASE_ACCESS_TOKEN` para verificar identidad y `AUS_SUPABASE_IMPORT_KEY` para staging. No enviarlas por chat, GitHub ni archivos públicos. La web solo podría usar `SUPABASE_URL`, `SUPABASE_PROJECT_REF`, `SUPABASE_PUBLISHABLE_KEY` como variables de build/servidor; no `NEXT_PUBLIC_*` ni claves privilegiadas.
8. PR25: nueva lectura consistente del maestro, dry-run, revisión del informe y autorización separada de la importación de investigación. No implica aprobar/publicar ni mover automáticamente multimedia.

El transporte vuelve a consultar Management API antes de leer/escribir: nombre, ref, organización y `ACTIVE_HEALTHY` deben coincidir. El target remoto privado debe declarar `mode: remote`, `projectName: argentina-universo-sur`, `projectRef`, `organizationId`, `url`, `authorization.verifiedAt`; una escritura requiere además `authorization.staging: true`. Esa configuración registra una autorización humana ya obtenida; crear el archivo no constituye autorización por sí mismo.

La CLI de pruebas HTTP de este PR rechaza todo destino remoto. Una verificación remota futura requiere un procedimiento revisado para sus fixtures/limpieza; no basta cambiar la URL local.

Documentación oficial revisada: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [seguridad de API](https://supabase.com/docs/guides/api/securing-your-api), [Storage](https://supabase.com/docs/guides/storage/security/access-control). El changelog consultado anuncia cambios TLS para noviembre; la activación debe verificar nuevamente CLI/SDK/TLS vigentes.
