import Navbar from "@/components/Navbar";
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
            <h1 className="text-4xl md:text-5xl font-semibold uppercase tracking-widest mb-4">
              Escapadas
            </h1>
            <p className="text-gray-400 text-lg">
              Descargá nuestras guías de escapadas en PDF
            </p>
          </div>

          {/* Listado de escapadas */}
          <div className="space-y-6">
            {escapadas.map((escapada) => (
              <div
                key={escapada.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold mb-2">
                      {escapada.titulo}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
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
                      className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white uppercase tracking-widest text-sm transition-all duration-300 border border-white/20 hover:border-white/40 whitespace-nowrap"
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
    </>
  );
}
