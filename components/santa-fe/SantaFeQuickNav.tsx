"use client";

import Link from "next/link";

const secciones = [
  { 
    id: 'planes', 
    label: 'Planes', 
    icon: '📋', 
    href: '/provincias/santa_fe/planes',
    color: 'from-blue-500/20 to-blue-600/20 border-blue-500/30'
  },
  { 
    id: 'eventos', 
    label: 'Eventos', 
    icon: '📅', 
    href: '/provincias/santa_fe/eventos',
    color: 'from-green-500/20 to-green-600/20 border-green-500/30'
  },
  { 
    id: 'oficinas', 
    label: 'Oficinas', 
    icon: '📍', 
    href: '/provincias/santa_fe/oficinas',
    color: 'from-orange-500/20 to-orange-600/20 border-orange-500/30'
  },
  { 
    id: 'agencias', 
    label: 'Agencias', 
    icon: '✈️', 
    href: '/provincias/santa_fe/agencias',
    color: 'from-red-500/20 to-red-600/20 border-red-500/30'
  },
  { 
    id: 'preguntas-frecuentes', 
    label: 'Preguntas', 
    icon: '❓', 
    href: '/provincias/santa_fe#preguntas-frecuentes',
    color: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    isAnchor: true
  },
  { 
    id: 'noticias', 
    label: 'Noticias', 
    icon: '📰', 
    href: '/provincias/santa_fe/noticias',
    color: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/30'
  },
];

export default function SantaFeQuickNav() {
  return (
    <div className="bg-gradient-to-br from-[#A68B5B]/10 via-[#C9B99B]/10 to-[#A68B5B]/10 border-y-2 border-[#A68B5B]/30 py-6 mb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-xs sm:text-sm uppercase tracking-widest text-[#5A4E3D] mb-4 font-semibold">
          Explora Santa Fe
        </p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
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
                className="group flex flex-col items-center justify-center p-3 sm:p-4 bg-white/50 hover:bg-white/80 backdrop-blur-sm rounded-lg border border-[#C9B99B]/30 hover:border-[#A68B5B]/50 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
              >
                <span className="text-2xl sm:text-3xl mb-2 transform group-hover:scale-110 transition-transform duration-300">
                  {seccion.icon}
                </span>
                <span className="text-xs sm:text-sm font-medium text-[#5A4E3D] text-center group-hover:text-[#8B7355] transition-colors duration-300">
                  {seccion.label}
                </span>
              </Component>
            );
          })}
        </div>
      </div>
    </div>
  );
}
