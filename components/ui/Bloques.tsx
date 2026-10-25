import Link from "next/link";
import Icono from "@/components/ui/Icono";

interface EncabezadoSeccionProps {
  id?: string;
  titulo: string;
  antetitulo?: string;
  bajada?: React.ReactNode;
  accion?: { href: string; etiqueta: string };
  nivel?: "h2" | "h3";
}

// Título de sección con bajada opcional y un único enlace de acción alineado a la derecha.
export function EncabezadoSeccion({ id, titulo, antetitulo, bajada, accion, nivel = "h2" }: EncabezadoSeccionProps) {
  const Titulo = nivel;
  return (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {antetitulo && <p className="antetitulo text-terracota-600">{antetitulo}</p>}
        <Titulo id={id} className="mt-1 font-display text-seccion text-tinta-900">{titulo}</Titulo>
        {bajada && <p className="mt-2 text-base leading-relaxed text-tinta-700 sm:text-lg">{bajada}</p>}
      </div>
      {accion && (
        <Link href={accion.href} className="group inline-flex min-h-11 items-center gap-2 self-start font-semibold text-lago-600 hover:text-lago-700 sm:self-auto">
          {accion.etiqueta}
          <Icono nombre="flecha" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

// Estado vacío: explica qué pasó y ofrece una salida, en lugar de dejar una grilla en blanco.
export function EstadoVacio({ titulo, children, accion }: { titulo: string; children?: React.ReactNode; accion?: React.ReactNode }) {
  return (
    <div className="rounded-tarjeta border border-dashed border-arena-400 bg-arena-100 px-6 py-10 text-center">
      <Icono nombre="brujula" className="mx-auto size-8 text-tinta-500" />
      <p className="mt-3 text-lg font-semibold text-tinta-900">{titulo}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-tinta-700">{children}</div>}
      {accion && <div className="mt-5 flex justify-center">{accion}</div>}
    </div>
  );
}
