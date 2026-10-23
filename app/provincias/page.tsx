import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ViajeArgentina from "@/components/ViajeArgentina";
import { getProvincias } from "@/lib/data";
import Link from "next/link";
import { ROUTES, INTERNAL_ANCHORS } from "@/lib/site-links";
import { staticPageMetadata } from "@/lib/seo";

export const metadata = staticPageMetadata("/provincias");

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
