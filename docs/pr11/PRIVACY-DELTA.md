# Privacidad: cambios propuestos para revisión del responsable

La política de producción no se editó. La variante Pages ya está preparada bajo `AUS_STATIC_EXPORT=1` en el componente; antes de publicar el Preview y antes de trasladar el dominio debe aprobarse esa variante. Vercel conserva el texto y servicios actuales. Esto documenta comportamiento técnico; no presume una aprobación legal ni afirma exenciones de consentimiento.

En la variante Pages de `app/privacidad/page.tsx`:

- Sustituir el párrafo de Vercel Web Analytics/Speed Insights por: «Esta versión no utiliza Vercel Web Analytics ni Speed Insights. No se ha activado Cloudflare Web Analytics.» Los SDK quedan sin montar en el build estático; en Vercel siguen funcionando.
- Actualizar Alojamiento: «Esta versión estática se sirve desde Cloudflare Pages. El proveedor procesa los datos técnicos de las solicitudes para entregar y proteger el servicio. Los enlaces a documentos que permanecen en el sitio anterior se rigen también por su política.» Confirmar alcance/retención/encargos con la configuración real del titular.
- Reemplazar/agregar el enlace de privacidad de Cloudflare según dónde se sirvan los documentos. No declarar que los PDF se migraron cuando el Preview todavía enlaza los existentes.
- Conservar responsable, canal de derechos, Google Analytics, cookies, almacenamiento local e información de OpenStreetMap. Mantener que no hay publicidad. Revisar contactos y fecha editorial real; no usar fecha de cada build como revisión legal.

GA4: se conserva el consentimiento básico, sin envíos antes de aceptar, con revocación, limpieza de cookies, vigencia y sincronización entre pestañas. Pages requiere habilitación explícita de producción/rama y el hostname oficial. Un Preview o alias no puede activar GA4. En pruebas se usa un ID ficticio, Google se intercepta y el hostname oficial se representa mediante respuestas locales; no se envían eventos a una propiedad real.

Antes de usar el ID real fuera de Vercel: revisar la configuración de propiedad/dominio/retención, medir una única visita por navegación, comprobar aceptación/rechazo/revocación y revisar proveedores/transferencias. No añadir Cloudflare Web Analytics, publicidad, métricas de campañas u otros beacons sin revisar nuevamente este documento y la política pública.

Referencias del proveedor para el responsable: [privacidad Cloudflare](https://www.cloudflare.com/privacypolicy/), [cookies de Cloudflare según servicios activados](https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/). No se habilitaron servicios de seguridad adicionales ni se presumió una lista de cookies distinta de la que se mida en el futuro Preview.
