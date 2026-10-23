import Actividades from "@/components/ActividadesContent";
import { TODAS_LAS_PROVINCIAS } from "@/lib/catalog";
import { staticPageMetadata } from "@/lib/seo";

export const metadata = staticPageMetadata("/actividades");

// /actividades?provincia=… se sirve desde ./por-provincia/[provincia] (rewrite en next.config).
export default function ActividadesPage() {
  return <Actividades seleccionInicial={TODAS_LAS_PROVINCIAS} />;
}
