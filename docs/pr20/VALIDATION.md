# Validación y mediciones — PR20

## Controles locales

| Control | Resultado |
| --- | --- |
| Lint y TypeScript | Correctos; sin advertencias de lint |
| Validaciones de datos, editoriales, imágenes y PDF | Correctas; no cambian contratos o decisiones |
| Unitarias | 161 aprobadas (cuatro pruebas nuevas del generador de listas) |
| E2E Next | 149 aprobadas, nueve omisiones previstas por entorno |
| E2E Pages / Wrangler / consentimiento | 96 aprobadas, dos omisiones del prototipo Workers fuera de alcance |
| Builds Next y Pages (Preview / production-audit / consent-test) | Correctos |
| SEO Next y los tres modos Pages | 108 URLs y cero errores; canonicals, OG, sitemap, robots y redirects preservados |
| Capturas y navegación | Seis vistas por versión: 1440 px, Pixel 7 y 320 px; cero desbordes/anclas rotas |
| Contraste y foco | Seis vistas, 121/138 muestras de texto por ficha, mínimo 5,05:1; foco visible de 3 px |
| Seguridad editorial | 24 Escapadas retenidas, Rosario y datos privados del maestro fuera del artefacto |

La prueba integral compara literalmente cada párrafo y ubicación con los JSON aprobados y conserva títulos/SEO, fotografías, créditos y mapas. Se prueba contenido sin JS, el índice con teclado a 320 px, las cinco acciones del planificador, portapapeles denegado, Web Share ausente/cancelado, impresión y ausencia de escrituras en almacenamiento/cookies o solicitudes externas. Las APIs de compartir/portapapeles/impresión se interceptan durante E2E para no modificar el portapapeles del equipo, abrir diálogos o enviar datos. La disponibilidad real del selector nativo depende del navegador y sistema operativo; existe alternativa manual.

La primera ejecución del test de 320 px detectó una limitación del localizador de texto de Playwright sobre el propio elemento `noscript`. Se comprobó el HTML real y se ajustó el localizador al párrafo hijo, manteniendo JavaScript deshabilitado. No se omitió la prueba ni se alteró el contenido para hacerla pasar. La inspección visual también corrigió el salto de línea del ordinal 03 en el índice.

## Rendimiento comparativo local

Mismo servidor estático `scripts/pages/serve.mjs`, Chrome, tres corridas por ficha/perfil y caché fría. Escritorio 20 Mbps / 40 ms añadidos / CPU 1×; Pixel 7 1,6 Mbps / 150 ms / CPU 4× / DPR 2,625. El servidor local comprime texto con gzip; no interviene un CDN ni un optimizador de imágenes. No son métricas de campo ni una medición de INP. Las cancelaciones HEAD de comprobación de enlaces de Next se distinguen de errores de recursos.

| Ficha / perfil | LCP antes → después | CLS máximo después | Bytes antes → después | Solicitudes antes → después |
| --- | ---: | ---: | ---: | ---: |
| Santa Fe / escritorio | 164 → 160 ms | 0 | 457228 → 461379 | 35 → 36 |
| Alta Gracia / escritorio | 156 → 172 ms | 0 | 466588 → 470667 | 35 → 36 |
| Santa Fe / móvil | 1884 → 1888 ms | 0 | 465175 → 469337 | 20 → 21 |
| Alta Gracia / móvil | 1864 → 1864 ms | 0 | 464171 → 468263 | 20 → 21 |

Las diferencias de unos milisegundos no permiten afirmar una mejora estadística. El costo observado del planificador y CSS es de unos 4 KB transferidos y una solicitud local adicional por ficha. No hay solicitudes a `/_next/image` ni a servicios externos. Mismas variantes: escritorio 960w (49734 / 58010 B), Pixel 7 1280w (87970 / 85882 B); las ocho variantes suman 352332 B, sin cambios.

Reproducir: `node scripts/pr20/measure.mjs http://127.0.0.1:4490 before` o `after`, con el export correspondiente servido en ese puerto y sin otras pruebas de navegador ejecutándose. Los resultados se guardan en `.artifacts/pr20/reports/`.

## Integridad editorial

Se verificó ausencia de diferencias de Git frente a `main` en `content/destinos/`, `lib/destinos/authorized.ts` y `public/media/review/`. El validador conserva ocho pins y verifica nuevamente los dos payloads y los ocho archivos WebP. No se emitieron nuevas decisiones ni autorizaciones.

| Ficha | SHA-256 de payload R2, intacto |
| --- | --- |
| Santa Fe capital | `e1aeed28652e5de80021ec37f756611c50ff72220878d3e6632c7511a571d721` |
| Alta Gracia | `6250a983aad83b6d2ae4e986e23e5850d30f6daa1a135021fdf456422b91afec` |

Los otros seis hashes de alcance/evidencia/medios permanecen fijados, sin cambios, en el manifiesto público mínimo heredado de PR19. No se copian al repositorio los objetos privados usados originalmente para calcularlos. La auditoría local adicional usa el snapshot privado del maestro y el lote R2 para buscar IDs/textos retenidos y binarios fotográficos no autorizados en los cinco artefactos públicos: Next static/prerendered y los tres modos Pages. Los informes no contienen el maestro ni extractos privados.

## Tamaño y límites

Export Preview local: **106375881 B / 2056 archivos**; multimedia existente 80357184 B. `docs/` y sus capturas quedan fuera del despliegue. Los PDF siguen en sus URLs vigentes; que el export no los empaquete no significa que hayan sido retirados.

El muestreo de contraste y las pruebas de teclado no constituyen una certificación WCAG completa. La compatibilidad histórica sin JS de consultas `?provincia=` sigue dependiendo de las reglas de zona documentadas previamente; no se cambia en este PR.

## Verificación remota

La descripción del PR enlazará los checks del commit exacto, el Preview de Cloudflare y el resultado de su comprobación remota. No se crea infraestructura nueva ni se promueve producción manualmente. [Ver comparativas y funcionamiento](README.md).
