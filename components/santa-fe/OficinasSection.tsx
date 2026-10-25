import { OficinaInforme } from "@/lib/data";
import Icono from "@/components/ui/Icono";
import { boton } from "@/components/ui/estilos";
import { extraerContactos, webLegible } from "@/lib/contacto";
import { enlaceTelefono, enlaceWhatsapp, primerNumero } from "@/lib/telefono";

interface OficinasSectionProps {
  oficinas: OficinaInforme[];
}

export default function OficinasSection({ oficinas }: OficinasSectionProps) {
  return (
    <section id="oficinas" aria-labelledby="oficinas-titulo">
      <h2 id="oficinas-titulo" className="sr-only">Oficinas de Información Turística</h2>
      <p className="text-sm font-medium text-tinta-700">{oficinas.length} oficinas en la provincia</p>
      {/* Los horarios vienen de la planilla de la provincia y no se verifican uno por uno. */}
      <p className="mt-1 mb-6 text-sm text-tinta-500">Los horarios pueden cambiar: confirmalos por teléfono o en el sitio oficial antes de ir.</p>
      <ul className="grid list-none gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {oficinas.map((oficina, index) => {
          // El texto se muestra completo, como viene en los datos; los enlaces usan números normalizados
          // (tel: nacional con 0 y wa.me internacional solo con dígitos, lib/telefono.ts).
          const telefono = oficina["Teléfono/WhatsApp"];
          const numeroTelefono = primerNumero(telefono, "TE") ?? primerNumero(telefono, "Cel");
          const numeroWhatsapp = primerNumero(telefono, "WA");
          const telefonoLink = numeroTelefono ? enlaceTelefono(numeroTelefono) : null;
          const whatsappLink = numeroWhatsapp ? enlaceWhatsapp(numeroWhatsapp) : null;
          // Solo correos y webs que pasan la validación: un valor inválido o de relleno no se convierte
          // en enlace (lib/contacto.ts).
          const { correos, webs } = extraerContactos(oficina["Correo/Web"]);

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
                  {correos.length > 0 && (
                    <div className="flex items-start gap-2">
                      <dt><Icono nombre="correo" className="mt-0.5 size-4 text-tinta-500" /><span className="sr-only">Correo</span></dt>
                      <dd className="min-w-0">
                        {correos.map(correo => (
                          <a key={correo} href={`mailto:${correo}`} className="block break-words py-1 text-lago-600 underline underline-offset-2">{correo}</a>
                        ))}
                      </dd>
                    </div>
                  )}
                  {webs.length > 0 && (
                    <div className="flex items-start gap-2">
                      <dt><Icono nombre="globo" className="mt-0.5 size-4 text-tinta-500" /><span className="sr-only">Sitio web</span></dt>
                      <dd className="min-w-0">
                        {webs.map(web => (
                          <a key={web} href={web} target="_blank" rel="noopener noreferrer" className="block break-words py-1 text-lago-600 underline underline-offset-2">
                            {webLegible(web)}
                          </a>
                        ))}
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
