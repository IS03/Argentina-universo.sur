import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getOficinasInformesSantaFe } from "@/lib/data";
import OficinasSection from "@/components/santa-fe/OficinasSection";
import Breadcrumb from "@/components/santa-fe/Breadcrumb";
import SidebarNavigation from "@/components/santa-fe/SidebarNavigation";

export const metadata = {
  title: "Oficinas de Información Turística - Santa Fe | Argentina Universo Sur",
  description: "Encontrá las oficinas de información turística en Santa Fe. Direcciones, teléfonos, horarios y contacto.",
};

export default async function OficinasPage() {
  const oficinas = await getOficinasInformesSantaFe();

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
                  { label: "Oficinas" },
                ]}
              />

              <h1 className="text-4xl md:text-5xl font-semibold uppercase tracking-widest mb-4 text-[#5A4E3D]">
                Oficinas de Información Turística
              </h1>
              <p className="text-[#6B5D47] text-lg mb-8">
                Encontrá la oficina de información turística más cercana a tu destino
              </p>

              <OficinasSection oficinas={oficinas} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
