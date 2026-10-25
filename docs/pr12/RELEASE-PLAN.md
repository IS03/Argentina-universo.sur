# Publicación, retirada y reversión

## Secuencia por guía

1. Revisar el texto exacto y sus fuentes, relaciones, mapas y medios. Investigación, candidatura y aprobación son estados distintos. El permiso previo de El Palmar no completa su revisión; su ficha tampoco sustituye toda Entre Ríos.
2. Registrar la decisión humana y el permiso de publicación en la fuente versionada, vinculados al hash revisado. Verificar que las imágenes tengan autorización propia, atribución y variantes locales. El PR actual no realiza ninguna de estas aprobaciones.
3. Publicar primero el HTML aprobado y probar contenido completo, canonical, sitemap, enlaces, lectura sin JS, accesibilidad móvil y recursos. Mantener el PDF accesible durante esta etapa. No utilizar contenido incompleto como sustitución aparente.
4. Comparar el alcance y los temas del PDF con el HTML. La equivalencia requiere una revisión humana separada, que identifica hash del PDF y del texto destino. Una guía provincial puede necesitar varias fichas y una página índice; un solo parque no representa toda la provincia.
5. Crear un respaldo del original bajo responsabilidad del titular, privado y fuera de ambos despliegues. Verificar bytes, SHA-256 y una restauración real antes de declarar el respaldo completo. Git conserva historia, pero no es la única prueba de un respaldo independiente. No se creó infraestructura ni respaldo remoto en este PR; todos los campos están pendientes.
6. Autorizar expresamente la retirada. La simulación `editorial:plan` comprueba decisiones, identidad, hash y respaldo, pero **no comprueba por sí misma la existencia de un archivo remoto ni ejecuta cambios**. Un futuro ejecutor deberá verificar los bytes del respaldo y el destino 200 antes de aplicar nada.
7. Preparar el 308 exacto de cada ruta histórica al HTML equivalente. Probar Unicode, query, `HEAD`, bucles, CDN y lectura sin JS tanto en el alojamiento anterior como en Cloudflare. No redirigir todos los PDF a la portada. No activar redirects a drafts. Mantener un período de convivencia validado por el responsable.
8. Recién entonces retirar la copia del despliegue público en un PR específico. Conservar el respaldo; no reescribir historia Git. Regenerar inventario y pruebas, y observar errores de rutas antiguas antes de dar por terminada esa guía.

`planPdfRetirement` solo produce propuestas cuando pasan todos sus controles. Cambiar texto, relación, destino o PDF invalida los hashes de las revisiones anteriores. Aprobar un texto no autoriza eliminar un archivo.

## Seguridad

El PDF de recomendaciones para un verano seguro se conserva aparte, con su identidad y 1.368.481 bytes. `/seguridad` continúa funcionando. Requiere determinar alcance, vigencia y fuentes competentes para cada consejo, revisar derechos y obtener aprobación específica; no se sustituyen recomendaciones sanitarias o de emergencias mediante una conversión automática.

## Reversión

- Este PR: revertir sus commits restaura la presentación y componentes anteriores. No hay DNS, servicios remotos, pagos, datos de Supabase ni archivos retirados que restaurar. El Palmar y sus decisiones no se modifican. Las rutas públicas de PDF y las 106 URLs SEO se conservan.
- Publicación posterior: conservar manifiesto con commit, hashes, fuente, medios y decisiones humanas. Retirar una ficha del catálogo publicado o revertir su commit devuelve 404 al detalle y lo quita del sitemap; revisar antes los enlaces y cualquier redirect activo.
- Retirada posterior de PDF: si falla el reemplazo, restaurar el original desde el respaldo verificado en la ruta exacta y retirar su redirect. Desplegar la corrección antes de volver a anunciar la descarga. Una copia guardada solo en un despliegue que se va a eliminar no sirve como plan de reversión.
- Traslado futuro del dominio: registrar previamente DNS/TLS/correo, release y reglas. Realizar el corte únicamente con autorización separada, pruebas del destino y retorno probado al alojamiento anterior. No se ejecuta un corte en este PR.

## Condiciones para dejar Vercel

- Todas las descargas que hoy apuntan a Vercel tienen HTML equivalente aprobado, probado y con su ruta antigua resuelta, o una alternativa de alojamiento autorizada en la cuenta del titular. Hoy esto **no está cumplido**.
- Imágenes con derechos acreditados y variantes locales; sin dependencia de `/_next/image` para el sitio estático ni transformaciones pagas. Se conservan originales y atribuciones.
- Cuenta Cloudflare Free y servicios definitivos del responsable, con build reproducible, Preview aprobado y límites vigentes comprobados. No usar cuotas de otras aplicaciones ni habilitar facturación automáticamente.
- Revisar la política de privacidad y los proveedores antes del corte. GA4 mantiene consentimiento; nunca cargarlo en Preview ni antes de aceptar. La retirada de Vercel Analytics/Speed Insights debe acompañarse de la revisión ya preparada en PR11, sin alterar producción antes del traslado.
- Verificar los filtros heredados por query mediante las reglas de zona, alias `catarmaca`, canonicals, sitemap, 106 rutas existentes, PDF antiguos, mapas y comportamiento móvil en la cuenta real. El Preview público por sí solo no prueba reglas del dominio definitivo.
- Plan separado para DNS, alias histórico de Vercel, caché y reversión; mediciones y comprobaciones desde Argentina. El PR no cancela Vercel, modifica DNS ni crea servicios pagos.

El Preview actual sin PDF ya evita copiar unos 634 MB al nuevo despliegue, pero sigue dependiendo del origen anterior para las descargas. La independencia solo se logra al resolver esos enlaces, no al ocultar archivos en un build.
