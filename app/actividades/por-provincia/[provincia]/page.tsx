import Actividades from "@/components/ActividadesContent";
import { staticPageMetadata } from "@/lib/seo";
import { SLUGS_PROVINCIAS, FILTRO_SIN_RESULTADOS } from "@/lib/site-links";

// Ruta interna: solo se alcanza mediante el rewrite de /actividades?provincia=…; el acceso
// directo redirige a esa URL. La metadata y el canonical son los de /actividades.
export const metadata = staticPageMetadata("/actividades");
export const dynamicParams = false;

export function generateStaticParams() {
  return [...SLUGS_PROVINCIAS, FILTRO_SIN_RESULTADOS].map(provincia => ({ provincia }));
}

export default async function ActividadesPorProvinciaPage({ params }: { params: Promise<{ provincia: string }> }) {
  const { provincia } = await params;
  return <Actividades seleccionInicial={provincia} />;
}
