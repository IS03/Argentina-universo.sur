import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ActividadesExplorer from "@/components/actividades/ActividadesExplorer";
import { ROUTES, INTERNAL_ANCHORS } from "@/lib/site-links";
import { getActividades, getProvinciasEnOrdenDeCatalogo } from "@/lib/data";
import { resumirActividad } from "@/lib/catalog";

// Server Component estático. Se prerenderiza una vez por filtro (todas, cada provincia y sin
// resultados), así el HTML ya muestra lo que pide ?provincia; el navegador solo cambia el filtro.
export default async function ActividadesContent({ seleccionInicial }: { seleccionInicial: string }) {
  const [actividades, provincias] = await Promise.all([getActividades(), getProvinciasEnOrdenDeCatalogo()]);
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-semibold uppercase tracking-widest mb-4 text-[#5A4E3D]">
              Actividades turísticas en Argentina
            </h1>
            <p className="text-[#6B5D47] text-lg mb-6">
              Descubrí las mejores actividades en cada provincia
            </p>
            <nav className="flex flex-wrap justify-center gap-4 text-sm" aria-label="Explorar más contenido">
              <Link href={ROUTES.home} className="text-[#6B5D47] hover:text-[#A68B5B] underline underline-offset-2 transition-colors">
                Inicio
              </Link>
              <Link href={ROUTES.provincias} className="text-[#6B5D47] hover:text-[#A68B5B] underline underline-offset-2 transition-colors">
                {INTERNAL_ANCHORS.verTodasLasProvincias}
              </Link>
              <Link href={ROUTES.escapadas} className="text-[#6B5D47] hover:text-[#A68B5B] underline underline-offset-2 transition-colors">
                {INTERNAL_ANCHORS.verEscapadas}
              </Link>
              <Link href={ROUTES.seguridad} className="text-[#6B5D47] hover:text-[#A68B5B] underline underline-offset-2 transition-colors">
                {INTERNAL_ANCHORS.guiaSeguridad}
              </Link>
            </nav>
          </div>

          <ActividadesExplorer
            key={seleccionInicial}
            actividades={actividades.map(resumirActividad)}
            provincias={provincias.map(({ provincia, slug }) => ({ provincia, slug }))}
            seleccionInicial={seleccionInicial}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
