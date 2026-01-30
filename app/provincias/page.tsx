import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ViajeArgentina from "@/components/ViajeArgentina";
import { getProvincias } from "@/lib/data";
import Link from "next/link";
import { ROUTES, INTERNAL_ANCHORS } from "@/lib/site-links";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Provincias de Argentina | Turismo",
  description: "Explorá todas las provincias argentinas. Descubrí destinos, paisajes y experiencias únicas en cada región del país. Mapa interactivo y guía completa de turismo.",
  keywords: ["provincias argentinas", "turismo por provincias", "destinos argentina", "viajar por argentina", "mapa turístico argentina", "qué provincia visitar"],
  openGraph: {
    title: "Provincias de Argentina | Turismo",
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
    title: "Provincias de Argentina | Turismo",
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
              Provincias de Argentina
            </h1>
            <p className="text-[#6B5D47] text-lg mb-6">
              Descubrí las provincias argentinas y sus destinos imperdibles
            </p>
            <nav className="flex flex-wrap justify-center gap-4 text-sm" aria-label="Explorar más contenido">
              <Link href={ROUTES.home} className="text-[#6B5D47] hover:text-[#A68B5B] underline underline-offset-2 transition-colors">
                Inicio
              </Link>
              <Link href={ROUTES.actividades} className="text-[#6B5D47] hover:text-[#A68B5B] underline underline-offset-2 transition-colors">
                {INTERNAL_ANCHORS.verActividades}
              </Link>
              <Link href={ROUTES.escapadas} className="text-[#6B5D47] hover:text-[#A68B5B] underline underline-offset-2 transition-colors">
                {INTERNAL_ANCHORS.verEscapadas}
              </Link>
              <Link href={ROUTES.seguridad} className="text-[#6B5D47] hover:text-[#A68B5B] underline underline-offset-2 transition-colors">
                {INTERNAL_ANCHORS.guiaSeguridad}
              </Link>
            </nav>
          </div>

          {/* Mapa interactivo + Filtros + Grilla */}
          <section aria-labelledby="mapa-provincias-heading">
            <h2 id="mapa-provincias-heading" className="sr-only">
              Mapa y listado de provincias de Argentina
            </h2>
            <ViajeArgentina provincias={provincias} />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
