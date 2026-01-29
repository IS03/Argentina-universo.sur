import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getAgenciasSantaFe } from "@/lib/data";
import AgenciasSection from "@/components/santa-fe/AgenciasSection";
import Breadcrumb from "@/components/santa-fe/Breadcrumb";
import SidebarNavigation from "@/components/santa-fe/SidebarNavigation";

export const metadata = {
  title: "Agencias de Viajes - Santa Fe | Argentina Universo Sur",
  description: "Listado completo de agencias de viajes en Santa Fe. Contactos, teléfonos y ubicaciones para planificar tu viaje.",
};

export default async function AgenciasPage() {
  const agencias = await getAgenciasSantaFe();

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
                  { label: "Agencias" },
                ]}
              />

              <h1 className="text-4xl md:text-5xl font-semibold uppercase tracking-widest mb-4 text-[#5A4E3D]">
                Agencias de Viajes
              </h1>
              <p className="text-[#6B5D47] text-lg mb-8">
                Contactá con las agencias de viajes autorizadas en Santa Fe para planificar tu viaje
              </p>

              <AgenciasSection agencias={agencias} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
