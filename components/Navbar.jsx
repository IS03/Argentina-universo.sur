"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navLinks = [
    { href: "/provincias", label: "Viaja por Argentina" },
    { href: "/actividades", label: "Qué hacer" },
    { href: "/escapadas", label: "Escapadas" },
    { href: "/seguridad", label: "Guía de seguridad" },
    { href: "https://www.argentina.gob.ar/jefatura/turismo/noticias", label: "Noticias", external: true },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-md border-b border-[#6CB4EE]/30 shadow-lg">
      <div className="w-full py-3 sm:py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center pl-4 sm:pl-6 md:pl-8 group z-50" onClick={closeMenu}>
          <Image
            src="/img/logopng.png"
            alt="Argentina Universo Sur"
            width={120}
            height={40}
            className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto transition-transform duration-300 group-hover:scale-105"
            priority
          />
        </Link>

        {/* Botón hamburger para móvil */}
        <button
          onClick={toggleMenu}
          className="md:hidden pr-4 z-50 flex flex-col gap-1.5 p-2 transition-all duration-300"
          aria-label="Toggle menu"
        >
          <span
            className={`w-6 h-0.5 bg-gray-300 transition-all duration-300 ${
              isMenuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          ></span>
          <span
            className={`w-6 h-0.5 bg-gray-300 transition-all duration-300 ${
              isMenuOpen ? "opacity-0" : ""
            }`}
          ></span>
          <span
            className={`w-6 h-0.5 bg-gray-300 transition-all duration-300 ${
              isMenuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          ></span>
        </button>

        {/* Menú desktop - visible en md y superior */}
        <div className="hidden md:flex gap-4 sm:gap-6 md:gap-8 text-xs sm:text-sm uppercase tracking-widest pr-4 sm:pr-6 md:pr-8">
          {navLinks.map((link) => {
            const LinkComponent = link.external ? "a" : Link;
            const linkProps = link.external
              ? {
                  href: link.href,
                  target: "_blank",
                  rel: "noopener noreferrer",
                }
              : { href: link.href };

            return (
              <LinkComponent
                key={link.href}
                {...linkProps}
                className="text-gray-300 hover:text-[#6CB4EE] transition-all duration-300 relative group"
              >
                {link.label}
                <span
                  className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6CB4EE] via-[#FFD700] to-[#6CB4EE] group-hover:w-full transition-all duration-300"
                  style={{
                    boxShadow: "0 0 8px rgba(108, 180, 238, 0.6)",
                  }}
                ></span>
              </LinkComponent>
            );
          })}
        </div>
      </div>

      {/* Menú móvil desplegable */}
      <div
        className={`md:hidden fixed top-0 left-0 w-full h-screen bg-gradient-to-b from-slate-900/98 via-slate-800/98 to-slate-900/98 backdrop-blur-lg transition-all duration-300 ease-in-out z-40 ${
          isMenuOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8 pt-20">
          {navLinks.map((link) => {
            const LinkComponent = link.external ? "a" : Link;
            const linkProps = link.external
              ? {
                  href: link.href,
                  target: "_blank",
                  rel: "noopener noreferrer",
                }
              : { href: link.href };

            return (
              <LinkComponent
                key={link.href}
                {...linkProps}
                onClick={closeMenu}
                className="text-gray-300 hover:text-[#6CB4EE] transition-all duration-300 text-lg uppercase tracking-widest relative group py-2"
              >
                {link.label}
                <span
                  className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6CB4EE] via-[#FFD700] to-[#6CB4EE] group-hover:w-full transition-all duration-300"
                  style={{
                    boxShadow: "0 0 8px rgba(108, 180, 238, 0.6)",
                  }}
                ></span>
              </LinkComponent>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
