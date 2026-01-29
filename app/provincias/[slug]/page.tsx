import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Carrusel from "@/components/Carrusel";
import CapitalMapWrapper from "@/components/CapitalMapWrapper";
import Link from "next/link";
import { 
  getProvinciaBySlug, 
  getProvincias,
  getPlanesSantaFe,
  getPreguntasFrecuentesSantaFe,
  getNoticiasSantaFe,
  getOficinasInformesSantaFe,
  getAgenciasSantaFe,
  getEventosSantaFe
} from "@/lib/data";
import { notFound } from "next/navigation";
import ProvinciaVisitTracker from "@/components/ProvinciaVisitTracker";
import SantaFeQuickNav from "@/components/santa-fe/SantaFeQuickNav";
import SantaFeSectionsGrid from "@/components/santa-fe/SantaFeSectionsGrid";
import PreguntasFrecuentesSection from "@/components/santa-fe/PreguntasFrecuentesSection";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const provincias = await getProvincias();
  return provincias.map((provincia) => ({
    slug: provincia.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const provincia = await getProvinciaBySlug(slug);

  if (!provincia) {
    return {
      title: "Provincia no encontrada",
    };
  }

  const title = `Turismo ${provincia.provincia} - Qué hacer y Destinos | Argentina Universo Sur`;
  const description = provincia.des_1 
    ? `${provincia.des_1.substring(0, 150)}... Descubrí qué hacer, dónde ir y qué ver en ${provincia.provincia}. Guía completa de turismo.`
    : `Descubrí ${provincia.provincia}, sus destinos turísticos, actividades y experiencias únicas. Guía completa de turismo con información sobre qué hacer y dónde ir.`;

  const imageUrl = provincia.fotos && provincia.fotos.length > 0 
    ? provincia.fotos[0] 
    : "/img/home/1.jpg";

  return {
    title,
    description,
    keywords: [
      `turismo ${provincia.provincia}`,
      `qué hacer en ${provincia.provincia}`,
      `destinos ${provincia.provincia}`,
      `viajar a ${provincia.provincia}`,
      `actividades turísticas ${provincia.provincia}`,
      provincia.provincia.toLowerCase(),
    ],
    openGraph: {
      title,
      description,
      url: `/provincias/${slug}`,
      siteName: "Argentina Universo Sur",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${provincia.provincia} - Argentina`,
        },
      ],
      locale: "es_AR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `/provincias/${slug}`,
    },
  };
}

export default async function ProvinciaPage({ params }: PageProps) {
  const { slug } = await params;
  const provincia = await getProvinciaBySlug(slug);

  if (!provincia) {
    notFound();
  }

  // Cargar datos especiales solo para Santa Fe
  const isSantaFe = slug === "santa_fe";
  const planes = isSantaFe ? await getPlanesSantaFe() : null;
  const preguntasFrecuentes = isSantaFe ? await getPreguntasFrecuentesSantaFe() : null;
  const noticias = isSantaFe ? await getNoticiasSantaFe() : null;
  const oficinas = isSantaFe ? await getOficinasInformesSantaFe() : null;
  const agencias = isSantaFe ? await getAgenciasSantaFe() : null;
  const eventos = isSantaFe ? await getEventosSantaFe() : null;

  return (
    <>
      <Navbar />
      <ProvinciaVisitTracker slug={slug} />
      <main className={`min-h-screen ${isSantaFe ? 'pt-32' : 'pt-32'} pb-16 px-4 sm:px-6 lg:px-8`}>
        <div className={`${isSantaFe ? 'max-w-7xl' : 'max-w-5xl'} mx-auto`}>
          {/* Título */}
          <h1 className="text-4xl md:text-5xl font-semibold uppercase tracking-widest mb-8 text-center text-[#5A4E3D]">
            {provincia.provincia}
          </h1>

          {/* Navegación rápida solo para Santa Fe */}
          {isSantaFe && <SantaFeQuickNav />}

          {/* Descripción */}
          <div className="mb-8">
            {provincia.des_1 && (
              <p className="text-[#6B5D47] text-lg leading-relaxed mb-4">
                {provincia.des_1}
              </p>
            )}
            {provincia.des_2 && (
              <p className="text-[#6B5D47] text-lg leading-relaxed mb-4">
                {provincia.des_2}
              </p>
            )}
            {provincia.des_3 && (
              <p className="text-[#6B5D47] text-lg leading-relaxed">
                {provincia.des_3}
              </p>
            )}
          </div>

          {/* Carrusel */}
          {provincia.fotos.length > 0 && (
            <div className="mb-12">
              <Carrusel fotos={provincia.fotos} alt={provincia.provincia} />
            </div>
          )}

          {/* Sección Capital */}
          {provincia.nombre_capital && provincia.lat_capital && provincia.lon_capital && (
            <div className="mb-12">
              <h2 className="text-2xl md:text-3xl font-semibold uppercase tracking-widest mb-6 text-center text-[#5A4E3D]">
                Su Capital: {provincia.nombre_capital}
              </h2>
              <CapitalMapWrapper
                lat={provincia.lat_capital}
                lon={provincia.lon_capital}
                nombreCapital={provincia.nombre_capital}
              />
            </div>
          )}

          {/* Sección: Preguntas Frecuentes (solo para Santa Fe, después del mapa) */}
          {isSantaFe && preguntasFrecuentes && preguntasFrecuentes.length > 0 && (
            <PreguntasFrecuentesSection preguntas={preguntasFrecuentes} />
          )}

          {/* CTA: Ver qué hacer */}
          <div className="text-center mb-16">
            <Link
              href={`/actividades?provincia=${provincia.slug}`}
              className="inline-block px-8 py-3 bg-[#A68B5B]/20 hover:bg-[#A68B5B]/30 backdrop-blur-sm text-[#5A4E3D] uppercase tracking-widest text-sm transition-all duration-300 border border-[#C9B99B]/40 hover:border-[#A68B5B]/60"
            >
              Ver qué hacer en {provincia.provincia}
            </Link>
          </div>

          {/* Grid de secciones con previews solo para Santa Fe */}
          {isSantaFe && planes && eventos && preguntasFrecuentes && oficinas && agencias && noticias && (
            <SantaFeSectionsGrid
              planes={planes}
              eventos={eventos}
              preguntasFrecuentes={preguntasFrecuentes}
              oficinas={oficinas}
              agencias={agencias}
              noticias={noticias}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
