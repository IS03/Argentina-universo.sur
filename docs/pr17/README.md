# PR17 — Integración controlada de Work

Base: `main` de PR16 (`17ddb3be72cbe45cd0b3164aecc0c913f62da99e`). Este PR prepara y contrasta la importación privada. No incorpora contenido del maestro al catálogo público.

Se consultó el maestro original mediante el conector autorizado de Google Drive, exclusivamente en lectura. Se comprobaron las 18 pestañas, sus encabezados y las dependencias de las 84 fichas principales: **23 destinos y 61 atractivos**. La selección se construyó con sus IDs reales, nunca con nombres, provincias, números de fila o slugs. No se modificó el maestro ni se creó otro.

El dry-run **real** procesa 84 fichas: 55 candidatas acotadas, 3 con decisión numérica independiente (6 componentes) y 26 borradores retenidos. Las 119 propuestas de `Exportacion_piloto` incluyen 35 históricas y 84 de la versión documental seleccionada explícitamente. Se comprobó que las 84 propuestas vigentes tienen revisión humana pendiente y publicación no autorizada. Ninguna categoría autoriza publicar.

El resumen agregado y sin identidades está en [dry-run-summary.json](dry-run-summary.json). El snapshot, sus metadatos de celda, IDs, textos, evidencias, propuestas y diagnósticos completos permanecen **solo en `.artifacts/pr17/private/`**, ignorado por Git. No son un adjunto del PR ni un artefacto de Cloudflare. El acceso local a estos archivos requiere conservar permisos privados. No subirlos como artifact de CI.

## Recorrido de revisión

- [AUDIT.md](AUDIT.md): inconsistencias encontradas, alcance de la lectura y límites de la verificación.
- [MAPPING.md](MAPPING.md): correspondencia de campos, relaciones e identidades con PR9/PR15.
- [OPERATIONS.md](OPERATIONS.md): preparación reproducible, dry-run, seguridad, revisión y futura publicación.
- [RESULTS.md](RESULTS.md): verificaciones locales/remotas y limitaciones.

La presentación reutiliza `components/destinos/` mediante un adaptador **privado** y `DestinoArticle`, probado con **84 registros sintéticos distintos de los reales**. No hay rutas `/destinos` ni carga del maestro desde Next.js. La demostración se genera únicamente en una carpeta local ignorada y no acepta un snapshot real como argumento.

Las 24 escapadas conservan exactamente sus estados, permisos y contenido. Las 106 URLs canónicas, los PDF, las analíticas y el consentimiento continúan utilizando sus fuentes actuales. La rama deshabilita su Preview automático de Vercel mediante la misma configuración local empleada en PR10–14; no se cambió ninguna configuración remota ni producción.

## Pendiente antes de publicar Work

Conciliar jurisdicciones y categorías explícitamente; revisar textos, afirmaciones, geografía, datos prácticos y derechos fotográficos; resolver por separado los componentes numéricos; crear una proyección pública por campos permitidos; obtener revisión humana y permiso independiente de esa versión/canal. Luego un PR específico habilitará rutas y modificará el bloqueo actual con pruebas de seguridad. Este PR no contiene un exportador público, un panel de aprobación ni un ejecutor SQL.

La integración editorial no habilita Supabase, publicidad, AdSense ni el traslado de dominio. Esas fases mantienen sus autorizaciones y requisitos de privacidad propios.
