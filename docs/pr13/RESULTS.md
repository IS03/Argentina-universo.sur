# Verificación PR13

Base: `origin/main` d92af641dd7149f266badc8799edc4ba43fe9ef0 (PR12 fusionado). Rama `codex/pr13-escapadas-investigacion`. Investigación consultada el 24/10/2026; las pruebas nocturnas registran también fechas UTC del 25/10, sin atribuir esa fecha de build a contenido turístico nuevo.

| Comprobación local | Resultado |
|---|---|
| Lint | Sin advertencias de ESLint |
| TypeScript | Tipos de rutas y `tsc --noEmit` correctos |
| `validate` | Catálogos, assets, contratos existentes, tipos de DB locales y PR13 correctos; ninguna conexión remota a Supabase |
| `editorial:check` / `editorial:check-pr13` | 23 guías relacionadas + El Palmar; 20 nuevos borradores, 0 publicables, 0 retiradas |
| `editorial:plan` | Dry-run; ninguna escritura ni redirección activa; las retiradas continúan bloqueadas |
| Unitarias | 97/97; incluye inyección de cada borrador en HTML, RSC, JS, JSON y sitemap, referencias privadas bajo campos inocuos y aviso Moconá |
| Build Next.js | Correcto |
| Auditoría editorial Next | 24 retenidos; 132 HTML, 23 archivos JS y auxiliares prerenderizados; cero errores |
| SEO Next | 106 URLs canónicas; cero errores |
| E2E Next.js | 109 aprobadas, 9 omisiones previstas por viewport; escritorio y móvil, filtros, navegación, mapas, consentimiento, enlaces PDF y rutas retenidas |
| Builds estáticos | production-audit, consent-test y Preview correctos; seguridad editorial reforzada reejecutada sobre los tres artefactos finales |
| SEO estático | 106 URLs y 126 recursos en cada modalidad; cero errores |
| Pruebas Pages | 70 aprobadas; 2 omisiones de casos específicos de Workers, que no se implementan en esta arquitectura |
| Seguridad de Pages | Los tres artefactos retienen 24 fichas; cero coincidencias de textos/rutas de borrador o datos privados en HTML/RSC/JS/JSON/índices/sitemap y auxiliares |
| Lectura remota | 24/24 PDF de producción: HEAD 200, MIME PDF y tamaño esperado; 24/24 rutas retenidas: HEAD 404 en Preview existente |
| Originales | 24 PDF con identidad y hash preservados; cuatro fichas anteriores idénticas byte a byte; ninguna fotografía modificada |

La lectura remota se registra en `pdf-link-check.json`, sin descarga de los cuerpos PDF. **Se verificó el Preview que ya existía, no un despliegue remoto de esta rama.** No se crearon recursos ni se cambió producción. `evidence/` contiene resúmenes locales reproducibles, sin trazas del maestro ni capturas privadas.

El build de análisis `production-audit` mide 735.380.153 bytes incluyendo los 24 PDF; no es candidato de carga a Pages por los archivos que superan el límite individual. El Preview candidato mide **101.810.268 bytes (101,81 MB decimales; 97,09 MiB), 2038 archivos y cero archivos sobredimensionados**. Sus fotografías optimizadas preexistentes suman 80.004.852 bytes y sus fallback 222.371 bytes. Conserva los enlaces absolutos de los PDF en Vercel: no se ha conseguido independencia completa de ese proveedor. No se añadieron variantes ni imágenes nuevas. No se comparan huellas de builds distintas como si fueran un ahorro atribuible a esta investigación.

## Alcance editorial y carencias

Las veinte fichas tienen texto y estructura para revisión, pero todas conservan equivalencia parcial y pendientes. **Jujuy, San Luis, Entre Ríos y Río Gallegos** señalan además carencias centrales; los informes individuales detallan exactamente qué fuentes y temas faltan. No se declaran veinte reemplazos completos. Se mantuvieron los vacíos donde no fue posible corroborar el contenido específico; no se rellenaron con información provincial genérica.

Las propuestas fotográficas son instrucciones de selección, no cuarenta fotografías identificadas o autorizadas. Todos los originales, titulares, licencias y evidencias permanecen pendientes. El registro de fuentes tiene 81 entradas institucionales con títulos, fechas, afirmaciones y límites; los horarios y precios sin vigencia suficiente no se publican.

## Incidencias y límites

- El test anterior fijaba cuatro fichas. Se ajustó para permitir nuevos borradores y se añadió una comprobación estricta de los veinte IDs/lotes y del total de 24. Los validadores también detectaron categorías de sección faltantes e ID con acento durante la preparación; quedaron corregidos antes de la batería final.
- Build y Playwright emiten el aviso de entorno `NO_COLOR`/`FORCE_COLOR`; no es un fallo de TypeScript, lint ni prueba.
- Sitios oficiales con 403, timeout, contenido dinámico no legible y contradicciones se identifican en `CONTRADICTIONS.md`. No se consideran verificados porque devuelvan 200 ni se infiere una reapertura desde un error de consulta.
- Los reportes heredados de build conservan advertencias genéricas de PR11 sobre cuenta/reglas, derechos y privacidad: no representan verificaciones remotas nuevas. Las reglas del dominio definitivo continúan fuera del alcance.
- La auditoría automatizada comprueba contratos y artefactos; no reemplaza investigación crítica, revisión humana, derechos de imagen, comprobación presencial ni la decisión de equivalencia.
- El registro privado de correspondencias con Drive permanece ignorado por Git y no se adjunta a CI ni al PR. No hubo escritura al maestro ni importación de fichas.
