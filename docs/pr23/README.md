# PR23 · Espacio comercial opcional en el pie de página

## Pedido del responsable

El pie de página contenía el logo fijo «Santa Fe | Todo por conocer» en un recuadro blanco debajo de la descripción de Argentina Universo Sur. Ese lugar debe servir para un banner contratado y, cuando no exista ninguna campaña válida asignada, debe quedar sin publicidad ni un bloque vacío.

## Implementación

- Se retiró la imagen fija `/img/logo-santa-fe-turismo-color-1.svg` del JSX del footer (el archivo original no se elimina).
- Se añadió `footer-patrocinio` a `ESPACIOS` en `lib/publicidad.ts`.
- `components/Footer.tsx` monta `<EspacioPublicitario id="footer-patrocinio" className="mt-6" />` entre la descripción institucional y las redes sociales.
- `EspacioPublicitario` ya devuelve `null` si no hay campañas activas en esa ubicación. Por eso, **ahora el footer no muestra anuncio ni reserva altura**.
- No se han reasignado las seis campañas existentes: las ubicaciones contratadas no se pueden inferir del nombre o la creatividad del banner.
- Se conservan logo del sitio, redes sociales, enlaces, derechos y el resto del footer. No se agregaron imágenes, dependencias, cookies ni rastreo.

## Asignar una campaña cuando haya confirmación comercial

1. Confirmar con el titular qué creatividad tiene pagada **la ubicación del footer**, su vigencia y, si corresponde, su URL de destino.
2. En `lib/publicidad.ts`, cambiar la propiedad `ubicacion` **de la campaña autorizada** a `"footer-patrocinio"` y dejar `activa: true`.
3. Si se requiere mostrar **la misma** campaña en el footer **y también** en su ubicación actual, no duplicar contratos por suposición: hay que definir esa distribución y extender el modelo antes de publicar.
4. Si deja de estar autorizada para el footer, cambiar `activa: false` o retirar su asignación. El componente queda oculto sin ocupar lugar.
5. Reconstruir y desplegar para reflejar cambios en la exportación estática de Cloudflare Pages.

Se conserva la presentación original de los banners, incluida su animación y el respeto por `prefers-reduced-motion`. Si en el futuro hay varios anuncios pagados en la misma ranura y se acuerda una rotación, implementarla en un cambio separado: **este PR no agrega rotación automática**.

## Verificación

`tests/publicidad.test.mjs` incluye controles para:
- ranura reconocida en el registro;
- ausencia de campañas y de HTML de anuncio cuando no está asignada ninguna;
- sustitución del logo fijo por la ranura en el componente del footer;
- preservación de redes sociales y enlaces de navegación;
- asignación y desactivación de una campaña ficticia en pruebas.

La CI del PR debe verificar además lint, TypeScript, builds Next/Pages y la regresión del sistema publicitario. No se ejecutó una build local por medio del conector de GitHub.

## Alcance

Sin cambios en las seis creatividades ni en sus ubicaciones públicas vigentes; sin modificación de permisos, datos turísticos, Supabase, consentimiento, dominios o despliegue a producción.
