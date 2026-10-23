"use client";

// Único elemento interactivo del texto del hero: desplaza hasta las provincias destacadas
// dejando lugar para el navbar fijo.
export default function ExplorarDestinosButton({ style }: { style: React.CSSProperties }) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        const elemento = document.getElementById("provincias-destacadas");
        if (elemento) {
          const yOffset = -80; // Offset para el navbar
          const y = elemento.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({
            top: y,
            behavior: 'smooth'
          });
        }
      }}
      className="inline-block px-6 sm:px-8 py-3 bg-[#A68B5B]/30 hover:bg-[#A68B5B]/40 backdrop-blur-sm text-white uppercase tracking-widest text-xs sm:text-sm font-medium transition-all duration-300 border border-[#C9B99B]/50 hover:border-[#C9B99B]/70 rounded-sm cursor-pointer shadow-lg"
      style={style}
    >
      Explorar destinos
    </button>
  );
}
