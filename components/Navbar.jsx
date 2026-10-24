"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ROUTES, NAV_ANCHORS } from "@/lib/site-links";

const MENU_ID = "menu-movil";
// Breakpoint md de Tailwind: desde ahí el menú móvil no existe y no puede quedar abierto.
const ESCRITORIO = "(min-width: 768px)";

const navLinks = [
  { href: ROUTES.provincias, label: "Viaja por Argentina", aria: NAV_ANCHORS.provincias },
  { href: ROUTES.actividades, label: "Qué hacer", aria: NAV_ANCHORS.actividades },
  { href: ROUTES.escapadas, label: "Escapadas", aria: NAV_ANCHORS.escapadas },
  { href: ROUTES.seguridad, label: "Guía de seguridad", aria: NAV_ANCHORS.seguridad },
  { href: "https://www.argentina.gob.ar/node/56177/noticias", label: "Noticias", external: true },
];

const propsDeEnlace = (link) => link.external
  ? {
      href: link.href,
      target: "_blank",
      rel: "noopener noreferrer",
      "aria-label": `${link.label} - Abre en nueva ventana`,
    }
  : { href: link.href, "aria-label": link.aria };

export default function Navbar() {
  const pathname = usePathname();
  // El menú queda abierto solo en la ruta donde se abrió: navegar (incluido atrás) lo cierra.
  const [abiertoEn, setAbiertoEn] = useState(null);
  const isMenuOpen = abiertoEn !== null && abiertoEn === pathname;
  const logoRef = useRef(null);
  const botonRef = useRef(null);
  const menuRef = useRef(null);

  const toggleMenu = () => setAbiertoEn(isMenuOpen ? null : pathname);
  const closeMenu = () => setAbiertoEn(null);

  useEffect(() => {
    const escritorio = window.matchMedia(ESCRITORIO);
    const alCambiar = (e) => { if (e.matches) setAbiertoEn(null); };
    escritorio.addEventListener("change", alCambiar);
    return () => escritorio.removeEventListener("change", alCambiar);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    menuRef.current?.querySelector("a")?.focus();
    // El menú cubre la pantalla: la página de fondo no debe desplazarse mientras está abierto.
    const overflowPrevio = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const alPresionar = (e) => {
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
  const contenerFoco = (e) => {
    if (!isMenuOpen || e.key !== "Tab") return;
    const enfocables = [logoRef.current, botonRef.current, ...menuRef.current.querySelectorAll("a")];
    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  };

  return (
    <nav
      className="fixed top-0 w-full z-50 bg-gradient-to-r from-[#F5F1E8]/95 via-[#E8DDD0]/95 to-[#F5F1E8]/95 backdrop-blur-md border-b border-[#D4C4B0]/50 shadow-lg"
      role="navigation"
      aria-label="Navegación principal"
      onKeyDown={contenerFoco}
    >
      <div className="w-full py-3 sm:py-4 flex justify-between items-center">
        <Link
          ref={logoRef}
          href={ROUTES.home}
          className="flex items-center pl-4 sm:pl-6 md:pl-8 group z-50"
          onClick={closeMenu}
          aria-label={NAV_ANCHORS.home}
        >
          <Image
            src="/img/logopng.png"
            alt="Argentina Universo Sur - Turismo en Argentina"
            width={120}
            height={40}
            className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
            priority
          />
        </Link>

        {/* Botón hamburger para móvil: 44 × 44 px de área táctil */}
        <button
          ref={botonRef}
          type="button"
          onClick={toggleMenu}
          className="md:hidden mr-2 z-50 flex flex-col items-center justify-center gap-1.5 w-11 h-11"
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isMenuOpen}
          aria-controls={MENU_ID}
        >
          <span
            aria-hidden="true"
            className={`w-6 h-0.5 bg-[#6B5D47] transition-all duration-300 motion-reduce:transition-none ${
              isMenuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          ></span>
          <span
            aria-hidden="true"
            className={`w-6 h-0.5 bg-[#6B5D47] transition-all duration-300 motion-reduce:transition-none ${
              isMenuOpen ? "opacity-0" : ""
            }`}
          ></span>
          <span
            aria-hidden="true"
            className={`w-6 h-0.5 bg-[#6B5D47] transition-all duration-300 motion-reduce:transition-none ${
              isMenuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          ></span>
        </button>

        {/* Menú desktop - visible en md y superior */}
        <ul className="hidden md:flex gap-4 sm:gap-6 md:gap-8 text-xs sm:text-sm uppercase tracking-widest pr-4 sm:pr-6 md:pr-8 list-none">
          {navLinks.map((link) => {
            const LinkComponent = link.external ? "a" : Link;
            return (
              <li key={link.href}>
                <LinkComponent
                  {...propsDeEnlace(link)}
                  className="text-[#6B5D47] hover:text-[#A68B5B] transition-all duration-300 relative group"
                >
                  {link.label}
                  <span
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#A68B5B] via-[#C9B99B] to-[#A68B5B] group-hover:w-full transition-all duration-300"
                    style={{
                      boxShadow: "0 0 8px rgba(166, 139, 91, 0.6)",
                    }}
                  ></span>
                </LinkComponent>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Menú móvil desplegable. Cerrado es inert: no recibe foco, toques ni lectores de pantalla. */}
      <div
        id={MENU_ID}
        ref={menuRef}
        className={`md:hidden fixed top-0 left-0 w-full h-screen bg-gradient-to-b from-[#F5F1E8]/98 via-[#E8DDD0]/98 to-[#F5F1E8]/98 backdrop-blur-lg transition-all duration-300 ease-in-out motion-reduce:transition-none z-40 ${
          isMenuOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-full pointer-events-none"
        }`}
        inert={!isMenuOpen}
      >
        <ul className="flex flex-col items-end justify-start h-full gap-0 pt-24 pr-6 list-none w-full">
          {navLinks.map((link) => {
            const LinkComponent = link.external ? "a" : Link;
            return (
              <li key={link.href} className="w-full">
                {/* block: el relleno vertical ocupa espacio propio y cada toque cae en su enlace */}
                <LinkComponent
                  {...propsDeEnlace(link)}
                  onClick={closeMenu}
                  className="block text-[#6B5D47] hover:text-[#A68B5B] transition-all duration-300 motion-reduce:transition-none text-lg uppercase tracking-widest relative group py-4 w-full text-right border-b border-[#D4C4B0]/30"
                >
                  {link.label}
                  <span
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#A68B5B] via-[#C9B99B] to-[#A68B5B] group-hover:w-full transition-all duration-300"
                  ></span>
                </LinkComponent>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
