import { publishedTrips } from "@/content/escapadas";
import PublishedTrips from "@/components/escapadas/PublishedTrips";
import EscapadasContent from "@/components/EscapadasContent";
import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import SeguirExplorando from "@/components/ui/SeguirExplorando";
import EspacioPublicitario from "@/components/publicidad/EspacioPublicitario";
import Aviso from "@/components/ui/Aviso";
import { getEscapadas } from "@/lib/data";
import { ROUTES, INTERNAL_ANCHORS } from "@/lib/site-links";
import { staticPageMetadata } from "@/lib/seo";

export const metadata = staticPageMetadata("/escapadas");

export default async function EscapadasPage() {
  const escapadas = await getEscapadas();
  const pesos = escapadas.map(e => e.pesoBytes).filter((b): b is number => b !== null);
  const mb = (bytes: number) => Math.round(bytes / 1_000_000);

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
        {pesos.length > 0 && (
          <div className="mb-8 max-w-3xl">
            <Aviso titulo="Antes de descargar">
              Cada guía es un PDF de entre {mb(Math.min(...pesos))} y {mb(Math.max(...pesos))} MB. Si estás con datos móviles, conviene abrirlas con wifi.
            </Aviso>
          </div>
        )}
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
