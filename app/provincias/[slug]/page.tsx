import Navbar from "@/components/Navbar";
import Carrusel from "@/components/Carrusel";
import Link from "next/link";
import { getProvinciaBySlug, getProvincias } from "@/lib/data";
import { notFound } from "next/navigation";

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
      <main className="min-h-screen pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Título */}
          <h1 className="text-4xl md:text-5xl font-semibold uppercase tracking-widest mb-8 text-center">
            {provincia.provincia}
          </h1>

          {/* Carrusel */}
          {provincia.fotos.length > 0 && (
            <div className="mb-8">
              <Carrusel fotos={provincia.fotos} alt={provincia.provincia} />
            </div>
          )}

          {/* Descripción */}
          <div className="mb-12">
            <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-line">
              {provincia.descripcion}
            </p>
          </div>

          {/* CTA: Ver qué hacer */}
          <div className="text-center">
            <Link
              href={`/actividades?provincia=${provincia.slug}`}
              className="inline-block px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white uppercase tracking-widest text-sm transition-all duration-300 border border-white/20 hover:border-white/40"
            >
              Ver qué hacer en {provincia.provincia}
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
