import { getAgendaSantaFe } from "@/lib/data";
import AgendaSantaFe from "@/components/santa-fe/AgendaSantaFe";
import PaginaSantaFe from "@/components/santa-fe/PaginaSantaFe";
import { staticPageMetadata } from "@/lib/seo";

export const metadata = staticPageMetadata("/provincias/santa_fe/eventos");

export default async function EventosPage() {
  const { vigentes, anteriores } = await getAgendaSantaFe();

  return (
    <PaginaSantaFe
      actual="eventos"
      titulo="Calendario de Eventos en Santa Fe"
      bajada="Consultá los próximos eventos, las actividades en curso y el archivo de eventos anteriores de Santa Fe."
    >
      <AgendaSantaFe vigentes={vigentes} anteriores={anteriores} />
    </PaginaSantaFe>
  );
}
