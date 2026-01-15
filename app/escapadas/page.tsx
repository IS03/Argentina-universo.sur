import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EscapadasContent from "@/components/EscapadasContent";
import { getEscapadas } from "@/lib/data";

export default async function EscapadasPage() {
  const escapadas = await getEscapadas();

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-semibold uppercase tracking-widest mb-4 text-[#5A4E3D]">
              Escapadas
            </h1>
            <p className="text-[#6B5D47] text-lg">
              Descargá nuestras guías de escapadas en PDF
            </p>
          </div>

          {/* Contenido con filtros */}
          <EscapadasContent escapadas={escapadas} />
        </div>
      </main>
      <Footer />
    </>
  );
}
