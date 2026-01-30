import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Carrusel from "@/components/Carrusel";
import { getActividadBySlug, getActividades } from "@/lib/data";
import { notFound } from "next/navigation";
import ActividadVisitTracker from "@/components/ActividadVisitTracker";
import ActividadMapWrapper from "@/components/ActividadMapWrapper";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const actividades = await getActividades();
  return actividades.map((actividad) => ({
    slug: actividad.actividadSlug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const actividad = await getActividadBySlug(slug);

  if (!actividad) {
    return {
      title: "Actividad no encontrada",
    };
  }

  // Optimizar título: keyword al inicio, máx 60 caracteres
  const separador = " | ";
  const maxLength = 60;
  const localizacionLength = actividad.localizacion.length + separador.length;
  const maxActividadLength = maxLength - localizacionLength;
  
  let actividadTitle = actividad.actividad;
  if (actividadTitle.length > maxActividadLength) {
    actividadTitle = actividadTitle.substring(0, maxActividadLength - 3) + "...";
  }
  
  const title = `${actividadTitle}${separador}${actividad.localizacion}`;
  const description = actividad.des_1
    ? `${actividad.des_1.substring(0, 150)}... Ubicado en ${actividad.localizacion}, ${actividad.provincia}. Información completa, ubicación y qué hacer.`
    : `Descubrí ${actividad.actividad} en ${actividad.localizacion}, ${actividad.provincia}. Información, ubicación, qué hacer y más.`;

  const imageUrl = actividad.fotos && actividad.fotos.length > 0
    ? actividad.fotos[0]
    : "/img/home/1.jpg";

  return {
    title,
    description,
    keywords: [
      actividad.actividad,
      actividad.localizacion,
      `turismo ${actividad.provincia}`,
      `qué hacer en ${actividad.localizacion}`,
      `actividades ${actividad.provincia}`,
      `${actividad.actividad} ${actividad.localizacion}`,
    ],
    openGraph: {
      title,
      description,
      url: `/actividades/${slug}`,
      siteName: "Argentina Universo Sur",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${actividad.actividad} - ${actividad.localizacion}`,
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
      canonical: `/actividades/${slug}`,
    },
  };
}

export default async function ActividadPage({ params }: PageProps) {
  const { slug } = await params;
  const actividad = await getActividadBySlug(slug);

  if (!actividad) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <ActividadVisitTracker slug={slug} />
      <main className="min-h-screen pt-32 pb-16 px-2 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* 1. Nombre */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-semibold uppercase tracking-wide sm:tracking-widest mb-4 text-center">
            {actividad.actividad}
          </h1>

          {/* 2. Ubicación de texto */}
          <p className="text-gray-400 text-center mb-8 text-lg">
            {actividad.localizacion}
          </p>

          {/* 3. Mapa */}
          {actividad.lat && actividad.lon && (
            <ActividadMapWrapper
              lat={actividad.lat}
              lon={actividad.lon}
              actividad={actividad.actividad}
              localizacion={actividad.localizacion}
            />
          )}

          {/* 4. Descripción */}
          <div className="mb-12">
            {actividad.des_1 && (
              <p className="text-[#6B5D47] text-lg leading-relaxed mb-4">
                {actividad.des_1}
              </p>
            )}
            {actividad.des_2 && (
              <p className="text-[#6B5D47] text-lg leading-relaxed">
                {actividad.des_2}
              </p>
            )}
          </div>

          {/* 5. Imágenes */}
          {actividad.fotos.length > 0 && (
            <div className="mb-8">
              <Carrusel fotos={actividad.fotos} alt={actividad.actividad} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
