import Link from "next/link";

export interface Miga {
  href: string;
  etiqueta: string;
}

// Ruta de navegación: la página actual se nombra sin enlace y con aria-current. Sin prefetch: está
// arriba de todo en cada página y en teléfonos precargaría rutas en cada visita.
export function MigasDePan({ migas, actual }: { migas: Miga[]; actual: string }) {
  return (
    <nav aria-label="Ruta de navegación" className="text-sm text-tinta-500">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {migas.map(miga => (
          <li key={miga.href} className="flex items-center gap-2">
            <Link href={miga.href} prefetch={false} className="inline-flex min-h-6 items-center underline decoration-arena-400 underline-offset-4 hover:text-lago-700 hover:decoration-lago-600">
              {miga.etiqueta}
            </Link>
            <span aria-hidden="true" className="text-arena-400">/</span>
          </li>
        ))}
        <li aria-current="page" className="font-medium text-tinta-700">{actual}</li>
      </ol>
    </nav>
  );
}

interface EncabezadoPaginaProps {
  titulo: string;
  antetitulo?: string;
  bajada?: React.ReactNode;
  migas?: Miga[];
  colorAntetitulo?: string;
  children?: React.ReactNode;
}

// Cabecera de las páginas interiores: alineada a la izquierda, con un solo h1 y bajada corta.
export default function EncabezadoPagina({ titulo, antetitulo, bajada, migas, colorAntetitulo = "text-terracota-600", children }: EncabezadoPaginaProps) {
  return (
    <header className="border-b border-arena-300/70 bg-arena-100">
      <div className="contenedor pt-4 pb-7 sm:pt-8 sm:pb-12">
        {migas && <MigasDePan migas={migas} actual={titulo} />}
        <div className="mt-5 max-w-3xl sm:mt-10">
          {antetitulo && <p className={`antetitulo ${colorAntetitulo}`}>{antetitulo}</p>}
          <h1 className="mt-2 font-display text-titulo text-tinta-900">{titulo}</h1>
          {bajada && <p className="mt-3 text-lg leading-relaxed text-tinta-700 sm:mt-4 sm:text-xl">{bajada}</p>}
        </div>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </header>
  );
}
