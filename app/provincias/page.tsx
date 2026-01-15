import Navbar from "@/components/Navbar";
import ProvinciaCard from "@/components/ProvinciaCard";
import { getProvincias } from "@/lib/data";

export default async function ProvinciasPage() {
  const provincias = await getProvincias();

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-semibold uppercase tracking-widest mb-4 text-[#5A4E3D]">
              Viaja por Argentina
            </h1>
            <p className="text-[#6B5D47] text-lg">
              Descubrí las provincias argentinas y sus destinos imperdibles
            </p>
          </div>

          {/* Grilla de provincias */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {provincias.map((provincia) => (
              <ProvinciaCard key={provincia.slug} provincia={provincia} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
