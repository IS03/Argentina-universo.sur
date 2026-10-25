# Próxima revisión y retirada progresiva

## PR14 propuesto

Revisar un lote pequeño por vez, empezando por las tres fichas de B01 y la ficha adicional de El Palmar ya preparadas. Después, elegir con el responsable las fichas de B02–B06 con alcance suficiente. Ninguna queda lista para aprobar por cantidad de palabras, validación JSON o número de URLs.

Para cada texto: resolver carencias centrales y contradicciones; verificar fuentes específicas y condiciones cambiantes; elegir fotografías con original, autor, licencia o permiso y atribución; generar variantes con el sistema existente solo tras autorización. Leer el documento de revisión completo y su hash. La revisión humana y el permiso de publicación son decisiones independientes y deben quedar identificadas según el contrato vigente, sin cambiar la política.

Las fichas nuevas tienen cobertura temática parcial. Las guías de varias localidades o regiones pueden necesitar fichas complementarias y una página de enlace aprobada; no redirigir una guía provincial a un contenido urbano incompleto. No dar por aprobado un registro de Work por reutilizar su fuente. La reconciliación privada preserva las identidades, pero no importa ni publica las 84 fichas.

## Antes de retirar cada PDF

1. Comparar todos los temas del original con el HTML exacto y determinar suficiencia de una o varias páginas.
2. Obtener revisión humana de equivalencia vinculada al hash del PDF y al hash del texto; permiso de publicación independiente.
3. Guardar el binario fuera de los despliegues públicos, comprobar tamaño y SHA-256 y probar restauración. Git conserva los originales, pero no sustituye el respaldo externo requerido.
4. Desplegar y comprobar la página equivalente, sus fuentes, fotografías, accesibilidad, recursos y SEO; después autorizar expresamente la retirada.
5. Cambiar enlaces y habilitar 301/308 desde la ruta concreta del PDF al reemplazo equivalente. Validar sin bucles, conservar canonical y sitemap; nunca enviar todas las guías a la portada.
6. Probar restauración y reversión antes de suprimir la dependencia de Vercel. El documento de seguridad requiere un proceso propio.

Los 20 PDF aquí estudiados suman 544.637.578 bytes (544,64 MB decimales; 519,41 MiB). El conjunto de 23 guías mantiene 632.210.942 bytes y, con seguridad, 633.579.423 bytes. **Ahorro actual: cero bytes.** Ninguna autorización de retirada, respaldo externo ni equivalencia se presume. Los borradores no añaden multimedia al despliegue de Pages; el incremento se limita al material editorial del repositorio.

## Traslado futuro y reversión

Vercel debe conservar sus recursos mientras el Preview usa los PDF de producción. Para completar el traslado hacen falta reemplazos equivalentes y aprobados, respaldo restaurable, destinos de redirección probados, pruebas de recursos y SEO y autorización separada de dominio/proveedores. No se toca DNS en este PR.

Revertir este PR restaura el catálogo editorial previo y sus controles de revisión; no hay migración de datos, cambio público de contenido ni retirada de originales que deshacer. Para una futura retirada, revertir enlaces y reglas de la guía afectada y restaurar el binario verificado. Conservar el registro de decisiones humanas e identidades; no reescribir historia Git.

Los objetivos de costo cercano a cero, publicación futura de las 84 fichas, rediseño integral y publicidad directa/AdSense se mantienen como fases posteriores. Activar publicidad requerirá contenidos aprobados, revisión de derechos, privacidad y consentimiento antes de integrar scripts.
