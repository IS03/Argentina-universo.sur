export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#F5F1E8] to-[#E8DDD0] border-t border-[#D4C4B0]/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Columna 1: Información */}
          <div>
            <h3 className="text-[#5A4E3D] font-semibold uppercase tracking-wider mb-4 text-sm">
              Argentina
            </h3>
            <p className="text-[#6B5D47] text-sm leading-relaxed">
              Descubrí destinos, paisajes y experiencias únicas en todo el país.
            </p>
          </div>

          {/* Columna 2: Enlaces rápidos */}
          <div>
            <h3 className="text-[#5A4E3D] font-semibold uppercase tracking-wider mb-4 text-sm">
              Enlaces rápidos
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/provincias"
                  className="text-[#6B5D47] hover:text-[#A68B5B] transition-colors duration-200 text-sm"
                >
                  Provincias
                </a>
              </li>
              <li>
                <a
                  href="/actividades"
                  className="text-[#6B5D47] hover:text-[#A68B5B] transition-colors duration-200 text-sm"
                >
                  Actividades
                </a>
              </li>
              <li>
                <a
                  href="/escapadas"
                  className="text-[#6B5D47] hover:text-[#A68B5B] transition-colors duration-200 text-sm"
                >
                  Escapadas
                </a>
              </li>
              <li>
                <a
                  href="/seguridad"
                  className="text-[#6B5D47] hover:text-[#A68B5B] transition-colors duration-200 text-sm"
                >
                  Guía de seguridad
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 3: Contacto/Info adicional */}
          <div>
            <h3 className="text-[#5A4E3D] font-semibold uppercase tracking-wider mb-4 text-sm">
              Información
            </h3>
            <p className="text-[#6B5D47] text-sm leading-relaxed">
              Tu guía completa para explorar Argentina.
            </p>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-[#D4C4B0]/50 pt-6 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[#8B7355] text-xs text-center sm:text-left">
              © {new Date().getFullYear()} Argentina Universo Sur. Todos los derechos reservados.
            </p>
            <p className="text-[#8B7355] text-xs text-center sm:text-right">
              Desarrollo <span className="font-semibold text-[#6B5D47]">IS</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
