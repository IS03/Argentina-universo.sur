import Link from "next/link";
import Image from "next/image";
import { ROUTES, NAV_ANCHORS } from "@/lib/site-links";
import { REGIONES_VISUALES } from "@/lib/regiones";

const enlacesRapidos = [
  { href: ROUTES.home, etiqueta: NAV_ANCHORS.home },
  { href: ROUTES.provincias, etiqueta: NAV_ANCHORS.provincias },
  { href: ROUTES.actividades, etiqueta: NAV_ANCHORS.actividades },
  { href: ROUTES.escapadas, etiqueta: NAV_ANCHORS.escapadas },
  { href: ROUTES.seguridad, etiqueta: NAV_ANCHORS.seguridad },
];

const redes = [
  {
    href: "https://www.facebook.com/santafeturar?rdid=OPkCpHQXyA61IuoS&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1Fa8vKyC1V%2F#",
    nombre: "Facebook",
    icono: <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />,
  },
  {
    href: "https://www.instagram.com/gobsantafe/?hl=es",
    nombre: "Instagram",
    icono: (
      <>
        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M12 6.865a5.135 5.135 0 100 10.27 5.135 5.135 0 000-10.27zm0 8.468a3.333 3.333 0 110-6.666 3.333 3.333 0 010 6.666zm5.338-9.87a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z" clipRule="evenodd" />
      </>
    ),
  },
  {
    href: "https://x.com/santafetur",
    nombre: "X (Twitter)",
    icono: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
  },
];

const ENLACE_PIE = "inline-flex min-h-11 items-center py-1 leading-snug text-arena-300 underline-offset-4 hover:text-white hover:underline";

export default function Footer() {
  return (
    <footer className="mt-auto bg-tinta-900 text-arena-300" role="contentinfo">
      {/* Franja con los colores de las seis regiones: el sello visual del sitio. */}
      <div aria-hidden="true" className="flex h-1.5">
        {REGIONES_VISUALES.map(region => <span key={region.nombre} className={`flex-1 ${region.fondo}`} />)}
      </div>
      <div className="contenedor grid grid-cols-2 gap-x-6 gap-y-10 py-12 sm:py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        {/* En teléfonos la marca ocupa el ancho y los dos bloques de enlaces van lado a lado. */}
        <div className="col-span-2 md:col-span-1">
          <p className="flex flex-col leading-none">
            <span className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-sol-400">Argentina</span>
            <span className="mt-1 font-display text-3xl text-white">Universo Sur</span>
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            Descubrí destinos, paisajes y experiencias únicas en todo el país. Tu guía completa para explorar Argentina.
          </p>
          <div className="mt-6 inline-flex max-w-full rounded-xl bg-white px-4 py-3">
            <Image
              src="/img/logo-santa-fe-turismo-color-1.svg"
              alt="Santa Fe Turismo - Logo oficial"
              width={206}
              height={26}
              className="block h-auto w-[206px] max-w-full"
            />
          </div>
          <ul className="mt-4 flex list-none items-center gap-1">
            {redes.map(red => (
              <li key={red.nombre}>
                <a href={red.href} target="_blank" rel="noopener noreferrer" aria-label={red.nombre}
                  className="flex size-11 items-center justify-center rounded-full text-arena-300 transition-colors hover:bg-white/10 hover:text-white">
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">{red.icono}</svg>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Texto ancla descriptivo para SEO. */}
        <nav aria-label="Enlaces rápidos">
          <h2 className="antetitulo text-sol-400">Explorar</h2>
          <ul className="mt-3 list-none text-sm">
            {enlacesRapidos.map(enlace => (
              <li key={enlace.href}><Link href={enlace.href} className={ENLACE_PIE}>{enlace.etiqueta}</Link></li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Regiones turísticas">
          <h2 className="antetitulo text-sol-400">Regiones</h2>
          <ul className="mt-3 list-none text-sm">
            {REGIONES_VISUALES.map(region => (
              <li key={region.nombre}>
                <Link href={`${ROUTES.provincias}#${region.ancla}`} className={ENLACE_PIE}>Región {region.nombre}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="contenedor flex flex-col gap-2 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Argentina Universo Sur. Propiedad de Sebastián Miguel Giusti. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <Link href={ROUTES.privacidad} className="inline-flex min-h-11 items-center text-arena-300 underline underline-offset-2 hover:text-white">
              Privacidad y cookies
            </Link>
            <p>Desarrollo <span className="font-semibold text-white">IS</span></p>
          </div>
        </div>
      </div>
    </footer>
  );
}
