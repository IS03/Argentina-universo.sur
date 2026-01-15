import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getEscapadas } from "@/lib/data";
import Link from "next/link";

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

          {/* Listado de escapadas */}
          <div className="space-y-6">
            {escapadas.map((escapada) => (
              <div
                key={escapada.id}
                className="bg-[#E8DDD0] border border-[#C9B99B]/50 rounded-lg p-6 hover:border-[#A68B5B] hover:bg-[#F5F1E8] transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold mb-2 text-[#5A4E3D]">
                      {escapada.titulo}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-sm text-[#6B5D47]">
                      <span>
                        <span className="uppercase tracking-wider">Provincia:</span>{" "}
                        {escapada.provincias}
                      </span>
                      <span>
                        <span className="uppercase tracking-wider">Duración:</span>{" "}
                        {escapada.duracion}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Link
                      href={escapada.pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-6 py-3 bg-[#A68B5B]/20 hover:bg-[#A68B5B]/30 backdrop-blur-sm text-[#5A4E3D] uppercase tracking-widest text-sm transition-all duration-300 border border-[#C9B99B]/50 hover:border-[#A68B5B] whitespace-nowrap"
                    >
                      Ver PDF
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
