import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getAgendaSantaFe } from "@/lib/data";
import EventosSection from "@/components/santa-fe/EventosSection";
import Breadcrumb from "@/components/santa-fe/Breadcrumb";
import SidebarNavigation from "@/components/santa-fe/SidebarNavigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eventos Santa Fe | Calendario",
  description: "Calendario completo de eventos en Santa Fe. Fiestas regionales, carnavales, festivales y más actividades. Consultá la agenda cultural y eventos del año.",
  keywords: ["eventos santa fe", "festivales santa fe", "agenda cultural santa fe", "calendario eventos santa fe", "fiestas santa fe"],
  openGraph: {
    title: "Eventos Santa Fe | Calendario",
    description: "Calendario completo de eventos en Santa Fe. Fiestas regionales, carnavales, festivales y más actividades.",
    url: "/provincias/santa_fe/eventos",
    siteName: "Argentina Universo Sur",
    images: [
      {
        url: "/img/provincias/santa-fe/1.jpg",
        width: 1200,
        height: 630,
        alt: "Eventos en Santa Fe",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eventos Santa Fe | Calendario",
    description: "Calendario completo de eventos en Santa Fe. Fiestas regionales, carnavales, festivales y más.",
    images: ["/img/provincias/santa-fe/1.jpg"],
  },
  alternates: {
    canonical: "/provincias/santa_fe/eventos",
  },
};

export default async function EventosPage() {
  const { vigentes, anteriores } = await getAgendaSantaFe();

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
                  { label: "Eventos" },
                ]}
              />

              <h1 className="text-4xl md:text-5xl font-semibold uppercase tracking-widest mb-4 text-[#5A4E3D]">
                Calendario de Eventos en Santa Fe
              </h1>
              <p className="text-[#6B5D47] text-lg mb-8">
                Consultá los próximos eventos, las actividades en curso y el archivo de eventos anteriores de Santa Fe.
              </p>

              <EventosSection eventos={vigentes} />
              {anteriores.length > 0 && (
                <details className="text-[#5A4E3D] mb-8">
                  <summary className="cursor-pointer text-lg font-semibold mb-6">
                    Eventos anteriores ({anteriores.length})
                  </summary>
                  <EventosSection eventos={anteriores} titulo="Eventos anteriores" id="eventos-anteriores" />
                </details>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
