import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ViajeArgentina from "@/components/ViajeArgentina";
import { getProvincias } from "@/lib/data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Provincias de Argentina - Guía de Turismo",
  description: "Explorá todas las provincias argentinas. Descubrí destinos, paisajes y experiencias únicas en cada región del país. Mapa interactivo y guía completa de turismo.",
  keywords: ["provincias argentinas", "turismo por provincias", "destinos argentina", "viajar por argentina", "mapa turístico argentina", "qué provincia visitar"],
  openGraph: {
    title: "Provincias de Argentina - Guía de Turismo",
    description: "Explorá todas las provincias argentinas y sus destinos turísticos. Mapa interactivo con información completa.",
    url: "/provincias",
    siteName: "Argentina Universo Sur",
    images: [
      {
        url: "/img/home/1.jpg",
        width: 1200,
        height: 630,
        alt: "Provincias de Argentina",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Provincias de Argentina - Guía de Turismo",
    description: "Explorá todas las provincias argentinas y sus destinos turísticos",
    images: ["/img/home/1.jpg"],
  },
  alternates: {
    canonical: "/provincias",
  },
};

export default async function ProvinciasPage() {
  const provincias = await getProvincias();

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-semibold uppercase tracking-widest mb-4 text-[#5A4E3D]">
              Viaja por Argentina
            </h1>
            <p className="text-[#6B5D47] text-lg">
              Descubrí las provincias argentinas y sus destinos imperdibles
            </p>
          </div>

          {/* Mapa interactivo + Filtros + Grilla */}
          <ViajeArgentina provincias={provincias} />
        </div>
      </main>
      <Footer />
    </>
  );
}
