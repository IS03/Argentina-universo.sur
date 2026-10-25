import { getOficinasInformesSantaFe } from "@/lib/data";
import OficinasSection from "@/components/santa-fe/OficinasSection";
import PaginaSantaFe from "@/components/santa-fe/PaginaSantaFe";
import { staticPageMetadata } from "@/lib/seo";

export const metadata = staticPageMetadata("/provincias/santa_fe/oficinas");

export default async function OficinasPage() {
  const oficinas = await getOficinasInformesSantaFe();

  return (
    <PaginaSantaFe
      actual="oficinas"
      titulo="Oficinas de Información Turística en Santa Fe"
      bajada="Encontrá la oficina de información turística más cercana a tu destino"
    >
      <OficinasSection oficinas={oficinas} />
    </PaginaSantaFe>
  );
}
