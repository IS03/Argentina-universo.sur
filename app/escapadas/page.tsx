import { publishedTrips } from "@/content/escapadas";
import PublishedTrips from "@/components/escapadas/PublishedTrips";
import EscapadasContent from "@/components/EscapadasContent";
import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import SeguirExplorando from "@/components/ui/SeguirExplorando";
import EspacioPublicitario from "@/components/publicidad/EspacioPublicitario";
import { getEscapadas } from "@/lib/data";
import { ROUTES, INTERNAL_ANCHORS } from "@/lib/site-links";
import { staticPageMetadata } from "@/lib/seo";

export const metadata = staticPageMetadata("/escapadas");

export default async function EscapadasPage() {
  const escapadas = await getEscapadas();

  return (
    <>
      <EncabezadoPagina
        migas={[{ href: ROUTES.home, etiqueta: "Inicio" }]}
        antetitulo="Viajes cortos"
        titulo="Escapadas en Argentina"
        bajada="Ideas para descubrir ciudades, paisajes y experiencias de Argentina. Consultá también nuestras guías en PDF."
      />
      <div className="contenedor py-10 sm:py-14">
        <EspacioPublicitario id="escapadas-antes-guias" className="mb-10 sm:mb-12" />
        <PublishedTrips trips={publishedTrips} />
        {/* Las guías originales siguen accesibles mientras se revisan sus reemplazos. */}
        <EscapadasContent escapadas={escapadas} />
        <SeguirExplorando
          enlaces={[
            { href: ROUTES.provincias, etiqueta: INTERNAL_ANCHORS.verTodasLasProvincias, icono: "mapa" },
            { href: ROUTES.actividades, etiqueta: INTERNAL_ANCHORS.verActividades, icono: "brujula" },
            { href: ROUTES.seguridad, etiqueta: INTERNAL_ANCHORS.guiaSeguridad, icono: "escudo" },
          ]}
        />
      </div>
    </>
  );
}
