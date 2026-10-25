# Validación — PR18

Verificaciones locales con Node según el proyecto y Google Chrome instalado. El CI usa datos sintéticos: las pruebas reales se ejecutaron solo en el workspace privado autorizado.

| Control | Resultado local |
| --- | --- |
| `npm run check` | Lint sin advertencias, TypeScript, validaciones, 147 pruebas unitarias, build Next, seguridad editorial, SEO y E2E correctos |
| E2E Next | 125 aprobadas, 9 omisiones previstas por condiciones de entorno |
| Unitarias nuevas de revisión | 9 aprobadas: clasificación/relaciones/identidades, hashes/fuentes, decisiones nulas, proyección, licencia/recorte, SSR y servidor restringido, filtraciones de texto y medios |
| Build estático Pages | Preview, production-audit y consent-test correctos; tres auditorías SEO de 106 URLs sin errores |
| E2E Pages/consentimiento/Wrangler | 72 aprobadas, 2 omitidas correspondientes al prototipo Workers fuera de alcance |
| Revisión privada real | 3 fichas × escritorio/móvil = 6; navegación nativa, teclado, referencias, imágenes decodificadas, sin scripts, desbordes, errores de página ni solicitudes fallidas |
| Aislamiento con maestro privado | 0 rutas Work públicas, 0 entradas privadas rastreadas; 5 artefactos auditados sin filtraciones |
| Exclusión del nuevo lote | 3 textos/rutas y 3 fotografías/originales/variantes ausentes de Next estático/prerenderizado y de los 3 builds Pages |
| `editorial:plan` | Dry-run; 0 escrituras y 0 redirecciones activadas; los reemplazos PDF siguen bloqueados |

Después del ajuste visual de citas se repitieron lint, TypeScript, unitarias, build Next y auditorías; se construyeron los tres modos de Pages y ejecutó la suite Pages con ese ajuste. Las 24 Escapadas siguen retenidas. No hay cambios en `app/`, `public/`, `content/` ni migraciones Supabase; los 24 PDF originales permanecen intactos.

## Alcance de la auditoría privada

- Next: `.next/static` y archivos públicos prerenderizados HTML/RSC/metadatos de `.next/server/app`; no se confunden chunks privados del servidor con archivos servidos al navegador.
- Pages: carpetas completas `preview`, `production-audit`, `consent-test`.
- Con el maestro: búsqueda de identidades/textos privados originales y marcadores editoriales.
- Con el lote: búsqueda de párrafos/SEO/rutas propuestos y hashes binarios de imágenes, incluso con nombres distintos.
- Entradas públicas: se impide importar las herramientas privadas o el componente de revisión desde rutas `app/`.

La suite sintética comprueba que copiar texto o una variante renombrada al artefacto hace fallar la auditoría. Rechaza destinos/atractivos retenidos, relaciones incorrectas, componentes numéricos pendientes y decisiones humanas simuladas. El servidor devuelve 404 sin clave o ante JSON/Markdown/originales, 403 con Host/Origin ajeno, 405 ante escrituras y 409 ante alteración de un archivo permitido.

## Imágenes y peso

En navegador se observó la selección por DPR: escritorio de 1440 px usa variante 640 para imagen CSS de aproximadamente 552 px; Pixel 7 usa variante 1280 para aproximadamente 380 px CSS y DPR 2,625. Transferencias de imagen: Rosario 24.424/73.778 B; Santa Fe 26.872/76.620 B; Alta Gracia 8.702/24.524 B, escritorio/móvil. Sin `/_next/image`. Dimensiones explícitas; capturas inspeccionadas y sin desbordamiento horizontal. Esto no es una medición de campo de LCP o CLS.

El build Preview público resultó en **105.382.445 B / 2.035 archivos**, sin PDF empacados, conservando los enlaces vigentes. Las fotos privadas (366.026 B) no se añaden al despliegue. Las limitaciones de migración y privacidad de PR11–17 siguen vigentes; el éxito del build no autoriza trasladar el dominio.

## Evidencia y comprobaciones remotas

Los logs, informes detallados, copias institucionales y capturas están en `.artifacts/pr18/`, fuera de Git. El PR debe enlazar sus checks de GitHub Actions y Cloudflare del commit exacto. No se despliega la carpeta privada; el Preview remoto solo permite comprobar que el sitio existente continúa y que las nuevas rutas permanecen ausentes. Una lectura local de fuentes no acredita inspección presencial, actualización de horarios ni aprobación humana.
