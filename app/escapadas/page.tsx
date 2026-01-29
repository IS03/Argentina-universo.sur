import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EscapadasContent from "@/components/EscapadasContent";
import { getEscapadas } from "@/lib/data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Escapadas en Argentina - Guías de Viaje en PDF",
  description: "Descargá nuestras guías de escapadas en PDF. Rutas turísticas, viajes cortos y fin de semana en diferentes provincias de Argentina. Planificá tu próxima escapada.",
  keywords: ["escapadas argentina", "viajes cortos argentina", "fin de semana argentina", "rutas turísticas argentina", "guías viaje pdf", "escapadas por provincia"],
  openGraph: {
    title: "Escapadas en Argentina - Guías de Viaje en PDF",
    description: "Descargá nuestras guías de escapadas en PDF. Rutas turísticas y viajes cortos en Argentina.",
    url: "/escapadas",
    siteName: "Argentina Universo Sur",
    images: [
      {
        url: "/img/home/1.jpg",
        width: 1200,
        height: 630,
        alt: "Escapadas en Argentina",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Escapadas en Argentina - Guías de Viaje en PDF",
    description: "Descargá nuestras guías de escapadas en PDF. Rutas turísticas y viajes cortos.",
    images: ["/img/home/1.jpg"],
  },
  alternates: {
    canonical: "/escapadas",
  },
};

export default async function EscapadasPage() {
  const escapadas = await getEscapadas();

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-semibold uppercase tracking-widest mb-4 text-[#5A4E3D]">
              Escapadas
            </h1>
            <p className="text-[#6B5D47] text-lg">
              Descargá nuestras guías de escapadas en PDF
            </p>
          </div>

          {/* Contenido con filtros */}
          <EscapadasContent escapadas={escapadas} />
        </div>
      </main>
      <Footer />
    </>
  );
}
