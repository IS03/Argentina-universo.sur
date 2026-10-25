import Link from "next/link";
import ActividadCard from "@/components/ActividadCard";
import { EstadoVacio } from "@/components/ui/Bloques";
import { GRILLA_ACTIVIDADES } from "@/components/ui/grillas";
import { boton } from "@/components/ui/estilos";
import { ROUTES } from "@/lib/site-links";
import type { ActividadResumen } from "@/lib/catalog";

// Grilla compartida por las dos variantes del filtro. Las pruebas ubican las tarjetas por el
// aria-labelledby de la sección: no cambiar ese id.
export default function GrillaActividades({ actividades }: { actividades: ActividadResumen[] }) {
  return (
    <section aria-labelledby="actividades-por-provincia-heading" className="mt-8 sm:mt-10">
      <h2 id="actividades-por-provincia-heading" className="sr-only">Actividades por provincia</h2>
      {actividades.length > 0 ? (
        <div className={GRILLA_ACTIVIDADES}>
          {actividades.map((actividad) => (
            <ActividadCard key={actividad.actividadSlug} actividad={actividad} />
          ))}
        </div>
      ) : (
        <EstadoVacio
          titulo="No se encontraron actividades para la provincia seleccionada."
          accion={<Link href={ROUTES.actividades} className={boton("secundario")}>Ver todas las actividades</Link>}
        >
          Revisá el nombre de la provincia o elegí otra en el filtro.
        </EstadoVacio>
      )}
    </section>
  );
}
