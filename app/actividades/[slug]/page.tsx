import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Carrusel from "@/components/Carrusel";
import { getActividadBySlug, getActividades } from "@/lib/data";
import { notFound } from "next/navigation";
import ActividadVisitTracker from "@/components/ActividadVisitTracker";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const actividades = await getActividades();
  return actividades.map((actividad) => ({
    slug: actividad.actividadSlug,
  }));
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
      <main className="min-h-screen pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Título */}
          <h1 className="text-4xl md:text-5xl font-semibold uppercase tracking-widest mb-4 text-center">
            {actividad.actividad}
          </h1>

          {/* Localización */}
          <p className="text-gray-400 text-center mb-8 text-lg">
            {actividad.localizacion}
          </p>

          {/* Carrusel */}
          {actividad.fotos.length > 0 && (
            <div className="mb-8">
              <Carrusel fotos={actividad.fotos} alt={actividad.actividad} />
            </div>
          )}

          {/* Descripción */}
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
        </div>
      </main>
      <Footer />
    </>
  );
}
