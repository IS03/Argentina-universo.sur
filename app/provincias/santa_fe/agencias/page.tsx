import { getAgenciasSantaFe } from "@/lib/data";
import AgenciasSection from "@/components/santa-fe/AgenciasSection";
import PaginaSantaFe from "@/components/santa-fe/PaginaSantaFe";
import { staticPageMetadata } from "@/lib/seo";

export const metadata = staticPageMetadata("/provincias/santa_fe/agencias");

export default async function AgenciasPage() {
  const agencias = await getAgenciasSantaFe();

  return (
    <PaginaSantaFe
      actual="agencias"
      titulo="Agencias de Viajes en Santa Fe"
      bajada="Contactá con las agencias de viajes autorizadas en Santa Fe para planificar tu viaje"
    >
      <AgenciasSection agencias={agencias} />
    </PaginaSantaFe>
  );
}
