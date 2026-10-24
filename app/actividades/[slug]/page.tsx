import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Carrusel from "@/components/Carrusel";
import Link from "next/link";
import { ROUTES, INTERNAL_ANCHORS } from "@/lib/site-links";
import { getActividadBySlug, getActividades } from "@/lib/data";
import { notFound } from "next/navigation";
import ActividadVisitTracker from "@/components/ActividadVisitTracker";
import MapaUbicacion from "@/components/mapa/MapaUbicacion";
import type { Metadata } from "next";
import { actividadMetadata } from "@/lib/seo";

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

  if (!actividad) notFound();
  return actividadMetadata(actividad);
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
            <MapaUbicacion
              lat={actividad.lat}
              lon={actividad.lon}
              titulo={actividad.actividad}
              detalle={actividad.localizacion}
              className="mb-8"
              teselasEnMovil={false}
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

          {/* Enlazado interno (SEO): provincia, actividades, inicio */}
          <nav className="mt-12 pt-8 border-t border-[#C9B99B]/50 flex flex-wrap justify-center gap-4 text-sm" aria-label="Navegación relacionada">
            <Link href={ROUTES.provincia(actividad.slug)} className="text-[#6B5D47] hover:text-[#A68B5B] underline underline-offset-2 transition-colors">
              {INTERNAL_ANCHORS.turismoEnProvincia(actividad.provincia)}
            </Link>
            <Link href={ROUTES.actividades} className="text-[#6B5D47] hover:text-[#A68B5B] underline underline-offset-2 transition-colors">
              {INTERNAL_ANCHORS.verActividades}
            </Link>
            <Link href={ROUTES.home} className="text-[#6B5D47] hover:text-[#A68B5B] underline underline-offset-2 transition-colors">
              Inicio
            </Link>
          </nav>
        </div>
      </main>
      <Footer />
    </>
  );
}
