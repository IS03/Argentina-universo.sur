import HomeContent from "@/components/HomeContent";
import { getProvincias } from "@/lib/data";
import { resumirProvincia } from "@/lib/catalog";
import type { Provincia } from "@/lib/catalog";
import { staticPageMetadata } from "@/lib/seo";

export const metadata = staticPageMetadata("/");

const slugsDestacadas = ["santa_fe", "cordoba", "buenos_aires"];

export default async function HomePage() {
  const provincias = await getProvincias();
  const provinciasDestacadas = slugsDestacadas
    .map(slug => provincias.find(p => p.slug === slug))
    .filter((p): p is Provincia => p !== undefined);

  return <HomeContent provinciasDestacadas={provinciasDestacadas.map(resumirProvincia)} />;
}
