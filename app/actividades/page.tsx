"use client";

import { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ActividadCard from "@/components/ActividadCard";
// Tipos
interface Actividad {
  provincia: string;
  slug: string;
  actividad: string;
  localizacion: string;
  descripcion: string;
  fotos: string[];
  actividadSlug: string;
}

interface Provincia {
  provincia: string;
  slug: string;
}
import { useSearchParams } from "next/navigation";

function ActividadesContent() {
  const searchParams = useSearchParams();
  const provinciaFiltro = searchParams.get("provincia");
  
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<string>(
    provinciaFiltro || "todas"
  );
  const [actividadesFiltradas, setActividadesFiltradas] = useState<Actividad[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Cargar datos
    async function cargarDatos() {
      const [actividadesData, provinciasData] = await Promise.all([
        fetch("/data/actividades.json").then((res) => res.json()),
        fetch("/data/provincias.json").then((res) => res.json()),
      ]);

      // Normalizar actividades
      const actividadesNormalizadas = actividadesData.map((item: any) => {
        const createSlug = (text: string) =>
          text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        // Función para corregir extensiones de imágenes
        const corregirExtension = (ruta: string) => {
          if (!ruta) return "";
          // Caso especial: caba1/2.png -> caba1/2.jpeg
          if (ruta.includes("/caba/caba1/2.png")) {
            return ruta.replace(/\.png$/i, ".jpeg");
          }
          // Para el resto, reemplazar .png por .jpg
          return ruta.replace(/\.png$/i, ".jpg");
        };

        return {
          provincia: item.PROVINCIA,
          slug: item.SLUG,
          actividad: item.ACTIVIDAD,
          localizacion: item.LOCALIZACION,
          descripcion: item.DESCRPICION || item.DESCRIPCION || "",
          fotos: [
            corregirExtension(item.FOTO_1 || ""),
            corregirExtension(item.FOTO_2 || ""),
            corregirExtension(item.FOTO_3 || ""),
          ].filter(Boolean),
          actividadSlug: createSlug(item.ACTIVIDAD),
        };
      });

      // Normalizar provincias
      const provinciasNormalizadas = provinciasData.map((item: any) => ({
        provincia: item.PROVINCIA,
        slug: item.SLUG,
      }));

      setActividades(actividadesNormalizadas);
      setProvincias(provinciasNormalizadas);
      setCargando(false);
    }

    cargarDatos();
  }, []);

  useEffect(() => {
    // Filtrar actividades
    if (provinciaSeleccionada === "todas") {
      setActividadesFiltradas(actividades);
    } else {
      setActividadesFiltradas(
        actividades.filter((a) => a.slug === provinciaSeleccionada)
      );
    }
  }, [provinciaSeleccionada, actividades]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-semibold uppercase tracking-widest mb-4 text-[#5A4E3D]">
              Qué hacer
            </h1>
            <p className="text-[#6B5D47] text-lg">
              Descubrí las mejores actividades en cada provincia
            </p>
          </div>

          {/* Filtro por provincia */}
          <div className="mb-12 flex justify-center">
            <div className="bg-[#E8DDD0]/80 backdrop-blur-sm border border-[#C9B99B]/50 rounded-lg p-6 w-full max-w-md hover:border-[#A68B5B]/70 hover:bg-[#E8DDD0] transition-all duration-300">
              <label
                htmlFor="provincia-filtro"
                className="block text-sm uppercase tracking-widest text-[#6B5D47] mb-4 text-center font-light"
              >
                Filtrar por provincia
              </label>
              <div className="relative">
                <select
                  id="provincia-filtro"
                  value={provinciaSeleccionada}
                  onChange={(e) => setProvinciaSeleccionada(e.target.value)}
                  className="w-full bg-[#F5F1E8] border border-[#C9B99B]/50 text-[#5A4E3D] px-5 py-3.5 rounded-lg focus:outline-none focus:border-[#A68B5B]/70 focus:ring-2 focus:ring-[#A68B5B]/20 transition-all duration-300 appearance-none cursor-pointer hover:bg-[#FAF8F3] hover:border-[#A68B5B]/70 text-base font-light tracking-wide"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="todas" className="bg-[#F5F1E8]">Todas las provincias</option>
                  {provincias.map((provincia) => (
                    <option key={provincia.slug} value={provincia.slug} className="bg-[#F5F1E8]">
                      {provincia.provincia}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Grilla de actividades */}
          {cargando ? (
            <div className="text-center py-12">
              <p className="text-[#8B7355] text-lg">Cargando actividades...</p>
            </div>
          ) : actividadesFiltradas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {/* Mostrar todas si es "Todas las provincias", sino máximo 4 */}
              {(provinciaSeleccionada === "todas" 
                ? actividadesFiltradas 
                : actividadesFiltradas.slice(0, 4)
              ).map((actividad) => (
                <ActividadCard key={actividad.actividadSlug} actividad={actividad} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#8B7355] text-lg">
                No se encontraron actividades para la provincia seleccionada.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ActividadesPage() {
  return (
    <Suspense fallback={
      <>
        <Navbar />
        <main className="min-h-screen pt-32 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <p className="text-[#8B7355] text-lg">Cargando actividades...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    }>
      <ActividadesContent />
    </Suspense>
  );
}
