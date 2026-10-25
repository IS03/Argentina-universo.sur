import type { FuenteOficial } from "@/lib/destinos/modelo";
import Icono from "@/components/ui/Icono";

export const anclaFuente = (id: string) => `fuente-${id}`;

// Citas en línea: cada afirmación enlaza a su fuente dentro de la misma página.
export function ReferenciasFuentes({ ids, fuentes }: { ids: string[]; fuentes: FuenteOficial[] }) {
  if (!ids.length) return null;
  return (
    <p className="mt-3 text-sm text-tinta-500">
      Fuentes:{" "}
      {ids.map((id, index) => (
        <span key={id}>
          {index > 0 ? " · " : ""}
          <a className="underline decoration-arena-400 underline-offset-2 hover:text-lago-700" href={`#${anclaFuente(id)}`}>
            {fuentes.find(fuente => fuente.id === id)?.titulo}
          </a>
        </span>
      ))}
    </p>
  );
}

// Fechas visibles en formato ISO, como en el registro editorial: sin ambigüedad de día y mes.
export const fechaVisible = (valor: string) => valor.replace("T", " ");

// Listado final de fuentes oficiales con fecha de consulta y, si la hay, de publicación.
export function ListaFuentes({ fuentes }: { fuentes: FuenteOficial[] }) {
  return (
    <ol className="space-y-3">
      {fuentes.map(fuente => (
        <li key={fuente.id} id={anclaFuente(fuente.id)} className="flex gap-3 rounded-control border border-arena-300/80 bg-white p-4">
          <Icono nombre="fuente" className="mt-0.5 size-5 text-terracota-600" />
          <div className="min-w-0">
            <a className="font-medium break-words text-lago-600 underline decoration-lago-600/40 underline-offset-2 hover:decoration-lago-600" href={fuente.url} rel="noreferrer">
              {fuente.titulo}
            </a>
            <p className="mt-1 text-sm text-tinta-500">
              {fuente.organismo && <>{fuente.organismo} · </>}
              {fuente.publicadaEl && <>comunicado del <time dateTime={fuente.publicadaEl}>{fechaVisible(fuente.publicadaEl)}</time> · </>}
              consultada el <time dateTime={fuente.consultadaEl}>{fechaVisible(fuente.consultadaEl)}</time>
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
