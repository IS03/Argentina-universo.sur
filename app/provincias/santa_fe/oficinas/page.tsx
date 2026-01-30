import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getOficinasInformesSantaFe } from "@/lib/data";
import OficinasSection from "@/components/santa-fe/OficinasSection";
import Breadcrumb from "@/components/santa-fe/Breadcrumb";
import SidebarNavigation from "@/components/santa-fe/SidebarNavigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Oficinas Turismo Santa Fe",
  description: "Encontrá las oficinas de información turística en Santa Fe. Direcciones, teléfonos, horarios y contacto. Información turística oficial.",
  keywords: ["oficina turismo santa fe", "información turística santa fe", "oficinas turismo santa fe", "informes turísticos santa fe"],
  openGraph: {
    title: "Oficinas Turismo Santa Fe",
    description: "Encontrá las oficinas de información turística en Santa Fe. Direcciones, teléfonos, horarios y contacto.",
    url: "/provincias/santa_fe/oficinas",
    siteName: "Argentina Universo Sur",
    images: [
      {
        url: "/img/provincias/santa-fe/1.jpg",
        width: 1200,
        height: 630,
        alt: "Oficinas de información turística en Santa Fe",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Oficinas Turismo Santa Fe",
    description: "Encontrá las oficinas de información turística en Santa Fe",
    images: ["/img/provincias/santa-fe/1.jpg"],
  },
  alternates: {
    canonical: "/provincias/santa_fe/oficinas",
  },
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
