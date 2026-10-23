import Actividades from "@/components/ActividadesContent";
import { staticPageMetadata } from "@/lib/seo";

export const metadata = staticPageMetadata("/actividades");

export default function ActividadesPage() {
  return <Actividades />;
}
