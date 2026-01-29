import Link from "next/link";
import { 
  PlanSantaFe, 
  PreguntaFrecuente, 
  NoticiaSantaFe, 
  OficinaInforme, 
  Agencia, 
  Evento 
} from "@/lib/data";

interface SantaFeSectionsGridProps {
  planes: PlanSantaFe[];
  eventos: Evento[];
  preguntasFrecuentes: PreguntaFrecuente[];
  oficinas: OficinaInforme[];
  agencias: Agencia[];
  noticias: NoticiaSantaFe[];
}

export default function SantaFeSectionsGrid({
  planes,
  eventos,
  preguntasFrecuentes,
  oficinas,
  agencias,
  noticias
}: SantaFeSectionsGridProps) {
  const secciones = [
    {
      id: 'planes',
      titulo: 'Planes e Ideas',
      icon: '📋',
      href: '/provincias/santa_fe/planes',
      count: planes.length,
      preview: planes.slice(0, 3).map(p => p.Title),
      color: 'from-blue-500/10 to-blue-600/10 border-blue-500/20 hover:from-blue-500/20 hover:to-blue-600/20'
    },
    {
      id: 'eventos',
      titulo: 'Calendario de Eventos',
      icon: '📅',
      href: '/provincias/santa_fe/eventos',
      count: eventos.length,
      preview: eventos.slice(0, 3).map(e => e.Título),
      color: 'from-green-500/10 to-green-600/10 border-green-500/20 hover:from-green-500/20 hover:to-green-600/20'
    },
    {
      id: 'oficinas',
      titulo: 'Oficinas de Información',
      icon: '📍',
      href: '/provincias/santa_fe/oficinas',
      count: oficinas.length,
      preview: oficinas.slice(0, 3).map(o => o.Localidad),
      color: 'from-orange-500/10 to-orange-600/10 border-orange-500/20 hover:from-orange-500/20 hover:to-orange-600/20'
    },
    {
      id: 'agencias',
      titulo: 'Agencias de Viajes',
      icon: '✈️',
      href: '/provincias/santa_fe/agencias',
      count: agencias.length,
      preview: agencias.slice(0, 3).map(a => a.Agencia),
      color: 'from-red-500/10 to-red-600/10 border-red-500/20 hover:from-red-500/20 hover:to-red-600/20'
    },
    {
      id: 'preguntas-frecuentes',
      titulo: 'Preguntas Frecuentes',
      icon: '❓',
      href: '/provincias/santa_fe#preguntas-frecuentes',
      count: preguntasFrecuentes.length,
      preview: preguntasFrecuentes.slice(0, 3).map(p => p.Pregunta),
      color: 'from-purple-500/10 to-purple-600/10 border-purple-500/20 hover:from-purple-500/20 hover:to-purple-600/20',
      isAnchor: true
    },
    {
      id: 'noticias',
      titulo: 'Noticias',
      icon: '📰',
      href: '/provincias/santa_fe/noticias',
      count: noticias.length,
      preview: noticias.slice(0, 3).map(n => n.Title),
      color: 'from-indigo-500/10 to-indigo-600/10 border-indigo-500/20 hover:from-indigo-500/20 hover:to-indigo-600/20'
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-[#FAF8F3] to-[#F5F1E8] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold uppercase tracking-widest mb-4 text-[#5A4E3D]">
            Descubrí Todo Sobre Santa Fe
          </h2>
          <p className="text-[#6B5D47] text-lg max-w-2xl mx-auto">
            Explora nuestras secciones y encuentra toda la información que necesitás para planificar tu viaje
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {secciones.map((seccion) => {
            const isAnchor = seccion.href.includes('#');
            const Component = isAnchor ? 'a' : Link;
            const props = isAnchor 
              ? { href: seccion.href }
              : { href: seccion.href as any };
            
            return (
              <Component
                key={seccion.id}
                {...props}
                className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${seccion.color} border-2 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-2xl`}
              >
              <div className="p-6 h-full flex flex-col">
                {/* Icono y título */}
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl transform group-hover:scale-110 transition-transform duration-300">
                    {seccion.icon}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-[#5A4E3D] group-hover:text-[#8B7355] transition-colors duration-300">
                      {seccion.titulo}
                    </h3>
                    <p className="text-sm text-[#6B5D47] mt-1">
                      {seccion.count} {seccion.count === 1 ? 'item' : 'items'} disponibles
                    </p>
                  </div>
                </div>

                {/* Preview */}
                <div className="flex-grow space-y-2 mb-4">
                  {seccion.preview.map((item, index) => (
                    <div
                      key={index}
                      className="text-sm text-[#6B5D47] line-clamp-1 flex items-start gap-2"
                    >
                      <span className="text-[#A68B5B] mt-1">•</span>
                      <span className="flex-1">{item}</span>
                    </div>
                  ))}
                  {seccion.count > 3 && (
                    <p className="text-xs text-[#A68B5B] font-medium mt-2">
                      + {seccion.count - 3} más...
                    </p>
                  )}
                </div>

                {/* Botón */}
                <div className="flex items-center justify-between pt-4 border-t border-[#C9B99B]/30">
                  <span className="text-sm font-medium text-[#A68B5B] group-hover:text-[#8B7355] transition-colors duration-300">
                    Ver todos →
                  </span>
                  <svg
                    className="w-5 h-5 text-[#A68B5B] transform group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Component>
            );
          })}
        </div>
      </div>
    </section>
  );
}
