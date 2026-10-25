import { publishedTrips } from "@/content/escapadas";
import PublishedTrips from "@/components/escapadas/PublishedTrips";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EscapadasContent from "@/components/EscapadasContent";
import Link from "next/link";
import { getEscapadas } from "@/lib/data";
import { ROUTES, INTERNAL_ANCHORS } from "@/lib/site-links";
import { staticPageMetadata } from "@/lib/seo";

export const metadata = staticPageMetadata("/escapadas");

export default async function EscapadasPage() {
  const escapadas = await getEscapadas();

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-semibold uppercase tracking-widest mb-4 text-[#5A4E3D]">
              Escapadas en Argentina
            </h1>
            <p className="text-[#6B5D47] text-lg mb-6">
              Ideas para descubrir ciudades, paisajes y experiencias de Argentina. Consultá también nuestras guías en PDF.
            </p>
            <nav className="flex flex-wrap justify-center gap-4 text-sm" aria-label="Explorar más contenido">
              <Link href={ROUTES.home} className="text-[#6B5D47] hover:text-[#A68B5B] underline underline-offset-2 transition-colors">
                Inicio
              </Link>
              <Link href={ROUTES.provincias} className="text-[#6B5D47] hover:text-[#A68B5B] underline underline-offset-2 transition-colors">
                {INTERNAL_ANCHORS.verTodasLasProvincias}
              </Link>
              <Link href={ROUTES.actividades} className="text-[#6B5D47] hover:text-[#A68B5B] underline underline-offset-2 transition-colors">
                {INTERNAL_ANCHORS.verActividades}
              </Link>
              <Link href={ROUTES.seguridad} className="text-[#6B5D47] hover:text-[#A68B5B] underline underline-offset-2 transition-colors">
                {INTERNAL_ANCHORS.guiaSeguridad}
              </Link>
            </nav>
          </div>

          <PublishedTrips trips={publishedTrips} />
          {/* Las guías originales siguen accesibles mientras se revisan sus reemplazos. */}
          <EscapadasContent escapadas={escapadas} />
        </div>
      </main>
      <Footer />
    </>
  );
}
