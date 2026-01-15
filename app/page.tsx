"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import ProvinciaCard from "@/components/ProvinciaCard";
import ActividadCard from "@/components/ActividadCard";
import { Provincia, Actividad } from "@/lib/data";

export default function Home() {
  // ============================================
  // CARRUSEL CON DOBLE BUFFER - SIN CORTES
  // ============================================
  // Lista de imágenes del home
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

  // Estado del carrusel: índice actual y qué capa está visible
  const [indiceActual, setIndiceActual] = useState(0);
  const [capaVisible, setCapaVisible] = useState<'A' | 'B'>('A');
  
  // Estados para las opacidades de las dos capas (siempre una en 1, otra en 0)
  // Capa A: siempre montada, nunca desmontada
  const [opacidadCapaA, setOpacidadCapaA] = useState(1);
  const [opacidadCapaB, setOpacidadCapaB] = useState(0);
  
  // Estados para las URLs de las imágenes en cada capa
  // CRÍTICO: Nunca cambiamos el src de la capa visible durante la transición
  const [srcCapaA, setSrcCapaA] = useState(imagenesHome[0]);
  const [srcCapaB, setSrcCapaB] = useState(imagenesHome[1]);
  
  // Ref para el intervalo del carrusel
  const intervaloRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs para mantener los valores actuales sin causar re-renders
  const indiceActualRef = useRef(0);
  const capaVisibleRef = useRef<'A' | 'B'>('A');
  
  // Estado para precarga de imágenes
  const [imagenesPrecargadas, setImagenesPrecargadas] = useState(false);
  
  // Sincronizar refs con estado
  useEffect(() => {
    indiceActualRef.current = indiceActual;
  }, [indiceActual]);
  
  useEffect(() => {
    capaVisibleRef.current = capaVisible;
  }, [capaVisible]);

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

  // ============================================
  // PRECARGA DE IMÁGENES
  // ============================================
  // Precargar todas las imágenes al montar el componente
  useEffect(() => {
    const precargarImagenes = () => {
      const promesas = imagenesHome.map((src) => {
        return new Promise<void>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Continuar aunque falle una imagen
          img.src = src;
        });
      });
      
      Promise.all(promesas).then(() => {
        setImagenesPrecargadas(true);
      });
    };
    
    precargarImagenes();
  }, []);

  // ============================================
  // INICIALIZACIÓN DEL CARRUSEL AUTOMÁTICO
  // ============================================
  // Iniciar el carrusel automático solo después de precargar las imágenes
  useEffect(() => {
    if (!imagenesPrecargadas) return;
    
    // Función para cambiar a la siguiente imagen con transición suave
    // Definida dentro del useEffect para evitar problemas de dependencias
    const siguienteImagen = () => {
      // Usar refs para obtener los valores actuales sin depender del estado
      const indiceActual = indiceActualRef.current;
      const capaVisible = capaVisibleRef.current;
      
      const siguienteIndice = (indiceActual + 1) % imagenesHome.length;
      const siguienteSrc = imagenesHome[siguienteIndice];
      
      // Determinar qué capa está visible actualmente
      const capaActiva = capaVisible;
      const capaInactiva = capaVisible === 'A' ? 'B' : 'A';
      
      // CRÍTICO: La capa inactiva debe tener su src actualizado ANTES de hacerla visible
      // Esto garantiza que cuando suba su opacity, la imagen ya esté cargada
      // Actualizamos el src de la capa inactiva (que está en opacity 0)
      if (capaInactiva === 'A') {
        setSrcCapaA(siguienteSrc);
      } else {
        setSrcCapaB(siguienteSrc);
      }
      
      // Esperar a que React actualice el DOM y el navegador procese el cambio de src
      // Usamos requestAnimationFrame para asegurar que el navegador haya renderizado
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Ahora hacemos la transición:
          // Paso 1: Subir la capa inactiva (con la nueva imagen) de opacity 0 → 1
          //         La capa activa permanece en opacity 1 durante toda la transición
          //         Esto garantiza que NUNCA haya un momento donde ambas estén < 1
          if (capaInactiva === 'A') {
            setOpacidadCapaA(1);
          } else {
            setOpacidadCapaB(1);
          }
          
          // Paso 2: Una vez que la nueva imagen está visible (después de la transición),
          //         bajamos la capa anterior a opacity 0
          //         Usamos setTimeout con el mismo tiempo que la transición CSS (1.5s)
          setTimeout(() => {
            if (capaActiva === 'A') {
              setOpacidadCapaA(0);
            } else {
              setOpacidadCapaB(0);
            }
            
            // Actualizar el estado para el siguiente ciclo
            setIndiceActual(siguienteIndice);
            setCapaVisible(capaInactiva);
          }, 1500); // Mismo tiempo que la transición CSS
        });
      });
    };
    
    // Iniciar el intervalo: cambiar imagen cada 5 segundos
    intervaloRef.current = setInterval(() => {
      siguienteImagen();
    }, 5000);
    
    return () => {
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
      }
    };
  }, [imagenesPrecargadas]); // Solo depende de imagenesPrecargadas

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
          des_1: item.des_1 || "",
          des_2: item.des_2 || "",
          des_3: item.des_3 || "",
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
          des_1: item.des_1 || "",
          des_2: item.des_2 || "",
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
          {/* ============================================
              CARRUSEL CON DOBLE BUFFER
              ============================================
              GARANTÍAS DE IMPLEMENTACIÓN:
              
              1. NUNCA HAY PARPADEO:
                 - Dos capas montadas permanentemente (nunca se desmontan)
                 - Siempre hay exactamente una imagen con opacity: 1
                 - La imagen entrante sube de 0 → 1 mientras la saliente permanece en 1
                 - Solo cuando la entrante está al 100%, la saliente baja a 0
              
              2. NUNCA SE VÉ EL FONDO:
                 - El contenedor tiene background-color igual al color dominante de las imágenes
                 - En todo momento hay al menos una imagen con opacity: 1 cubriendo todo el espacio
                 - Las dos capas están en position: absolute con inset-0
              
              3. TRANSICIÓN CONTINUA:
                 - Usamos solo transition: opacity (NO animation)
                 - La transición es suave (1.5s ease-in-out)
                 - No hay cambios de src en elementos visibles durante la transición
                 - El src se actualiza en la capa invisible ANTES de hacerla visible
              
              4. RENDER ESTABLE:
                 - Los componentes Image nunca se desmontan
                 - No usamos key={index} que causaría remounts
                 - Las referencias a src se mantienen estables
          */}
          <div className="absolute inset-0 bg-[#5A4E3D]">
            {/* CAPA A - Siempre montada, nunca desmontada */}
            <div
              className="absolute inset-0"
              style={{
                opacity: opacidadCapaA,
                transition: 'opacity 1.5s ease-in-out',
                willChange: 'opacity', // Optimización GPU
              }}
            >
              <Image
                src={srcCapaA}
                alt={`Paisaje argentino`}
                fill
                className="object-cover"
                style={{ 
                  filter: isMounted ? `blur(${blurAmount}px)` : 'blur(0px)',
                  pointerEvents: 'none'
                }}
                priority={true}
                quality={90}
                unoptimized
              />
            </div>
            
            {/* CAPA B - Siempre montada, nunca desmontada */}
            <div
              className="absolute inset-0"
              style={{
                opacity: opacidadCapaB,
                transition: 'opacity 1.5s ease-in-out',
                willChange: 'opacity', // Optimización GPU
              }}
            >
              <Image
                src={srcCapaB}
                alt={`Paisaje argentino`}
                fill
                className="object-cover"
                style={{ 
                  filter: isMounted ? `blur(${blurAmount}px)` : 'blur(0px)',
                  pointerEvents: 'none'
                }}
                priority={true}
                quality={90}
                unoptimized
              />
            </div>
            
            {/* Gradientes sutiles - solo para legibilidad del texto */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#5A4E3D]/20 via-[#6B5D47]/15 to-[#8B7355]/10 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-[#C9B99B]/5 pointer-events-none"></div>
            
            {/* Overlay progresivo - aparece desde el primer scroll */}
            {isMounted && (
              <div 
                className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
                style={{ 
                  background: `linear-gradient(to bottom, 
                    transparent 0%,
                    transparent 30%,
                    rgba(250, 248, 243, ${overlayOpacity * 0.2}) 50%,
                    rgba(250, 248, 243, ${overlayOpacity * 0.5}) 70%,
                    rgba(250, 248, 243, ${overlayOpacity}) 100%
                  )`,
                  opacity: Math.min(1, scrollProgress * 1.5)
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
      <Footer />
    </>
  );
}
