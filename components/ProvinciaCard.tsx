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
      className="group block overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 transition-all duration-300 transform hover:scale-[1.03] shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 border border-slate-700/50 hover:border-blue-500/50"
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/80 transition-all duration-300" />
        {/* Efecto de brillo en hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="text-xl font-bold text-white drop-shadow-lg group-hover:text-blue-200 transition-colors duration-300">
            {provincia.provincia}
          </h3>
        </div>
      </div>
    </Link>
  );
}
