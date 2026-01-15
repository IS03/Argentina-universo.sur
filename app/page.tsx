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
  // Lista de imágenes del home - actualizar según las imágenes disponibles en /public/img/home/
  const imagenesHome = [
    '/img/home/1.jpg',
    '/img/home/2.jpg',
    '/img/home/3.jpg',
    '/img/home/4.jpg',
    '/img/home/5.jpg',
    '/img/home/6.jpg',
    '/img/home/7.jpg',
    '/img/home/8.jpg',
    '/img/home/9.jpg',
    '/img/home/10.jpg',
  ];
  const [indiceImagen, setIndiceImagen] = useState(0);
  const [indiceAnterior, setIndiceAnterior] = useState(0);
  const [opacidad, setOpacidad] = useState(1);
  const indiceImagenRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Versión de caché para forzar recarga de imágenes cuando se actualicen
  // Se genera solo en el cliente después de la hidratación para evitar mismatch
  const [cacheVersion, setCacheVersion] = useState<string | null>(null);

  // Refs
  const heroRef = useRef<HTMLDivElement>(null);
  const contenidoRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Estado para scroll y efectos - inicializar con valores seguros para SSR
  const [scrollY, setScrollY] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [contenidoHeight, setContenidoHeight] = useState(0);

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

  // Marcar como montado después de la hidratación y generar cacheVersion
  useEffect(() => {
    setIsMounted(true);
    setCacheVersion(Date.now().toString());
  }, []);

  // Detectar scroll y altura del contenido
  useEffect(() => {
    if (!isMounted) return;

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    const updateContenidoHeight = () => {
      if (contenidoRef.current) {
        setContenidoHeight(contenidoRef.current.offsetHeight);
      }
    };

    // Inicializar
    handleScroll();
    updateContenidoHeight();

    // Usar ResizeObserver para detectar cambios en la altura del contenido
    const resizeObserver = new ResizeObserver(() => {
      updateContenidoHeight();
    });

    if (contenidoRef.current) {
      resizeObserver.observe(contenidoRef.current);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateContenidoHeight);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateContenidoHeight);
      resizeObserver.disconnect();
    };
  }, [isMounted]);

  // Calcular valores basados en scroll - LÓGICA CORRECTA CON SUPERPOSICIÓN REAL
  // Hero siempre es 100vh, usamos viewportHeight directamente
  const viewportHeight = isMounted && typeof window !== 'undefined' ? window.innerHeight : 1000;
  
  // El efecto comienza desde el PRIMER scroll (scrollY > 0)
  // Máximo efecto se alcanza en aproximadamente 50vh de scroll
  // Esto asegura que el contenido sea visible claramente antes de una pantalla completa
  const scrollMax = viewportHeight * 0.5; // 50vh de scroll para máximo efecto
  const scrollProgress = isMounted ? Math.max(0, Math.min(1, scrollY / scrollMax)) : 0;
  
  // Blur progresivo del hero - empieza desde el primer scroll, máximo 12px (más pronunciado)
  const blurAmount = scrollProgress * 12;
  
  // Opacidad del hero completo (imágenes + texto) - se difumina progresivamente
  const heroOpacity = isMounted ? Math.max(1, 1 - scrollProgress * 1.2) : 1;
  
  // Overlay progresivo - aparece desde el primer scroll, máximo 40% de opacidad
  const overlayOpacity = scrollProgress * 0.4;
  
  // Transform del contenido (sube desde abajo) - más suave y rápido
  // Empieza 50px abajo, llega a 0px al 30% del scroll
  const contenidoTransform = isMounted ? Math.max(0, 50 - (scrollY * 0.17)) : 50;

  return (
    <>
      <Navbar />
      
      {/* Contenedor principal: tiene la altura del contenido para generar scroll */}
      <div 
        ref={containerRef}
        className="relative w-full" 
        style={{ height: contenidoHeight > 0 ? `${contenidoHeight + viewportHeight}px` : '100vh' }}
      >
        {/* HERO SECTION - Exactamente 100vh, sticky, NO genera scroll */}
        <section 
          ref={heroRef}
          className="sticky top-0 w-full z-0 overflow-hidden"
          style={{ 
            height: '100vh',
            opacity: heroOpacity,
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Carrusel de imágenes de fondo - SIN BLUR INICIAL */}
          <div className="absolute inset-0">
            <Image
              src={cacheVersion ? `${imagenesHome[indiceAnterior]}?v=${cacheVersion}` : imagenesHome[indiceAnterior]}
              alt={`Paisaje argentino ${indiceAnterior + 1}`}
              fill
              className="object-cover"
              style={{ 
                opacity: 1 - opacidad, 
                filter: isMounted ? `blur(${blurAmount}px)` : 'blur(0px)',
                transition: 'opacity 2.5s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              quality={90}
              unoptimized
            />
            <Image
              src={cacheVersion ? `${imagenesHome[indiceImagen]}?v=${cacheVersion}` : imagenesHome[indiceImagen]}
              alt={`Paisaje argentino ${indiceImagen + 1}`}
              fill
              className="object-cover"
              style={{ 
                opacity: opacidad, 
                filter: isMounted ? `blur(${blurAmount}px)` : 'blur(0px)',
                transition: 'opacity 2.5s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              priority
              quality={90}
              unoptimized
            />
            {/* Gradientes sutiles - solo para legibilidad del texto */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#5A4E3D]/20 via-[#6B5D47]/15 to-[#8B7355]/10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-[#C9B99B]/5"></div>
            
            {/* Overlay progresivo - aparece desde el primer scroll */}
            {isMounted && (
              <div 
                className="absolute inset-0 transition-opacity duration-300"
                style={{ 
                  background: `linear-gradient(to bottom, 
                    transparent 0%,
                    transparent 30%,
                    rgba(250, 248, 243, ${overlayOpacity * 0.2}) 50%,
                    rgba(250, 248, 243, ${overlayOpacity * 0.5}) 70%,
                    rgba(250, 248, 243, ${overlayOpacity}) 100%
                  )`,
                  pointerEvents: 'none',
                  opacity: Math.min(1, scrollProgress * 1.5) // Aparece más rápido
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
            
            <p 
              className="text-sm sm:text-base md:text-lg text-gray-100 max-w-2xl font-medium tracking-wide leading-relaxed drop-shadow-md mb-8 px-4"
              style={isMounted ? {
                opacity: heroOpacity,
                filter: `blur(${blurAmount * 0.3}px)`,
                transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              } : {
                opacity: 1,
                filter: 'blur(0px)'
              }}
            >
              Descubrí destinos, paisajes y experiencias únicas en todo el país.
            </p>

            {/* CTA - se difumina progresivamente con el scroll */}
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
                opacity: heroOpacity,
                filter: `blur(${blurAmount * 0.3}px)`,
                transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              } : {
                opacity: 1,
                filter: 'blur(0px)'
              }}
            >
              Explorar destinos
            </button>
          </div>
        </section>

        {/* CAPA DE CONTENIDO SUPERPUESTA - Position absolute, superpuesta desde el inicio */}
        <div 
          ref={contenidoRef}
          className="absolute top-[100vh] left-0 right-0 z-10"
          style={isMounted ? {
            transform: `translateY(${contenidoTransform}px)`,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          } : {
            transform: 'translateY(50px)'
          }}
        >
          {/* Contenedor principal con sombra elegante */}
          <div 
            className="relative bg-[#FAF8F3] shadow-[0_-10px_40px_rgba(90,78,61,0.15)]"
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
      </div>
    </>
  );
}
