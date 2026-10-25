import Link from "next/link";
import Icono, { type NombreIcono } from "@/components/ui/Icono";

export interface EnlaceRelacionado {
  href: string;
  etiqueta: string;
  icono: NombreIcono;
  prefetch?: false;
}

// Enlazado interno al pie del contenido: textos ancla descriptivos (SEO) sin recargar la cabecera.
export default function SeguirExplorando({ enlaces, etiqueta = "Explorar más contenido" }: { enlaces: EnlaceRelacionado[]; etiqueta?: string }) {
  return (
    <nav aria-label={etiqueta} className="mt-14 border-t border-arena-300/80 pt-8 sm:mt-20">
      <p className="antetitulo text-terracota-600">Seguí explorando</p>
      <ul className="mt-4 grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {enlaces.map(enlace => (
          <li key={enlace.href}>
            <Link
              href={enlace.href}
              prefetch={enlace.prefetch}
              className="group flex min-h-14 items-center gap-3 rounded-control border border-arena-300/80 bg-white px-4 py-3 font-medium text-tinta-900 transition-colors hover:border-lago-600/60 hover:text-lago-700"
            >
              <Icono nombre={enlace.icono} className="size-5 text-terracota-600" />
              <span className="flex-1">{enlace.etiqueta}</span>
              <Icono nombre="flecha" className="size-4 text-tinta-500 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-lago-600" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
