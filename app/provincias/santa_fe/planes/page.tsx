import { getPlanesSantaFe } from "@/lib/data";
import PlanesSection from "@/components/santa-fe/PlanesSection";
import PaginaSantaFe from "@/components/santa-fe/PaginaSantaFe";
import { staticPageMetadata } from "@/lib/seo";

export const metadata = staticPageMetadata("/provincias/santa_fe/planes");

export default async function PlanesPage() {
  const planes = await getPlanesSantaFe();

  return (
    <PaginaSantaFe
      actual="planes"
      titulo="Planes e Ideas en Santa Fe"
      bajada="Descubrí todas las propuestas y planes turísticos que Santa Fe tiene para ofrecerte"
    >
      <PlanesSection planes={planes} />
    </PaginaSantaFe>
  );
}
