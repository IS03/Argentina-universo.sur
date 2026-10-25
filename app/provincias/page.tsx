import ViajeArgentina from "@/components/ViajeArgentina";
import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import { getProvincias } from "@/lib/data";
import { ROUTES, INTERNAL_ANCHORS } from "@/lib/site-links";
import { staticPageMetadata } from "@/lib/seo";
import SeguirExplorando from "@/components/ui/SeguirExplorando";

export const metadata = staticPageMetadata("/provincias");

export default async function ProvinciasPage() {
  const provincias = await getProvincias();

  return (
    <>
      <EncabezadoPagina
        migas={[{ href: ROUTES.home, etiqueta: "Inicio" }]}
        antetitulo="Viaja por Argentina"
        titulo="Provincias de Argentina"
        bajada="Descubrí las provincias argentinas y sus destinos imperdibles"
      />
      <div className="contenedor py-10 sm:py-14">
        <ViajeArgentina provincias={provincias} />
        <SeguirExplorando
          enlaces={[
            { href: ROUTES.actividades, etiqueta: INTERNAL_ANCHORS.verActividades, icono: "brujula" },
            { href: ROUTES.escapadas, etiqueta: INTERNAL_ANCHORS.verEscapadas, icono: "documento" },
            { href: ROUTES.seguridad, etiqueta: INTERNAL_ANCHORS.guiaSeguridad, icono: "escudo" },
          ]}
        />
      </div>
    </>
  );
}
