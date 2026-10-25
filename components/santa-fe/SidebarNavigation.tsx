"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const secciones = [
  { 
    id: 'planes', 
    label: 'Planes e Ideas', 
    icon: '📋', 
    href: '/provincias/santa_fe/planes'
  },
  { 
    id: 'eventos', 
    label: 'Eventos', 
    icon: '📅', 
    href: '/provincias/santa_fe/eventos'
  },
  { 
    id: 'oficinas', 
    label: 'Oficinas', 
    icon: '📍', 
    href: '/provincias/santa_fe/oficinas'
  },
  { 
    id: 'agencias', 
    label: 'Agencias', 
    icon: '✈️', 
    href: '/provincias/santa_fe/agencias'
  },
  { 
    id: 'noticias', 
    label: 'Noticias', 
    icon: '📰', 
    href: '/provincias/santa_fe/noticias'
  },
];

export default function SidebarNavigation() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block w-64 flex-shrink-0">
      <div className="sticky top-32">
        <div className="bg-gradient-to-br from-arena-200 to-arena-300 border border-arena-300/50 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold uppercase tracking-wide text-tinta-900 mb-4">
            Navegación
          </h3>
          <nav className="space-y-2">
            <Link
              href="/provincias/santa_fe"
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 ${
                pathname === '/provincias/santa_fe'
                  ? 'bg-lago-600 text-white shadow-md'
                  : 'text-tinta-900 hover:bg-arena-300/50'
              }`}
            >
              <span>🏠</span>
              <span className="text-sm font-medium">Inicio</span>
            </Link>
            {secciones.map((seccion) => {
              const isAnchor = seccion.href.includes('#');
              const isActive = pathname === seccion.href || (isAnchor && pathname === '/provincias/santa_fe');
              const Component = isAnchor ? 'a' : Link;
              const props = isAnchor 
                ? { href: seccion.href }
                : { href: seccion.href };
              
              return (
                <Component
                  key={seccion.id}
                  {...props}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive && !isAnchor
                      ? 'bg-lago-600 text-white shadow-md'
                      : 'text-tinta-900 hover:bg-arena-300/50'
                  }`}
                >
                  <span>{seccion.icon}</span>
                  <span className="text-sm font-medium">{seccion.label}</span>
                </Component>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
