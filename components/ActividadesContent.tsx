import ActividadesExplorer from "@/components/actividades/ActividadesExplorer";
import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import EspacioPublicitario from "@/components/publicidad/EspacioPublicitario";
import { anunciosDelEspacio } from "@/lib/publicidad";
import SeguirExplorando from "@/components/ui/SeguirExplorando";
import { ROUTES, INTERNAL_ANCHORS } from "@/lib/site-links";
import { getActividades, getProvinciasEnOrdenDeCatalogo } from "@/lib/data";
import { resumirActividad } from "@/lib/catalog";

// Server Component estático. Se prerenderiza una vez por filtro (todas, cada provincia y sin
// resultados), así el HTML ya muestra lo que pide ?provincia; el navegador solo cambia el filtro.
export default async function ActividadesContent({ seleccionInicial }: { seleccionInicial: string }) {
  const [actividades, provincias] = await Promise.all([getActividades(), getProvinciasEnOrdenDeCatalogo()]);
  // Una creatividad vertical va en columna lateral en escritorio (acompaña el scroll); en móvil, arriba.
  const lateral = anunciosDelEspacio("actividades-antes-explorador").some(a => a.imagen.alto > a.imagen.ancho);
  return (
    <>
      <EncabezadoPagina
        migas={[{ href: ROUTES.home, etiqueta: "Inicio" }]}
        antetitulo="Qué hacer"
        titulo="Actividades turísticas en Argentina"
        bajada="Descubrí las mejores actividades en cada provincia"
      />
      <div className="contenedor py-8 sm:py-12">
        <div data-publicidad-actividades className={lateral ? "xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start xl:gap-10" : undefined}>
          <div data-publicidad-columna={lateral ? "actividades" : undefined} className={lateral ? "xl:col-start-2 xl:row-start-1 xl:self-stretch" : undefined}>
            <EspacioPublicitario id="actividades-antes-explorador" className={`mb-10 sm:mb-12 ${lateral ? "xl:sticky xl:top-[calc(var(--alto-encabezado)+1.5rem)] xl:mb-0" : ""}`} />
          </div>
          <div className={lateral ? "min-w-0 xl:col-start-1 xl:row-start-1" : undefined}>
            <ActividadesExplorer
              key={seleccionInicial}
              actividades={actividades.map(resumirActividad)}
              provincias={provincias.map(({ provincia, slug }) => ({ provincia, slug }))}
              seleccionInicial={seleccionInicial}
            />
          </div>
        </div>
        <SeguirExplorando
          enlaces={[
            { href: ROUTES.provincias, etiqueta: INTERNAL_ANCHORS.verTodasLasProvincias, icono: "mapa" },
            { href: ROUTES.escapadas, etiqueta: INTERNAL_ANCHORS.verEscapadas, icono: "documento" },
            { href: ROUTES.seguridad, etiqueta: INTERNAL_ANCHORS.guiaSeguridad, icono: "escudo" },
          ]}
        />
      </div>
    </>
  );
}
