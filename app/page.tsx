"use client";

import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import ProvinciaCard from "@/components/ProvinciaCard";
import ActividadCard from "@/components/ActividadCard";
import { Provincia, Actividad } from "@/lib/data";

export default function Home() {
  // Estados para el carrusel
  const imagenesHome = Array.from({ length: 10 }, (_, i) => `/img/home/${i + 1}.jpg`);
  const [indiceImagen, setIndiceImagen] = useState(0);
  const [indiceAnterior, setIndiceAnterior] = useState(0);
  const [opacidad, setOpacidad] = useState(1);
  const indiceImagenRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ref para el hero
  const heroRef = useRef<HTMLDivElement>(null);
  
  // Estado para scroll y efectos - inicializar con valores seguros para SSR
  const [scrollY, setScrollY] = useState(0);
  const [heroHeight, setHeroHeight] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Estados para provincias
  const [provinciasDestacadas, setProvinciasDestacadas] = useState<Provincia[]>([]);
  const [contenidoVisitado, setContenidoVisitado] = useState<Array<{ tipo: 'provincia' | 'actividad'; data: Provincia | Actividad }>>([]);
  const [cargando, setCargando] = useState(true);

  // Slugs de las 3 provincias destacadas
  const slugsDestacadas = ["buenos_aires", "cordoba", "rio_negro"];

  // Cambiar imagen automáticamente cada 5 segundos
  useEffect(() => {
    const intervalo = setInterval(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      const indiceActual = indiceImagenRef.current;
      const siguienteIndice = (indiceActual + 1) % imagenesHome.length;
      
      setIndiceAnterior(indiceActual);
      setOpacidad(0);
      
      timeoutRef.current = setTimeout(() => {
        indiceImagenRef.current = siguienteIndice;
        setIndiceImagen(siguienteIndice);
        setOpacidad(1);
        timeoutRef.current = null;
      }, 2500);
    }, 5000);

    return () => {
      clearInterval(intervalo);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [imagenesHome.length]);

  // Cargar provincias destacadas y contenido visitado
  useEffect(() => {
    async function cargarContenido() {
      try {
        // Cargar provincias
        const provinciasResponse = await fetch("/data/provincias.json");
        const provinciasData = await provinciasResponse.json();

        // Cargar actividades
        const actividadesResponse = await fetch("/data/actividades.json");
        const actividadesData = await actividadesResponse.json();

        // Normalizar rutas de imágenes de provincias
        const normalizarRutaProvincia = (ruta: string) => {
          if (!ruta) return "";
          return ruta.replace(/^\/provincias\/img\//, "/img/provincias/");
        };

        const provinciasNormalizadas: Provincia[] = provinciasData.map((item: any) => ({
          provincia: item.PROVINCIA,
          slug: item.SLUG,
          descripcion: item.DESCIPCION || item.DESCRIPCION || "",
          fotos: [
            normalizarRutaProvincia(item.FOTO_1 || ""),
            normalizarRutaProvincia(item.FOTO_2 || ""),
            normalizarRutaProvincia(item.FOTO_3 || "")
          ].filter(Boolean)
        }));

        // Normalizar actividades
        const createSlug = (text: string) =>
          text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        const corregirExtension = (ruta: string) => {
          if (!ruta) return "";
          if (ruta.includes("/caba/caba1/2.png")) {
            return ruta.replace(/\.png$/i, ".jpeg");
          }
          return ruta.replace(/\.png$/i, ".jpg");
        };

        const actividadesNormalizadas: Actividad[] = actividadesData.map((item: any) => ({
          provincia: item.PROVINCIA,
          slug: item.SLUG,
          actividad: item.ACTIVIDAD,
          localizacion: item.LOCALIZACION,
          descripcion: item.DESCRPICION || item.DESCRIPCION || "",
          fotos: [
            corregirExtension(item.FOTO_1 || ""),
            corregirExtension(item.FOTO_2 || ""),
            corregirExtension(item.FOTO_3 || "")
          ].filter(Boolean),
          actividadSlug: createSlug(item.ACTIVIDAD)
        }));

        // Filtrar provincias destacadas y ordenarlas según slugsDestacadas
        const destacadas = slugsDestacadas
          .map(slug => provinciasNormalizadas.find(p => p.slug === slug))
          .filter((p): p is Provincia => p !== undefined);
        setProvinciasDestacadas(destacadas);

        // Cargar contenido visitado (provincias y actividades)
        const contenidoCombinado: Array<{ tipo: 'provincia' | 'actividad'; data: Provincia | Actividad; timestamp: number }> = [];

        // Cargar provincias visitadas
        const provinciasVisitadasData = localStorage.getItem("provinciasVisitadas");
        if (provinciasVisitadasData) {
          try {
            const parsed = JSON.parse(provinciasVisitadasData);
            const visitasProvincias = Array.isArray(parsed) ? parsed : [];
            
            visitasProvincias.forEach((item: any) => {
              const slug = typeof item === 'string' ? item : item.slug;
              const timestamp = typeof item === 'object' && item.timestamp ? item.timestamp : Date.now();
              const provincia = provinciasNormalizadas.find(p => p.slug === slug);
              if (provincia) {
                contenidoCombinado.push({ tipo: 'provincia', data: provincia, timestamp });
              }
            });
          } catch (e) {
            console.error("Error al parsear provincias visitadas:", e);
          }
        }

        // Cargar actividades visitadas
        const actividadesVisitadasData = localStorage.getItem("actividadesVisitadas");
        if (actividadesVisitadasData) {
          try {
            const parsed = JSON.parse(actividadesVisitadasData);
            const visitasActividades = Array.isArray(parsed) ? parsed : [];
            
            visitasActividades.forEach((item: any) => {
              const slug = typeof item === 'string' ? item : item.slug;
              const timestamp = typeof item === 'object' && item.timestamp ? item.timestamp : Date.now();
              const actividad = actividadesNormalizadas.find(a => a.actividadSlug === slug);
              if (actividad) {
                contenidoCombinado.push({ tipo: 'actividad', data: actividad, timestamp });
              }
            });
          } catch (e) {
            console.error("Error al parsear actividades visitadas:", e);
          }
        }

        // Ordenar por timestamp (más reciente primero) y limitar a 8
        const contenidoOrdenado = contenidoCombinado
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 8)
          .map(item => ({ tipo: item.tipo, data: item.data }));

        setContenidoVisitado(contenidoOrdenado);

        setCargando(false);
      } catch (error) {
        console.error("Error al cargar contenido:", error);
        setCargando(false);
      }
    }

    cargarContenido();
  }, []);

  // Marcar como montado después de la hidratación
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Detectar scroll y altura del hero
  useEffect(() => {
    if (!isMounted) return;

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    const handleResize = () => {
      if (heroRef.current) {
        setHeroHeight(heroRef.current.offsetHeight);
      }
    };

    // Inicializar altura
    handleResize();
    handleScroll(); // Inicializar scroll position

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMounted]);

  // Calcular valores basados en scroll - solo después de montar
  // Usar valores por defecto seguros para SSR
  const defaultHeight = 800; // Valor por defecto para SSR
  const effectiveHeroHeight = isMounted && heroHeight > 0 ? heroHeight : defaultHeight;
  
  // El contenido comienza a aparecer a los ~70vh (retrasado para dar más protagonismo al hero)
  const scrollThreshold = effectiveHeroHeight * 0.70; // 70vh - punto donde el contenido empieza a aparecer
  const scrollProgress = isMounted ? Math.max(0, Math.min(1, (scrollY - scrollThreshold) / (effectiveHeroHeight * 0.20))) : 0; // Progreso en los últimos 20vh (más lento)
  
  // Blur más sutil y progresivo
  const blurAmount = scrollProgress * 3; // Máximo 3px de blur (más sutil)
  const overlayOpacity = scrollProgress * 0.15; // Máximo 15% de overlay (más sutil)
  
  // Opacidad del contenido (aparece más lentamente desde scrollThreshold)
  const contenidoOpacity = isMounted ? Math.max(0, Math.min(1, (scrollY - scrollThreshold + 80) / 200)) : 0; // Más lento
  
  // Transform del contenido (sube más suavemente desde abajo)
  const contenidoTransform = isMounted ? Math.max(0, 40 - (scrollY - scrollThreshold) * 0.15) : 40; // Más suave
  
  // Posición del contenido: comienza a superponerse cuando el scroll alcanza 70vh
  const contenidoMarginTop = effectiveHeroHeight * 0.70; // El contenido comienza a los 70vh

  return (
    <>
      <Navbar />
      
      <main className="relative w-full">
        {/* HERO SECTION - Sticky (limpio al inicio) */}
        <section 
          ref={heroRef}
          className="sticky top-0 w-full z-0 overflow-hidden"
          style={{ height: '100vh', height: '100dvh' }}
        >
          {/* Carrusel de imágenes de fondo - SIN BLUR INICIAL */}
          <div className="absolute inset-0">
            <Image
              src={imagenesHome[indiceAnterior]}
              alt={`Paisaje argentino ${indiceAnterior + 1}`}
              fill
              className="object-cover"
              style={{ 
                opacity: 1 - opacidad, 
                filter: isMounted ? `blur(${blurAmount}px)` : 'blur(0px)',
                transition: 'opacity 2.5s cubic-bezier(0.4, 0, 0.2, 1), filter 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              quality={90}
            />
            <Image
              src={imagenesHome[indiceImagen]}
              alt={`Paisaje argentino ${indiceImagen + 1}`}
              fill
              className="object-cover"
              style={{ 
                opacity: opacidad, 
                filter: isMounted ? `blur(${blurAmount}px)` : 'blur(0px)',
                transition: 'opacity 2.5s cubic-bezier(0.4, 0, 0.2, 1), filter 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              priority
              quality={90}
            />
            {/* Gradientes sutiles - solo para legibilidad del texto */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#5A4E3D]/20 via-[#6B5D47]/15 to-[#8B7355]/10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-[#C9B99B]/5"></div>
            
            {/* Overlay progresivo SOLO cuando el contenido se superpone - con gradiente */}
            {isMounted && (
              <div 
                className="absolute inset-0 transition-opacity duration-500"
                style={{ 
                  background: `linear-gradient(to bottom, 
                    transparent 0%,
                    transparent 40%,
                    rgba(250, 248, 243, ${overlayOpacity * 0.3}) 60%,
                    rgba(250, 248, 243, ${overlayOpacity * 0.6}) 80%,
                    rgba(250, 248, 243, ${overlayOpacity}) 100%
                  )`,
                  pointerEvents: 'none'
                }}
              />
            )}
          </div>

          {/* Contenido del hero */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center pt-20 pb-20">
            <div className="mb-8">
              <h1 
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-[0.1em] uppercase mb-4 text-transparent bg-clip-text drop-shadow-2xl transition-all duration-300 hover:drop-shadow-[0_0_40px_rgba(108,180,238,0.9)] cursor-default"
                style={{
                  backgroundImage: 'linear-gradient(to right, #A68B5B 0%, #F5F1E8 30%, #C9B99B 50%, #F5F1E8 70%, #A68B5B 100%)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundImage = 'linear-gradient(to right, #8B7355 0%, #FAF8F3 30%, #D4C4B0 50%, #FAF8F3 70%, #8B7355 100%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundImage = 'linear-gradient(to right, #A68B5B 0%, #F5F1E8 30%, #C9B99B 50%, #F5F1E8 70%, #A68B5B 100%)';
                }}
              >
                Argentina
              </h1>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-[0.2em] uppercase text-white/90 mb-8 drop-shadow-lg">
                Universo Sur
              </h2>
            </div>
            
            <p className="text-sm sm:text-base md:text-lg text-gray-100 max-w-2xl font-medium tracking-wide leading-relaxed drop-shadow-md mb-8 px-4">
              Descubrí destinos, paisajes y experiencias únicas en todo el país.
            </p>

            {/* CTA suave - se mantiene legible hasta ser cubierto */}
            <button
              onClick={(e) => {
                e.preventDefault();
                const elemento = document.getElementById("provincias-destacadas");
                if (elemento) {
                  const yOffset = -80; // Offset para el navbar
                  const y = elemento.getBoundingClientRect().top + window.pageYOffset + yOffset;
                  window.scrollTo({ 
                    top: y,
                    behavior: 'smooth'
                  });
                }
              }}
              className="inline-block px-6 sm:px-8 py-3 bg-[#A68B5B]/30 hover:bg-[#A68B5B]/40 backdrop-blur-sm text-white uppercase tracking-widest text-xs sm:text-sm font-medium transition-all duration-300 border border-[#C9B99B]/50 hover:border-[#C9B99B]/70 rounded-sm cursor-pointer shadow-lg"
              style={isMounted ? {
                opacity: Math.max(0.7, 1 - scrollProgress * 0.5), // Se desvanece gradualmente cuando el contenido lo cubre
                transform: `translateY(${scrollProgress * 10}px)`
              } : {
                opacity: 1,
                transform: 'translateY(0px)'
              }}
            >
              Explorar destinos
            </button>
          </div>
        </section>

        {/* CAPA DE CONTENIDO SUPERPUESTA - Aparece después de ~70vh */}
        <div 
          className="relative z-10"
          style={isMounted ? {
            marginTop: `${contenidoMarginTop}px`,
            opacity: contenidoOpacity,
            transform: `translateY(${contenidoTransform}px)`,
            transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
          } : {
            marginTop: `${defaultHeight * 0.70}px`,
            opacity: 0,
            transform: 'translateY(40px)'
          }}
        >
          {/* Gradiente de transición superior - blur progresivo más sutil */}
          <div 
            className="h-40 sm:h-48 md:h-56 relative -mt-40 sm:-mt-48 md:-mt-56 pointer-events-none"
            style={isMounted ? {
              background: `linear-gradient(to bottom, 
                transparent 0%, 
                rgba(250, 248, 243, 0.15) 30%,
                rgba(250, 248, 243, 0.4) 50%,
                rgba(250, 248, 243, 0.7) 75%,
                rgba(250, 248, 243, 0.92) 100%
              )`,
              backdropFilter: `blur(${Math.min(6, blurAmount * 1.2)}px)`,
              WebkitBackdropFilter: `blur(${Math.min(6, blurAmount * 1.2)}px)`,
              opacity: contenidoOpacity,
              transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            } : {
              background: `linear-gradient(to bottom, 
                transparent 0%, 
                rgba(250, 248, 243, 0.15) 30%,
                rgba(250, 248, 243, 0.4) 50%,
                rgba(250, 248, 243, 0.7) 75%,
                rgba(250, 248, 243, 0.92) 100%
              )`,
              backdropFilter: 'blur(0px)',
              WebkitBackdropFilter: 'blur(0px)',
              opacity: 0
            }}
          />

          {/* Contenedor principal con bordes redondeados y sombra elegante - blur más sutil */}
          <div 
            className="relative bg-[#FAF8F3] rounded-t-[2.5rem] sm:rounded-t-[3.5rem] md:rounded-t-[4.5rem] shadow-[0_-10px_40px_rgba(90,78,61,0.15)]"
            style={isMounted ? {
              backdropFilter: `blur(${Math.min(8, blurAmount * 2)}px)`,
              WebkitBackdropFilter: `blur(${Math.min(8, blurAmount * 2)}px)`,
              transition: 'backdrop-filter 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            } : {
              backdropFilter: 'blur(0px)',
              WebkitBackdropFilter: 'blur(0px)'
            }}
          >
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

              {cargando ? (
                <div className="text-center py-12">
                  <p className="text-[#8B7355]">Cargando...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                  {provinciasDestacadas.map((provincia) => (
                    <ProvinciaCard key={provincia.slug} provincia={provincia} />
                  ))}
                </div>
              )}
            </div>
            </section>

            {/* SECCIÓN DINÁMICA: CONTINUAR EXPLORANDO */}
            {contenidoVisitado.length > 0 && (
              <section className="relative bg-[#F5F1E8] py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                  <div className="mb-8 sm:mb-12 text-center">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold uppercase tracking-widest mb-4 text-[#5A4E3D]">
                      Continuar explorando
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {contenidoVisitado.map((item, index) => {
                      if (item.tipo === 'provincia') {
                        return (
                          <ProvinciaCard 
                            key={`provincia-${(item.data as Provincia).slug}-${index}`} 
                            provincia={item.data as Provincia} 
                          />
                        );
                      } else {
                        return (
                          <ActividadCard 
                            key={`actividad-${(item.data as Actividad).actividadSlug}-${index}`} 
                            actividad={item.data as Actividad} 
                          />
                        );
                      }
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* CTA FINAL */}
            <section className="relative bg-[#FAF8F3] py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8 pb-20 sm:pb-24">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold uppercase tracking-widest mb-6 text-[#5A4E3D]">
                  Descubrí todo el país
                </h2>
                <Link
                  href="/provincias"
                  className="inline-block px-8 sm:px-10 py-3 sm:py-4 bg-[#6B5D47] hover:bg-[#5A4E3D] text-white uppercase tracking-widest text-xs sm:text-sm font-light transition-all duration-300 rounded-sm"
                >
                  Ver todas las provincias
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
