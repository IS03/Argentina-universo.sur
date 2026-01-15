"use client";

interface FiltroZonasProps {
  zonaActiva: string;
  onZonaChange: (zona: string) => void;
}

const ZONAS = [
  { id: "Todas", label: "Todas" },
  { id: "Norte", label: "Norte" },
  { id: "Litoral", label: "Litoral" },
  { id: "Centro", label: "Centro" },
  { id: "Cuyo", label: "Cuyo" },
  { id: "Buenos Aires", label: "Buenos Aires" },
  { id: "Patagonia", label: "Patagonia" },
];

export default function FiltroZonas({ zonaActiva, onZonaChange }: FiltroZonasProps) {
  return (
    <div className="mb-8">
      {/* Menú desplegable para móvil */}
      <div className="md:hidden w-full max-w-xs mx-auto">
        <select
          value={zonaActiva}
          onChange={(e) => onZonaChange(e.target.value)}
          className="w-full px-4 py-3 rounded-lg text-sm font-medium uppercase tracking-wider
                     bg-[#E8DDD0] text-[#5A4E3D] border-2 border-[#C9B99B]/50
                     focus:outline-none focus:ring-2 focus:ring-[#A68B5B] focus:border-[#A68B5B]
                     transition-all duration-300 appearance-none cursor-pointer
                     bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%235A4E3D%22%20d%3D%22M6%209L1%204h10z%22%2F%3E%3C%2Fsvg%3E')] 
                     bg-no-repeat bg-right bg-[length:20px] pr-10"
        >
          {ZONAS.map((zona) => (
            <option key={zona.id} value={zona.id}>
              {zona.label}
            </option>
          ))}
        </select>
      </div>

      {/* Chips para desktop */}
      <div className="hidden md:flex flex-wrap justify-center gap-3">
        {ZONAS.map((zona) => (
          <button
            key={zona.id}
            onClick={() => onZonaChange(zona.id)}
            className={`
              px-5 py-2.5 rounded-full text-sm font-medium uppercase tracking-wider
              transition-all duration-300 transform hover:scale-105
              ${
                zonaActiva === zona.id
                  ? "bg-[#A68B5B] text-white shadow-lg shadow-[#A68B5B]/40 border-2 border-[#8B7355]"
                  : "bg-[#E8DDD0] text-[#5A4E3D] hover:bg-[#D4C4B0] border-2 border-[#C9B99B]/50 hover:border-[#A68B5B]/60"
              }
            `}
          >
            {zona.label}
          </button>
        ))}
      </div>
    </div>
  );
}
