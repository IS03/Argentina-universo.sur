import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import SeguirExplorando from "@/components/ui/SeguirExplorando";
import { ROUTES, INTERNAL_ANCHORS } from "@/lib/site-links";
import NavegacionSantaFe from "./NavegacionSantaFe";
import type { IdSeccionSantaFe } from "./secciones";

interface PaginaSantaFeProps {
  actual: Exclude<IdSeccionSantaFe, "resumen" | "preguntas-frecuentes">;
  titulo: string;
  bajada: string;
  children: React.ReactNode;
}

// Marco común de las cinco subsecciones de Santa Fe: cabecera con ruta de navegación, chips de
// secciones y enlazado interno al pie. Reemplaza la barra lateral y las migas propias de PR11.
export default function PaginaSantaFe({ actual, titulo, bajada, children }: PaginaSantaFeProps) {
  return (
    <>
      <EncabezadoPagina
        migas={[
          { href: ROUTES.home, etiqueta: "Inicio" },
          { href: ROUTES.provincias, etiqueta: "Provincias" },
          { href: ROUTES.provincia("santa_fe"), etiqueta: "Santa Fe" },
        ]}
        antetitulo="Santa Fe · Región Litoral"
        colorAntetitulo="text-region-litoral"
        titulo={titulo}
        bajada={bajada}
      />
      <div className="contenedor py-8 sm:py-12">
        <NavegacionSantaFe actual={actual} />
        <div className="mt-8 sm:mt-10">{children}</div>
        <SeguirExplorando
          enlaces={[
            { href: ROUTES.provincia("santa_fe"), etiqueta: INTERNAL_ANCHORS.turismoEnProvincia("Santa Fe"), icono: "casa" },
            { href: ROUTES.actividadesPorProvincia("santa_fe"), etiqueta: INTERNAL_ANCHORS.verActividadesEnProvincia("Santa Fe"), icono: "brujula", prefetch: false },
            { href: ROUTES.provincias, etiqueta: INTERNAL_ANCHORS.verTodasLasProvincias, icono: "mapa" },
          ]}
        />
      </div>
    </>
  );
}
