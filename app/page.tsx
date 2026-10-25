import HomeContent from "@/components/HomeContent";
import { getActividades, getEscapadas, getProvincias } from "@/lib/data";
import { resumirProvincia } from "@/lib/catalog";
import type { Provincia } from "@/lib/catalog";
import { staticPageMetadata } from "@/lib/seo";

export const metadata = staticPageMetadata("/");

const slugsDestacadas = ["santa_fe", "cordoba", "buenos_aires"];

export default async function HomePage() {
  const [provincias, actividades, escapadas] = await Promise.all([getProvincias(), getActividades(), getEscapadas()]);
  const provinciasDestacadas = slugsDestacadas
    .map(slug => provincias.find(p => p.slug === slug))
    .filter((p): p is Provincia => p !== undefined);

  return (
    <HomeContent
      provinciasDestacadas={provinciasDestacadas.map(resumirProvincia)}
      totalActividades={actividades.length}
      totalEscapadas={escapadas.length}
    />
  );
}
