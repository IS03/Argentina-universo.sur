import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ROUTES, INTERNAL_ANCHORS } from "@/lib/site-links";
import ProvinciaCard from "@/components/ProvinciaCard";
import HeroCarousel from "@/components/home/HeroCarousel";
import HomeScrollStage from "@/components/home/HomeScrollStage";
import ExplorarDestinosButton from "@/components/home/ExplorarDestinosButton";
import ContinuarExplorando from "@/components/home/ContinuarExplorando";
import type { ProvinciaResumen } from "@/lib/catalog";

interface HomeContentProps {
  provinciasDestacadas: ProvinciaResumen[];
}

// Las variables --hero-* las actualiza HomeScrollStage; sin JavaScript valen el estado inicial.
const estiloTextoHero: React.CSSProperties = {
  opacity: "var(--hero-opacity, 1)",
  filter: "blur(calc(var(--hero-blur, 0px) * 0.3))",
  transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
};

function HomeHero() {
  return (
    <>
      <div className="absolute inset-0 bg-[#5A4E3D]">
        <div className="absolute inset-0 pointer-events-none" style={{ filter: "blur(var(--hero-blur, 0px))" }}>
          <HeroCarousel />
        </div>

        {/* Gradientes sutiles - solo para legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#5A4E3D]/20 via-[#6B5D47]/15 to-[#8B7355]/10 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-[#C9B99B]/5 pointer-events-none"></div>

        {/* Overlay progresivo - aparece desde el primer scroll */}
        <div
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom,
              transparent 0%,
              transparent 30%,
              rgba(250, 248, 243, calc(var(--hero-overlay, 0) * 0.2)) 50%,
              rgba(250, 248, 243, calc(var(--hero-overlay, 0) * 0.5)) 70%,
              rgba(250, 248, 243, var(--hero-overlay, 0)) 100%
            )`,
            opacity: "var(--hero-overlay-opacity, 0)",
          }}
        />
      </div>

      {/* Contenido del hero */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center pt-20 pb-20">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-[0.1em] uppercase mb-4 text-transparent bg-clip-text drop-shadow-2xl transition-all duration-300 hover:drop-shadow-[0_0_40px_rgba(108,180,238,0.9)] cursor-default bg-[linear-gradient(to_right,#A68B5B_0%,#F5F1E8_30%,#C9B99B_50%,#F5F1E8_70%,#A68B5B_100%)] hover:bg-[linear-gradient(to_right,#8B7355_0%,#FAF8F3_30%,#D4C4B0_50%,#FAF8F3_70%,#8B7355_100%)]">
            Turismo en Argentina
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-[0.2em] uppercase text-white/90 mb-8 drop-shadow-lg" aria-label="Universo Sur">
            Universo Sur
          </p>
        </div>

        <p
          className="text-sm sm:text-base md:text-lg text-gray-100 max-w-2xl font-medium tracking-wide leading-relaxed drop-shadow-md mb-8 px-4"
          style={estiloTextoHero}
        >
          Descubrí destinos, paisajes y experiencias únicas en todo el país. Explorá provincias, actividades turísticas y escapadas.
        </p>

        {/* CTA - se difumina progresivamente con el scroll */}
        <ExplorarDestinosButton style={estiloTextoHero} />
      </div>
    </>
  );
}

// Server Component: el contenido turístico llega en el HTML inicial. Solo el carrusel, los
// efectos de scroll, el botón del hero y el historial de visitas se ejecutan en el navegador.
export default function HomeContent({ provinciasDestacadas }: HomeContentProps) {
  return (
    <>
      <Navbar />

      <HomeScrollStage hero={<HomeHero />}>
        {/* Contenedor principal con sombra elegante */}
        <div className="relative bg-[#FAF8F3] shadow-[0_-10px_40px_rgba(90,78,61,0.15)]">
          {/* SECCIÓN: TOP 3 PROVINCIAS DESTACADAS */}
          <section
            id="provincias-destacadas"
            className="relative py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8"
          >
            <div className="max-w-7xl mx-auto">
              <div className="mb-12 text-center">
                <h2 className="text-3xl md:text-4xl font-semibold uppercase tracking-widest mb-4 text-[#5A4E3D]">
                  Provincias destacadas
                </h2>
                <p className="text-[#6B5D47] text-lg">Empezá por acá</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {provinciasDestacadas.map((provincia) => (
                  <ProvinciaCard key={provincia.slug} provincia={provincia} />
                ))}
              </div>
            </div>
          </section>

          {/* SECCIÓN DINÁMICA: CONTINUAR EXPLORANDO */}
          <ContinuarExplorando />

          {/* CTA FINAL + Enlazado interno (SEO: jerarquía y texto ancla descriptivo) */}
          <section className="relative bg-[#FAF8F3] py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8 pb-20 sm:pb-24">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold uppercase tracking-widest mb-6 text-[#5A4E3D]">
                Descubrí todo el país
              </h2>
              <Link
                href={ROUTES.provincias}
                className="inline-block px-8 sm:px-10 py-3 sm:py-4 bg-[#6B5D47] hover:bg-[#5A4E3D] text-white uppercase tracking-widest text-xs sm:text-sm font-light transition-all duration-300 rounded-sm"
              >
                {INTERNAL_ANCHORS.verTodasLasProvincias}
              </Link>
              <nav className="mt-8 flex flex-wrap justify-center gap-4 sm:gap-6 text-sm" aria-label="Explorar más contenido">
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
          </section>
        </div>
      </HomeScrollStage>
      <Footer />
    </>
  );
}
