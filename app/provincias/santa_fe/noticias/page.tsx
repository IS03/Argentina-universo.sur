import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getNoticiasSantaFe } from "@/lib/data";
import NoticiasSection from "@/components/santa-fe/NoticiasSection";
import Breadcrumb from "@/components/santa-fe/Breadcrumb";
import SidebarNavigation from "@/components/santa-fe/SidebarNavigation";

export const metadata = {
  title: "Noticias - Santa Fe | Argentina Universo Sur",
  description: "Mantente informado con las últimas noticias y actualizaciones sobre turismo en Santa Fe.",
};

export default async function NoticiasPage() {
  const noticias = await getNoticiasSantaFe();

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-16 px-4 sm:px-6 lg:px-8">
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

              <h1 className="text-4xl md:text-5xl font-semibold uppercase tracking-widest mb-4 text-[#5A4E3D]">
                Noticias
              </h1>
              <p className="text-[#6B5D47] text-lg mb-8">
                Últimas noticias y actualizaciones sobre turismo en Santa Fe
              </p>

              <NoticiasSection noticias={noticias} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
