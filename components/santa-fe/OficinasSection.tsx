import { OficinaInforme } from "@/lib/data";
import Icono from "@/components/ui/Icono";
import { boton } from "@/components/ui/estilos";

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
    <section id="oficinas" aria-labelledby="oficinas-titulo">
      <h2 id="oficinas-titulo" className="sr-only">Oficinas de Información Turística</h2>
      <p className="mb-6 text-sm font-medium text-tinta-700">{oficinas.length} oficinas en la provincia</p>
      <ul className="grid list-none gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
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
            <li key={index}>
              <article className="flex h-full flex-col rounded-tarjeta border border-arena-300/80 bg-white p-5 shadow-tarjeta">
                <h3 className="flex items-start gap-2 text-lg font-semibold text-tinta-900">
                  <Icono nombre="pin" className="mt-1 size-5 text-region-litoral" />
                  {oficina.Localidad}
                </h3>

                <dl className="mt-3 flex-1 space-y-2.5 text-sm text-tinta-700">
                  {telefono && (
                    <div className="flex items-start gap-2">
                      <dt><Icono nombre="telefono" className="mt-0.5 size-4 text-tinta-500" /><span className="sr-only">Teléfono</span></dt>
                      <dd className="break-words">{telefono}</dd>
                    </div>
                  )}
                  {email && (
                    <div className="flex items-start gap-2">
                      <dt><Icono nombre="correo" className="mt-0.5 size-4 text-tinta-500" /><span className="sr-only">Correo</span></dt>
                      <dd className="min-w-0"><a href={`mailto:${email}`} className="inline-block break-words py-1 text-lago-600 underline underline-offset-2">{email}</a></dd>
                    </div>
                  )}
                  {web && (
                    <div className="flex items-start gap-2">
                      <dt><Icono nombre="globo" className="mt-0.5 size-4 text-tinta-500" /><span className="sr-only">Sitio web</span></dt>
                      <dd className="min-w-0">
                        <a href={web.startsWith('http') ? web : `https://${web}`} target="_blank" rel="noopener noreferrer" className="inline-block break-words py-1 text-lago-600 underline underline-offset-2">
                          {web.replace(/^https?:\/\//, '')}
                        </a>
                      </dd>
                    </div>
                  )}
                  {oficina["Direcciones y horarios"] && (
                    <div className="flex items-start gap-2 border-t border-arena-300/70 pt-2.5">
                      <dt><Icono nombre="reloj" className="mt-0.5 size-4 text-tinta-500" /><span className="sr-only">Dirección y horarios</span></dt>
                      <dd className="break-words leading-relaxed">{oficina["Direcciones y horarios"]}</dd>
                    </div>
                  )}
                </dl>

                {(telefonoLink || whatsappLink) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {telefonoLink && (
                      <a href={telefonoLink} aria-label={`Llamar a la oficina de ${oficina.Localidad}`} className={boton("secundario")}>
                        <Icono nombre="telefono" className="size-4" />
                        Llamar
                      </a>
                    )}
                    {whatsappLink && (
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp de la oficina de ${oficina.Localidad} (abre en otra pestaña)`} className={boton("secundario")}>
                        WhatsApp
                        <Icono nombre="externo" className="size-4" />
                      </a>
                    )}
                  </div>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
