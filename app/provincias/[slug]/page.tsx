import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Carrusel from "@/components/Carrusel";
import Link from "next/link";
import { getProvinciaBySlug, getProvincias } from "@/lib/data";
import { notFound } from "next/navigation";
import ProvinciaVisitTracker from "@/components/ProvinciaVisitTracker";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const provincias = await getProvincias();
  return provincias.map((provincia) => ({
    slug: provincia.slug,
  }));
}

export default async function ProvinciaPage({ params }: PageProps) {
  const { slug } = await params;
  const provincia = await getProvinciaBySlug(slug);

  if (!provincia) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <ProvinciaVisitTracker slug={slug} />
      <main className="min-h-screen pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Título */}
          <h1 className="text-4xl md:text-5xl font-semibold uppercase tracking-widest mb-8 text-center text-[#5A4E3D]">
            {provincia.provincia}
          </h1>

          {/* Descripción */}
          <div className="mb-8">
            <p className="text-[#6B5D47] text-lg leading-relaxed whitespace-pre-line">
              {provincia.descripcion}
            </p>
          </div>

          {/* Carrusel */}
          {provincia.fotos.length > 0 && (
            <div className="mb-12">
              <Carrusel fotos={provincia.fotos} alt={provincia.provincia} />
            </div>
          )}

          {/* CTA: Ver qué hacer */}
          <div className="text-center">
            <Link
              href={`/actividades?provincia=${provincia.slug}`}
              className="inline-block px-8 py-3 bg-[#A68B5B]/20 hover:bg-[#A68B5B]/30 backdrop-blur-sm text-[#5A4E3D] uppercase tracking-widest text-sm transition-all duration-300 border border-[#C9B99B]/40 hover:border-[#A68B5B]/60"
            >
              Ver qué hacer en {provincia.provincia}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
