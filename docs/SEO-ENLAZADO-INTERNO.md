# Guía SEO: Enlazado interno

Convenciones para enlaces internos: texto ancla descriptivo, jerarquía clara y sin links rotos.

## 1. Rutas y textos ancla centralizados

- **Archivo**: `lib/site-links.ts`
- **Uso**: Todas las URLs internas y textos ancla se definen ahí para:
  - Evitar links rotos (una sola fuente de verdad).
  - Mantener texto ancla descriptivo y consistente.
  - Ayudar a Google a entender la jerarquía del sitio.

### Rutas (`ROUTES`)

- `home`, `provincias`, `actividades`, `escapadas`, `seguridad`
- `provincia(slug)`, `actividad(slug)`, `actividadesPorProvincia(slug)`

### Textos ancla

- **Navbar/Footer** (`NAV_ANCHORS`): "Inicio - Argentina Universo Sur", "Viajar por provincias de Argentina", "Qué hacer: actividades turísticas por provincia", etc.
- **Bloques en páginas** (`INTERNAL_ANCHORS`): "Ver todas las provincias de Argentina", "Ver qué hacer en {provincia}", "Ver guías de escapadas en PDF", etc.

## 2. Jerarquía del sitio (para Google)

```
Inicio (/)
├── Provincias (/provincias)
│   └── Provincia (/provincias/[slug])
│       └── Actividades por provincia (/actividades?provincia=slug)
├── Actividades (/actividades)
│   └── Actividad (/actividades/[slug])
├── Escapadas (/escapadas)
└── Seguridad (/seguridad)
```

- Desde **Inicio** se enlaza a Provincias (CTA principal), Actividades, Escapadas y Seguridad.
- Cada **página de sección** (Provincias, Actividades, Escapadas, Seguridad) tiene enlaces a Inicio y a las otras secciones relacionadas.
- Las **páginas de detalle** (provincia, actividad) enlazan a Inicio, listado padre y contenido relacionado (ej. actividad → provincia, escapadas).

## 3. Dónde se aplica en el código

| Lugar | Qué se hace |
|-------|-------------|
| **Navbar** | Usa `ROUTES` y `NAV_ANCHORS` para todos los enlaces internos; `aria-label` descriptivo. |
| **Footer** | Enlaces rápidos con `ROUTES` + `NAV_ANCHORS`; incluye Inicio. |
| **Home** | CTA "Ver todas las provincias" + bloque de enlaces a Actividades, Escapadas, Seguridad. |
| **Provincias** | Enlaces a Inicio, Actividades, Escapadas, Seguridad. |
| **Provincia [slug]** | CTA "Ver qué hacer en {provincia}" + enlaces a Inicio, Ver todas las provincias, Escapadas. |
| **Actividades** | Enlaces a Inicio, Provincias, Escapadas, Seguridad. |
| **Actividad [slug]** | Enlaces a Turismo en {provincia}, Actividades, Inicio. |
| **Escapadas / Seguridad** | Enlaces a Inicio, Provincias, Actividades y entre sí. |
| **ProvinciaCard** | `aria-label`: "Ver turismo y destinos en {provincia}". |
| **ActividadCard** | `aria-label`: "Ver {actividad} en {localizacion}". |

## 4. Buenas prácticas

- **Texto ancla descriptivo**: Evitar "click aquí" o "más info"; usar frases como "Ver todas las provincias de Argentina", "Ver qué hacer en Santa Fe".
- **No links rotos**: Usar siempre `ROUTES` para hrefs; al cambiar una ruta, se actualiza en un solo archivo.
- **Jerarquía**: En cada página incluir enlaces hacia arriba (Inicio, listado) y hacia contenido relacionado (otras secciones).
- **Accesibilidad**: En cards que son un solo enlace, usar `aria-label` descriptivo en el `<Link>`.

## 5. Santa Fe (subsecciones)

- Las páginas bajo `/provincias/santa_fe/` (planes, eventos, oficinas, agencias, noticias) usan `Breadcrumb` y `SidebarNavigation` con enlaces a "Santa Fe - Inicio" y entre secciones.
- Los hrefs de la sidebar están definidos en `components/santa-fe/SidebarNavigation.tsx`.

Al añadir nuevas páginas, definir la ruta en `lib/site-links.ts` y enlazar desde/y hacia las páginas relacionadas con texto ancla descriptivo.
