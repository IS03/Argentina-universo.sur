"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ROUTES, NAV_ANCHORS } from "@/lib/site-links";
import Icono from "@/components/ui/Icono";

const MENU_ID = "menu-movil";
// Breakpoint lg de Tailwind: desde ahí el menú móvil no existe y no puede quedar abierto.
const ESCRITORIO = "(min-width: 1024px)";

interface EnlaceNav {
  href: string;
  label: string;
  descripcion: string;
  aria?: string;
  external?: boolean;
}

const navLinks: EnlaceNav[] = [
  { href: ROUTES.provincias, label: "Viaja por Argentina", descripcion: "Las 24 provincias por región", aria: NAV_ANCHORS.provincias },
  { href: ROUTES.actividades, label: "Qué hacer", descripcion: "Actividades turísticas en todo el país", aria: NAV_ANCHORS.actividades },
  { href: ROUTES.escapadas, label: "Escapadas", descripcion: "Guías para viajes cortos", aria: NAV_ANCHORS.escapadas },
  { href: ROUTES.seguridad, label: "Guía de seguridad", descripcion: "Consejos antes y durante el viaje", aria: NAV_ANCHORS.seguridad },
  { href: "https://www.argentina.gob.ar/node/56177/noticias", label: "Noticias", descripcion: "Novedades oficiales de turismo", external: true },
];

const propsDeEnlace = (link: EnlaceNav) => link.external
  ? {
      href: link.href,
      target: "_blank",
      rel: "noopener noreferrer",
      "aria-label": `${link.label} - Abre en nueva ventana`,
    }
  : { href: link.href, "aria-label": link.aria };

// Sección activa: la ruta coincide o es una página dentro de ella (p. ej. /provincias/salta).
const esActual = (pathname: string, link: EnlaceNav) =>
  !link.external && (pathname === link.href || pathname.startsWith(link.href + "/"));

export default function Navbar() {
  const pathname = usePathname();
  // El menú queda abierto solo en la ruta donde se abrió: navegar (incluido atrás) lo cierra.
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null);
  const isMenuOpen = abiertoEn !== null && abiertoEn === pathname;
  const logoRef = useRef<HTMLAnchorElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setAbiertoEn(isMenuOpen ? null : pathname);
  const closeMenu = () => setAbiertoEn(null);

  useEffect(() => {
    const escritorio = window.matchMedia(ESCRITORIO);
    const alCambiar = (e: MediaQueryListEvent) => { if (e.matches) setAbiertoEn(null); };
    escritorio.addEventListener("change", alCambiar);
    return () => escritorio.removeEventListener("change", alCambiar);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    menuRef.current?.querySelector("a")?.focus();
    // El menú cubre la pantalla: la página de fondo no debe desplazarse mientras está abierto.
    const overflowPrevio = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAbiertoEn(null);
      botonRef.current?.focus();
    };
    document.addEventListener("keydown", alPresionar);
    return () => {
      document.documentElement.style.overflow = overflowPrevio;
      document.removeEventListener("keydown", alPresionar);
    };
  }, [isMenuOpen]);

  // Con el menú abierto, Tab recorre solo el logo, el botón y las opciones del menú.
  const contenerFoco = (e: React.KeyboardEvent) => {
    if (!isMenuOpen || e.key !== "Tab" || !menuRef.current) return;
    const enfocables = [logoRef.current, botonRef.current, ...menuRef.current.querySelectorAll("a")];
    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo?.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero?.focus();
    }
  };

  // Sin backdrop-filter en el encabezado: crearía un bloque contenedor y el menú fijo
  // (position: fixed) quedaría recortado a la altura del encabezado.
  return (
    <header className="sticky top-0 z-50 border-b border-arena-300/80 bg-arena-50">
      <nav role="navigation" aria-label="Navegación principal" onKeyDown={contenerFoco}>
        <div className="contenedor flex h-[var(--alto-encabezado)] items-center justify-between gap-4">
          <Link
            ref={logoRef}
            href={ROUTES.home}
            className="relative z-50 -ml-1 flex items-center gap-3 rounded-lg p-1"
            onClick={closeMenu}
            aria-label={NAV_ANCHORS.home}
          >
            <Image
              src="/img/logopng.png"
              alt="Argentina Universo Sur - Turismo en Argentina"
              width={40}
              height={40}
              sizes="40px"
              className="size-9 md:size-10"
              priority
            />
            {/* Marca tipográfica: el nombre del sitio visible junto al escudo. */}
            <span className="flex flex-col leading-none" aria-hidden="true">
              <span className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-terracota-600">Argentina</span>
              <span className="font-display text-[1.375rem] text-tinta-900 md:text-2xl">Universo Sur</span>
            </span>
          </Link>

          {/* Menú de escritorio: visible desde lg. */}
          <ul className="hidden list-none items-center gap-1 lg:flex xl:gap-2">
            {navLinks.map((link) => {
              const LinkComponent = link.external ? "a" : Link;
              const actual = esActual(pathname, link);
              return (
                <li key={link.href}>
                  <LinkComponent
                    {...propsDeEnlace(link)}
                    aria-current={actual ? "page" : undefined}
                    className={`relative inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-[0.9375rem] font-medium transition-colors duration-200 xl:px-4 ${
                      actual ? "bg-tinta-900 text-white" : "text-tinta-700 hover:bg-arena-200 hover:text-tinta-900"
                    }`}
                  >
                    {link.label}
                    {link.external && <Icono nombre="externo" className="size-3.5 opacity-70" />}
                  </LinkComponent>
                </li>
              );
            })}
          </ul>

          {/* Botón del menú móvil: 44 × 44 px de área táctil. */}
          <button
            ref={botonRef}
            type="button"
            onClick={toggleMenu}
            className="relative z-50 -mr-2 flex size-11 flex-col items-center justify-center gap-1.5 rounded-full lg:hidden"
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMenuOpen}
            aria-controls={MENU_ID}
          >
            <span aria-hidden="true" className={`h-0.5 w-6 rounded bg-tinta-900 transition-transform duration-300 motion-reduce:transition-none ${isMenuOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span aria-hidden="true" className={`h-0.5 w-6 rounded bg-tinta-900 transition-opacity duration-300 motion-reduce:transition-none ${isMenuOpen ? "opacity-0" : ""}`} />
            <span aria-hidden="true" className={`h-0.5 w-6 rounded bg-tinta-900 transition-transform duration-300 motion-reduce:transition-none ${isMenuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>

        {/* Menú móvil a pantalla completa. Cerrado es inert (sin foco, toques ni lectores de pantalla)
            y queda fuera de la pantalla. */}
        <div
          id={MENU_ID}
          ref={menuRef}
          className={`fixed inset-x-0 top-0 z-40 h-dvh overflow-y-auto bg-arena-50 pt-[var(--alto-encabezado)] transition-[opacity,transform] duration-300 ease-suave motion-reduce:transition-none lg:hidden ${
            isMenuOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
          }`}
          inert={!isMenuOpen}
        >
          <ul className="contenedor list-none border-t border-arena-300/80 py-4">
            {navLinks.map((link) => {
              const LinkComponent = link.external ? "a" : Link;
              const actual = esActual(pathname, link);
              return (
                <li key={link.href} className="border-b border-arena-300/60">
                  {/* block: cada toque cae en su propio enlace, sin rellenos que se superpongan.
                      Sin prefetch: en teléfonos no se gastan datos en rutas que quizá no se visiten. */}
                  <LinkComponent
                    {...propsDeEnlace(link)}
                    {...(link.external ? {} : { prefetch: false })}
                    onClick={closeMenu}
                    aria-current={actual ? "page" : undefined}
                    className="flex min-h-16 w-full items-center justify-between gap-4 py-3"
                  >
                    <span className="flex flex-col">
                      <span className={`font-display text-[1.75rem] leading-tight ${actual ? "text-terracota-600" : "text-tinta-900"}`}>{link.label}</span>
                      <span className="text-sm text-tinta-500">{link.descripcion}</span>
                    </span>
                    <Icono nombre={link.external ? "externo" : "flecha"} className="size-5 text-tinta-500" />
                  </LinkComponent>
                </li>
              );
            })}
          </ul>
          <p className="contenedor pb-10 text-sm text-tinta-500">Turismo en Argentina, de la Puna a Tierra del Fuego.</p>
        </div>
      </nav>
    </header>
  );
}
