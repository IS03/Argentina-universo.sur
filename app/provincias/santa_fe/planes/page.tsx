import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPlanesSantaFe } from "@/lib/data";
import PlanesSection from "@/components/santa-fe/PlanesSection";
import Breadcrumb from "@/components/santa-fe/Breadcrumb";
import SidebarNavigation from "@/components/santa-fe/SidebarNavigation";

export const metadata = {
  title: "Planes e Ideas - Santa Fe | Argentina Universo Sur",
  description: "Descubrí los mejores planes e ideas turísticas en Santa Fe. Bodegones, turismo estudiantil, museos virtuales y más.",
};

export default async function PlanesPage() {
  const planes = await getPlanesSantaFe();

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
                  { label: "Planes e Ideas" },
                ]}
              />

              <h1 className="text-4xl md:text-5xl font-semibold uppercase tracking-widest mb-4 text-[#5A4E3D]">
                Planes e Ideas
              </h1>
              <p className="text-[#6B5D47] text-lg mb-8">
                Descubrí todas las propuestas y planes turísticos que Santa Fe tiene para ofrecerte
              </p>

              <PlanesSection planes={planes} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
