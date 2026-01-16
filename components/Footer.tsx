export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#F5F1E8] to-[#E8DDD0] border-t border-[#D4C4B0]/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Logo Santa Fe Turismo */}
        <div className="flex justify-center mb-8">
          <img 
            src="/img/logo-santa-fe-turismo-color-1.svg" 
            alt="Santa Fe Turismo" 
            className="h-8 sm:h-10 md:h-12 w-auto"
          />
        </div>
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
          {/* Redes sociales */}
          <div className="flex justify-center items-center gap-6 mb-6">
            <a
              href="https://www.facebook.com/santafeturar?rdid=OPkCpHQXyA61IuoS&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1Fa8vKyC1V%2F#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6B5D47] hover:text-[#A68B5B] transition-colors duration-200"
              aria-label="Facebook"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/gobsantafe/?hl=es"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6B5D47] hover:text-[#A68B5B] transition-colors duration-200"
              aria-label="Instagram"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M12 6.865a5.135 5.135 0 100 10.27 5.135 5.135 0 000-10.27zm0 8.468a3.333 3.333 0 110-6.666 3.333 3.333 0 010 6.666zm5.338-9.87a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z" clipRule="evenodd" />
              </svg>
            </a>
            <a
              href="https://x.com/santafetur"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6B5D47] hover:text-[#A68B5B] transition-colors duration-200"
              aria-label="X (Twitter)"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
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
