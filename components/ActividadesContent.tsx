import { Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ActividadesExplorer, { ActividadesListado } from "@/components/actividades/ActividadesExplorer";
import type { ProvinciaOpcion } from "@/components/actividades/ActividadesExplorer";
import { ROUTES, INTERNAL_ANCHORS } from "@/lib/site-links";
import { TODAS_LAS_PROVINCIAS } from "@/lib/catalog";
import type { ActividadResumen } from "@/lib/catalog";

interface ActividadesContentProps {
  actividades: ActividadResumen[];
  provincias: ProvinciaOpcion[];
}

// Server Component. La página es estática: el HTML incluye las 72 actividades y el filtro
// solo se ejecuta en el navegador, que es quien conoce el parámetro ?provincia.
export default function ActividadesContent({ actividades, provincias }: ActividadesContentProps) {
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

          <Suspense fallback={<ActividadesListado actividades={actividades} provincias={provincias} seleccion={TODAS_LAS_PROVINCIAS} />}>
            <ActividadesExplorer actividades={actividades} provincias={provincias} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
