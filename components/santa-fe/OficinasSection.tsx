import { OficinaInforme } from "@/lib/data";

interface OficinasSectionProps {
  oficinas: OficinaInforme[];
}

export default function OficinasSection({ oficinas }: OficinasSectionProps) {
  const formatTelefono = (telefono: string) => {
    // Extraer números de WhatsApp
    const whatsappMatch = telefono.match(/WA:\s*([+\d\s]+)/i);
    if (whatsappMatch) {
      return whatsappMatch[1].trim();
    }
    // Extraer teléfono normal
    const telefonoMatch = telefono.match(/TE:\s*([\d\s\-]+)/i);
    if (telefonoMatch) {
      return telefonoMatch[1].trim();
    }
    return telefono;
  };

  const getWhatsAppLink = (telefono: string) => {
    const match = telefono.match(/WA:\s*([+\d\s]+)/i);
    if (match) {
      const numero = match[1].replace(/\s+/g, '');
      return `https://wa.me/${numero}`;
    }
    return null;
  };

  const getTelefonoLink = (telefono: string) => {
    const match = telefono.match(/TE:\s*([\d\s\-]+)/i);
    if (match) {
      const numero = match[1].replace(/[\s\-]/g, '');
      return `tel:${numero}`;
    }
    return null;
  };

  return (
    <section id="oficinas" className="mb-16 scroll-mt-32">
      <h2 className="text-3xl md:text-4xl font-semibold uppercase tracking-widest mb-8 text-center text-[#5A4E3D]">
        Oficinas de Información Turística
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {oficinas.map((oficina, index) => {
          const telefono = formatTelefono(oficina["Teléfono/WhatsApp"]);
          const whatsappLink = getWhatsAppLink(oficina["Teléfono/WhatsApp"]);
          const telefonoLink = getTelefonoLink(oficina["Teléfono/WhatsApp"]);
          const email = oficina["Correo/Web"]?.includes('@') 
            ? oficina["Correo/Web"] 
            : null;
          const web = oficina["Correo/Web"]?.includes('http') 
            ? oficina["Correo/Web"] 
            : null;

          return (
            <div
              key={index}
              className="group bg-gradient-to-br from-[#E8DDD0] to-[#D4C4B0] hover:from-[#D4C4B0] hover:to-[#C9B99B] border border-[#C9B99B]/50 hover:border-[#A68B5B]/70 rounded-xl p-6 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            >
              {/* Icono y Localidad */}
              <div className="flex items-start gap-3 mb-4">
                <svg
                  className="w-6 h-6 text-[#A68B5B] flex-shrink-0 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-[#5A4E3D] group-hover:text-[#8B7355] transition-colors duration-300">
                  {oficina.Localidad}
                </h3>
              </div>

              {/* Información de contacto */}
              <div className="space-y-3 text-[#6B5D47] text-sm">
                {/* Teléfono */}
                {telefono && (
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-[#A68B5B] flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="break-words">{telefono}</p>
                      <div className="flex gap-2 mt-1">
                        {telefonoLink && (
                          <a
                            href={telefonoLink}
                            className="text-[#A68B5B] hover:text-[#8B7355] text-xs underline"
                          >
                            Llamar
                          </a>
                        )}
                        {whatsappLink && (
                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#A68B5B] hover:text-[#8B7355] text-xs underline"
                          >
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Email */}
                {email && (
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-[#A68B5B] flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <a
                      href={`mailto:${email}`}
                      className="text-[#A68B5B] hover:text-[#8B7355] break-words underline"
                    >
                      {email}
                    </a>
                  </div>
                )}

                {/* Web */}
                {web && (
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-[#A68B5B] flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                      />
                    </svg>
                    <a
                      href={web.startsWith('http') ? web : `https://${web}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#A68B5B] hover:text-[#8B7355] break-words underline"
                    >
                      {web.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}

                {/* Dirección y horarios */}
                {oficina["Direcciones y horarios"] && (
                  <div className="flex items-start gap-2 pt-2 border-t border-[#C9B99B]/30">
                    <svg
                      className="w-5 h-5 text-[#A68B5B] flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="break-words leading-relaxed">
                      {oficina["Direcciones y horarios"]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
