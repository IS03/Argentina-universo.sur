import { getNoticiasSantaFe } from "@/lib/data";
import NoticiasSection from "@/components/santa-fe/NoticiasSection";
import PaginaSantaFe from "@/components/santa-fe/PaginaSantaFe";
import { staticPageMetadata } from "@/lib/seo";

export const metadata = staticPageMetadata("/provincias/santa_fe/noticias");

export default async function NoticiasPage() {
  const noticias = await getNoticiasSantaFe();

  return (
    <PaginaSantaFe
      actual="noticias"
      titulo="Noticias de Santa Fe"
      bajada="Últimas noticias y actualizaciones sobre turismo en Santa Fe"
    >
      <NoticiasSection noticias={noticias} />
    </PaginaSantaFe>
  );
}
