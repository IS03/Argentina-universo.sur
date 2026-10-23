import Actividades from "@/components/ActividadesContent";
import { getActividades, getProvinciasEnOrdenDeCatalogo } from "@/lib/data";
import { resumirActividad } from "@/lib/catalog";
import { staticPageMetadata } from "@/lib/seo";

export const metadata = staticPageMetadata("/actividades");

export default async function ActividadesPage() {
  const [actividades, provincias] = await Promise.all([getActividades(), getProvinciasEnOrdenDeCatalogo()]);
  return (
    <Actividades
      actividades={actividades.map(resumirActividad)}
      provincias={provincias.map(({ provincia, slug }) => ({ provincia, slug }))}
    />
  );
}
