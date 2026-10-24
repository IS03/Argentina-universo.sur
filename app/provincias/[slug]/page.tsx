import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Carrusel from "@/components/Carrusel";
import MapaUbicacion from "@/components/mapa/MapaUbicacion";
import Link from "next/link";
import { ROUTES, INTERNAL_ANCHORS } from "@/lib/site-links";
import { 
  getProvinciaBySlug, 
  getProvincias,
  getPlanesSantaFe,
  getPreguntasFrecuentesSantaFe,
  getNoticiasSantaFe,
  getOficinasInformesSantaFe,
  getAgenciasSantaFe,
  getAgendaSantaFe
} from "@/lib/data";
import { notFound } from "next/navigation";
import ProvinciaVisitTracker from "@/components/ProvinciaVisitTracker";
import SantaFeQuickNav from "@/components/santa-fe/SantaFeQuickNav";
import SantaFeSectionsGrid from "@/components/santa-fe/SantaFeSectionsGrid";
import PreguntasFrecuentesSection from "@/components/santa-fe/PreguntasFrecuentesSection";
import type { Metadata } from "next";
import { provinciaMetadata } from "@/lib/seo";

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

  if (!provincia) notFound();
  return provinciaMetadata(provincia);
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
  const agenda = isSantaFe ? await getAgendaSantaFe() : null;
  const eventos = agenda?.vigentes ?? null;

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
              <MapaUbicacion
                lat={provincia.lat_capital}
                lon={provincia.lon_capital}
                titulo={provincia.nombre_capital}
              />
            </div>
          )}

          {/* Sección: Preguntas Frecuentes (solo para Santa Fe, después del mapa) */}
          {isSantaFe && preguntasFrecuentes && preguntasFrecuentes.length > 0 && (
            <PreguntasFrecuentesSection preguntas={preguntasFrecuentes} />
          )}

          {/* CTA: Ver qué hacer + enlazado interno (SEO) */}
          <div className="text-center mb-16 space-y-4">
            {/* Sin prefetch: /actividades?provincia=… es un rewrite por query y Next 16.3+ predice su
                segmento a partir de /actividades, lo que da 404 (vercel/next.js#97244). El clic
                navega igual en el cliente, pidiendo el árbol completo al servidor. */}
            <Link
              href={ROUTES.actividadesPorProvincia(provincia.slug)}
              prefetch={false}
              className="inline-block px-8 py-3 bg-[#A68B5B]/20 hover:bg-[#A68B5B]/30 backdrop-blur-sm text-[#5A4E3D] uppercase tracking-widest text-sm transition-all duration-300 border border-[#C9B99B]/40 hover:border-[#A68B5B]/60"
            >
              {INTERNAL_ANCHORS.verActividadesEnProvincia(provincia.provincia)}
            </Link>
            <nav className="flex flex-wrap justify-center gap-4 text-sm" aria-label="Navegación relacionada">
              <Link href={ROUTES.home} className="text-[#6B5D47] hover:text-[#A68B5B] underline underline-offset-2 transition-colors">
                Inicio
              </Link>
              <Link href={ROUTES.provincias} className="text-[#6B5D47] hover:text-[#A68B5B] underline underline-offset-2 transition-colors">
                {INTERNAL_ANCHORS.verTodasLasProvincias}
              </Link>
              <Link href={ROUTES.escapadas} className="text-[#6B5D47] hover:text-[#A68B5B] underline underline-offset-2 transition-colors">
                {INTERNAL_ANCHORS.verEscapadas}
              </Link>
            </nav>
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
