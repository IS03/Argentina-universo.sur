# Observabilidad — Vercel Web Analytics y Speed Insights

## Integración

`app/layout.tsx` monta una única instancia de `Analytics` desde
`@vercel/analytics/next` y `SpeedInsights` desde `@vercel/speed-insights/next`,
después de `children`. Se usan las integraciones específicas del App Router,
con soporte de navegación cliente, sin convertir el layout en componente cliente
ni añadir scripts manuales o eventos personalizados.

Versiones fijadas en este PR: `@vercel/analytics` 2.0.1 y
`@vercel/speed-insights` 2.0.0, verificadas en el registro al implementarlo.
Se mantiene el modo automático del SDK; no se fuerza producción o debug en desarrollo.

Referencias actuales: [Web Analytics: inicio](https://vercel.com/docs/analytics/quickstart),
[Speed Insights: inicio](https://vercel.com/docs/speed-insights/quickstart).

## Proyecto y activaciones manuales

Proyecto: **argentina-universo.sur**, equipo **Ignacio Senestrari's projects**.
El PR prepara el código y utiliza el Preview generado por GitHub; no modifica
planes, protección del despliegue, DNS ni ajustes de cobro del proyecto.

1. En el proyecto de Vercel, abrir **Analytics** y comprobar si Web Analytics está
   habilitado. Si aparece **Enable**, habilitarlo desde el panel. Esta activación
   agrega las rutas de recolección al siguiente despliegue.
2. Si se habilita después de haberse generado el Preview, volver a desplegar ese
   Preview. Después de fusionar el PR, comprobar también el despliegue de producción.
3. Abrir **Speed Insights**. Según la documentación vigente (septiembre de 2026), la
   integración básica está disponible en todos los planes y los despliegues incluyen
   automáticamente sus endpoints. **Speed Insights Plus** es una ampliación opcional;
   no es un requisito para incorporar este SDK. El comando de CLI que habilita
   Speed Insights puede contratar Plus: no se ejecuta en este PR.
4. Abrir el sitio sin bloqueadores y revisar Network: los scripts de Analytics y
   Speed Insights deben responder 200. Habitualmente usan `/_vercel/insights/script.js`
   y `/_vercel/speed-insights/script.js`; la plataforma puede asignar rutas únicas.
   Navegar entre páginas y comprobar las solicitudes de recolección.
5. Si un script responde 404, confirmar la activación del producto y desplegar de
   nuevo. No añadir rutas falsas ni respuestas locales 200 para simular recolección.
6. Revisar los paneles con el filtro de entorno correcto. La aparición de visitas
   o métricas depende de tráfico real y del tiempo de procesamiento; cargar el
   componente o compilar correctamente no prueba que el panel ya tenga datos.

Referencias: [Analytics: solución de problemas](https://vercel.com/docs/analytics/troubleshooting),
[Speed Insights: configuración](https://vercel.com/docs/speed-insights/package).

## Dominio oficial en Vercel

1. En **Settings → Domains**, confirmar `www.argentinauniversosur.com` asociado a
   producción y con HTTPS válido.
2. Revisar `argentinauniversosur.com`: en la comprobación inicial devolvía **307**
   hacia `www`. Cambiar esa redirección de dominio a **308 permanente**, conservando
   rutas y query strings, si sigue configurada como temporal. La regla del panel
   precede a las reglas de Next.js y el código del PR no puede sustituirla.
3. Mantener el alias estable del proyecto (`argentina-universosur.vercel.app`) por
   compatibilidad. La aplicación lo redirige al dominio oficial sin capturar los
   hosts de ramas/Preview. No confundirlo con el hostname inexistente que aparecía
   antes en la metadata: `argentina-universo-sur.vercel.app`.
4. Conservar Deployment Protection para los Preview y no enviarlos a Search Console.

Estas comprobaciones del panel quedan como pasos manuales; no se presupone que
las activaciones o ajustes estén realizados por el mero hecho de fusionar el PR.
