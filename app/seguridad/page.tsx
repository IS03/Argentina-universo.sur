import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seguridad Viajeros Argentina | Consejos",
  description: "Consejos de seguridad para viajeros en Argentina. Recomendaciones durante el viaje, uso responsable del fuego, cuidado del entorno, seguridad en la ruta y más. Viajá seguro por Argentina.",
  keywords: ["seguridad viajeros argentina", "consejos seguridad viajar argentina", "recomendaciones turistas argentina", "viajar seguro argentina", "seguridad turismo argentina"],
  openGraph: {
    title: "Seguridad Viajeros Argentina | Consejos",
    description: "Consejos de seguridad para viajeros en Argentina. Recomendaciones durante el viaje, uso responsable del fuego y más.",
    url: "/seguridad",
    siteName: "Argentina Universo Sur",
    images: [
      {
        url: "/img/home/1.jpg",
        width: 1200,
        height: 630,
        alt: "Seguridad para viajeros en Argentina",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Seguridad Viajeros Argentina | Consejos",
    description: "Consejos de seguridad para viajeros en Argentina. Recomendaciones y tips para viajar seguro.",
    images: ["/img/home/1.jpg"],
  },
  alternates: {
    canonical: "/seguridad",
  },
};

export default function SeguridadPage() {
  const secciones = [
    {
      id: "durante-el-viaje",
      icono: "🚗",
      titulo: "Durante el viaje",
      items: [
        "Cuidá tus pertenencias, especialmente en lugares concurridos.",
        "Identificá puntos de información turística, seguridad y centros de salud cercanos.",
        "Guardá los números de emergencia locales en tu celular.",
        "Evitá zonas poco iluminadas durante la noche.",
        "Consultá el pronóstico del clima antes y durante el viaje.",
        "Cumplí las normas de seguridad según la actividad que realices (chaleco salvavidas, casco, etc.).",
        "Respetá los circuitos habilitados para 4x4 y cuatriciclos.",
        "Usá antena con banderín rojo.",
        "En cuatriciclos no cabinados, utilizá calzado cerrado y pechera de protección.",
      ],
    },
    {
      id: "uso-responsable-fuego",
      icono: "🔥",
      titulo: "Uso responsable del fuego",
      items: [
        "No enciendas fuego en lugares no habilitados.",
        "Si está permitido, evitá hacerlo debajo de los árboles.",
        "Apagá completamente la fogata con abundante agua y asegurate de que quede fría.",
        "No descartes colillas de cigarrillo en espacios naturales.",
        "Si ves humo o fuego, avisá de inmediato a guardaparques o autoridades.",
        "No estaciones vehículos sobre pastizales secos.",
      ],
    },
    {
      id: "residuos-entorno",
      icono: "🗑️",
      titulo: "Residuos y cuidado del entorno",
      items: [
        "Llevá siempre una bolsa para tus residuos (incluso los orgánicos).",
        "No dejes basura en espacios naturales.",
        "Si encontrás residuos ajenos, ayudá a retirarlos.",
        "Recordá que latas y vidrios pueden provocar incendios por efecto lupa.",
      ],
    },
    {
      id: "en-la-ruta",
      icono: "🛣️",
      titulo: "En la ruta",
      items: [
        "Verificá el estado del vehículo antes de salir.",
        "Llevá toda la documentación obligatoria.",
        "Usá siempre el cinturón de seguridad.",
        "Respetá las velocidades máximas y controles viales.",
        "No uses el celular mientras manejás.",
        "Viajá descansado y evitá conducir en horas de calor extremo.",
        "Mantené las luces bajas encendidas, de día y de noche.",
        "Ante presencia de fauna, reducí la velocidad.",
        "En caso de emergencia, colocá balizas a distancia prudente.",
      ],
    },
    {
      id: "playas-balnearios",
      icono: "🏖️",
      titulo: "En playas y balnearios",
      items: [
        "Seguí siempre las indicaciones del guardavidas.",
        "Ingresá al agua solo en zonas habilitadas.",
        "Respetá las banderas de seguridad.",
        "Prestá especial atención a menores y personas mayores.",
        "Evitá el ingreso al agua de noche o desde muelles.",
        "No descuides tus pertenencias personales.",
      ],
    },
    {
      id: "areas-naturales",
      icono: "🌿",
      titulo: "En áreas naturales",
      items: [
        "Caminá solo por senderos habilitados y señalizados.",
        "Informate sobre la dificultad y duración de los recorridos.",
        "Avisá a guardaparques si realizás senderos por tu cuenta.",
        "Respetá la flora, la fauna y la cartelería.",
        "No alimentes animales silvestres.",
        "Transitá, acampá y nadá solo en sitios permitidos.",
        "No ingreses con mascotas a Parques Nacionales.",
      ],
    },
    {
      id: "destinos-altura",
      icono: "🏔️",
      titulo: "En destinos de altura (+2500 msnm)",
      items: [
        "Consultá a tu médico antes de viajar.",
        "Evitá ascensos rápidos.",
        "Hidratate correctamente (2 a 3 litros por día).",
        "Durante los primeros días, realizá poca actividad física.",
        "Consumí hidratos de carbono en pequeñas cantidades.",
        "Evitá alcohol, tabaco y medicamentos que provoquen sueño.",
        "Ante síntomas como mareos o dolor intenso, descendé y consultá a un médico.",
      ],
    },
    {
      id: "salud-prevencion",
      icono: "❤️",
      titulo: "Salud y prevención",
      items: [
        "Hidratate con frecuencia, aunque no tengas sed.",
        "Evitá el sol entre las 11 y las 17 h.",
        "Usá ropa liviana y clara, gorra, protector solar y repelente.",
        "Llevá un botiquín básico de primeros auxilios.",
      ],
    },
    {
      id: "emergencias",
      icono: "🚨",
      titulo: "Emergencias",
      items: [],
    },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 px-3 sm:px-4 md:px-6 lg:px-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto w-full">
          {/* Hero Section - Introducción */}
          <header className="mb-10 sm:mb-12 md:mb-16 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold uppercase tracking-wide sm:tracking-widest mb-4 sm:mb-6 px-2 break-words text-[#5A4E3D]">
              Recomendaciones para un Verano Seguro
            </h1>
            <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 text-[#6B5D47] leading-relaxed text-sm sm:text-base md:text-lg px-2">
              <p className="text-base sm:text-lg md:text-xl">
                Disfrutar el verano también es viajar con responsabilidad.
              </p>
              <p>
                Estas recomendaciones te ayudan a prevenir riesgos, anticiparte a
                imprevistos y saber cómo actuar ante distintas situaciones durante tu
                viaje.
              </p>
              <p className="pt-3 sm:pt-4 border-t border-[#C9B99B]/50">
                Viajar seguro no depende solo del destino, sino también de cada viajero.
                Por eso, esta guía está pensada para acompañarte en la ruta, durante tu
                estadía y en cada actividad que realices, promoviendo experiencias
                tranquilas, cuidadas y responsables.
              </p>
            </div>
          </header>

          {/* Navegación rápida (solo en desktop) */}
          <nav className="hidden lg:block mb-8 lg:mb-12" aria-label="Navegación rápida">
            <div className="bg-[#E8DDD0]/80 backdrop-blur-sm border border-[#C9B99B]/50 rounded-lg p-4">
              <p className="text-xs sm:text-sm text-[#6B5D47] mb-3 uppercase tracking-wider">
                Navegación rápida
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {secciones.map((seccion) => (
                  <a
                    key={seccion.id}
                    href={`#${seccion.id}`}
                    className="text-xs text-[#5A4E3D] hover:text-[#A68B5B] transition-colors px-2 sm:px-3 py-1 border border-[#C9B99B]/50 hover:border-[#A68B5B] rounded focus:outline-none focus:ring-2 focus:ring-[#A68B5B]"
                  >
                    <span aria-hidden="true">{seccion.icono}</span>{" "}
                    <span className="sr-only">{seccion.icono} </span>
                    {seccion.titulo}
                  </a>
                ))}
              </div>
            </div>
          </nav>

          {/* Cards de secciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-10 sm:mb-12 md:mb-16">
            {secciones.map((seccion) => {
              const isEmergencias = seccion.id === "emergencias";
              return (
                <article
                  key={seccion.id}
                  id={seccion.id}
                  className={`group bg-[#E8DDD0]/80 backdrop-blur-sm border rounded-lg p-4 sm:p-5 md:p-6 lg:p-8 transition-all duration-300 ${
                    isEmergencias
                      ? "md:col-span-2 border-2 border-red-700/50 bg-gradient-to-br from-red-900/30 via-red-800/20 to-orange-900/20 hover:border-red-600/70 hover:from-red-900/40 hover:via-red-800/30 hover:to-orange-900/30"
                      : "border-[#C9B99B]/50 hover:border-[#A68B5B]/70 hover:bg-[#E8DDD0] md:hover:scale-[1.02]"
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <span
                      className="text-3xl sm:text-4xl flex-shrink-0"
                      aria-hidden="true"
                    >
                      {seccion.icono}
                    </span>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-light uppercase tracking-wide sm:tracking-wider break-words text-[#5A4E3D]">
                      {seccion.titulo}
                    </h2>
                  </div>
                  {!isEmergencias && (
                    <ul className="space-y-2 sm:space-y-3 ml-0 list-none">
                      {seccion.items.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 sm:gap-3 text-[#6B5D47] leading-relaxed text-sm sm:text-base"
                        >
                          <span
                            className="mt-0.5 flex-shrink-0 text-[#A68B5B] self-start"
                            aria-hidden="true"
                          >
                            •
                          </span>
                          <span className="flex-1 break-words">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {isEmergencias && (
                    <div className="text-center">
                      <p className="text-[#6B5D47] text-sm sm:text-base mb-6 sm:mb-8">
                        Guardá estos números en tu celular antes de viajar
                      </p>
                      <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="bg-[#F5F1E8] backdrop-blur-sm border border-red-700/40 rounded-lg p-4 sm:p-6 hover:bg-[#FAF8F3] transition-all">
                          <p className="text-2xl mb-2" aria-hidden="true">
                            📞
                          </p>
                          <p className="text-xs sm:text-sm text-[#6B5D47] uppercase tracking-wider mb-2">
                            Emergencias
                          </p>
                          <a
                            href="tel:911"
                            className="text-2xl sm:text-3xl font-light text-[#5A4E3D] hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
                            aria-label="Llamar a emergencias 911"
                          >
                            911
                          </a>
                        </div>
                        <div className="bg-[#F5F1E8] backdrop-blur-sm border border-red-700/40 rounded-lg p-4 sm:p-6 hover:bg-[#FAF8F3] transition-all">
                          <p className="text-2xl mb-2" aria-hidden="true">
                            📞
                          </p>
                          <p className="text-xs sm:text-sm text-[#6B5D47] uppercase tracking-wider mb-2">
                            Denuncias
                          </p>
                          <a
                            href="tel:134"
                            className="text-2xl sm:text-3xl font-light text-[#5A4E3D] hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
                            aria-label="Llamar a denuncias 134"
                          >
                            134
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Separador visual final */}
          <footer className="mt-10 sm:mt-12 md:mt-16 pt-6 sm:pt-8 border-t border-[#C9B99B]/50">
            <p className="text-center text-[#8B7355] text-xs sm:text-sm uppercase tracking-wide sm:tracking-widest">
              Viajá seguro, viajá responsable
            </p>
          </footer>
        </div>
      </main>
      <Footer />
    </>
  );
}
