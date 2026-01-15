import Link from "next/link";
import Image from "next/image";
import { Provincia } from "@/lib/data";

interface ProvinciaCardProps {
  provincia: Provincia;
}

export default function ProvinciaCard({ provincia }: ProvinciaCardProps) {
  const imagenPortada = provincia.fotos[0] || "/img/logopng.png";

  return (
    <Link
      href={`/provincias/${provincia.slug}`}
      className="group block overflow-hidden rounded-xl bg-gradient-to-br from-[#E8DDD0] to-[#D4C4B0] hover:from-[#D4C4B0] hover:to-[#C9B99B] transition-all duration-300 transform hover:scale-[1.03] shadow-lg hover:shadow-2xl hover:shadow-[#A68B5B]/30 border border-[#C9B99B]/50 hover:border-[#A68B5B]/70"
    >
      <div className="relative w-full h-64 overflow-hidden">
        <Image
          src={imagenPortada}
          alt={provincia.provincia}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          unoptimized
        />
        {/* Gradiente más sutil y colorido */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#5A4E3D]/85 via-[#6B5D47]/30 to-transparent group-hover:from-[#5A4E3D]/75 transition-all duration-300" />
        {/* Efecto de brillo en hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#A68B5B]/0 via-transparent to-[#C9B99B]/0 group-hover:from-[#A68B5B]/15 group-hover:to-[#C9B99B]/15 transition-all duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="text-xl font-bold text-white drop-shadow-lg group-hover:text-[#F5F1E8] transition-colors duration-300">
            {provincia.provincia}
          </h3>
        </div>
      </div>
    </Link>
  );
}
