import { getNoticiasSantaFe } from "@/lib/data";
import NoticiasSection from "@/components/santa-fe/NoticiasSection";
import Breadcrumb from "@/components/santa-fe/Breadcrumb";
import SidebarNavigation from "@/components/santa-fe/SidebarNavigation";
import { staticPageMetadata } from "@/lib/seo";

export const metadata = staticPageMetadata("/provincias/santa_fe/noticias");

export default async function NoticiasPage() {
  const noticias = await getNoticiasSantaFe();

  return (
    <>
      <div className="min-h-screen pt-10 sm:pt-14 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <SidebarNavigation />

            {/* Contenido principal */}
            <div className="flex-1">
              <Breadcrumb
                items={[
                  { label: "Inicio", href: "/" },
                  { label: "Provincias", href: "/provincias" },
                  { label: "Santa Fe", href: "/provincias/santa_fe" },
                  { label: "Noticias" },
                ]}
              />

              <h1 className="text-4xl md:text-5xl font-semibold uppercase tracking-widest mb-4 text-tinta-900">
                Noticias de Santa Fe
              </h1>
              <p className="text-tinta-700 text-lg mb-8">
                Últimas noticias y actualizaciones sobre turismo en Santa Fe
              </p>

              <NoticiasSection noticias={noticias} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
