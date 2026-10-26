import ActividadesExplorer from "@/components/actividades/ActividadesExplorer";
import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import EspacioPublicitario from "@/components/publicidad/EspacioPublicitario";
import SeguirExplorando from "@/components/ui/SeguirExplorando";
import { ROUTES, INTERNAL_ANCHORS } from "@/lib/site-links";
import { getActividades, getProvinciasEnOrdenDeCatalogo } from "@/lib/data";
import { resumirActividad } from "@/lib/catalog";

// Server Component estático. Se prerenderiza una vez por filtro (todas, cada provincia y sin
// resultados), así el HTML ya muestra lo que pide ?provincia; el navegador solo cambia el filtro.
export default async function ActividadesContent({ seleccionInicial }: { seleccionInicial: string }) {
  const [actividades, provincias] = await Promise.all([getActividades(), getProvinciasEnOrdenDeCatalogo()]);
  return (
    <>
      <EncabezadoPagina
        migas={[{ href: ROUTES.home, etiqueta: "Inicio" }]}
        antetitulo="Qué hacer"
        titulo="Actividades turísticas en Argentina"
        bajada="Descubrí las mejores actividades en cada provincia"
      />
      <div className="contenedor py-8 sm:py-12">
        <EspacioPublicitario id="actividades-antes-explorador" className="mb-10 sm:mb-12" />
        <ActividadesExplorer
          key={seleccionInicial}
          actividades={actividades.map(resumirActividad)}
          provincias={provincias.map(({ provincia, slug }) => ({ provincia, slug }))}
          seleccionInicial={seleccionInicial}
        />
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
