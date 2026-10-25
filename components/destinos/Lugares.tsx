import type { Atractivo, DatoPractico, FuenteOficial, Localidad, TipoAtractivo, UbicacionMapa } from "@/lib/destinos/modelo";
import Icono, { type NombreIcono } from "@/components/ui/Icono";
import FotoConCredito from "@/components/destinos/FotoConCredito";
import { ReferenciasFuentes, fechaVisible } from "@/components/destinos/Fuentes";

// Localidades de referencia de un destino, como etiquetas.
export function Localidades({ localidades }: { localidades: Pick<Localidad, "id" | "nombre">[] }) {
  return (
    <ul aria-label="Localidades de referencia" className="flex list-none flex-wrap gap-2">
      {localidades.map(localidad => (
        <li key={localidad.id} className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-arena-400/70 bg-white px-3 text-sm text-tinta-700">
          <Icono nombre="pin" className="size-3.5 text-terracota-600" />
          {localidad.nombre}
        </li>
      ))}
    </ul>
  );
}

// Ubicaciones como enlaces a OpenStreetMap: nada se carga hasta que la persona decide abrirlo.
export function Ubicaciones({ ubicaciones, fuentes }: { ubicaciones: UbicacionMapa[]; fuentes: FuenteOficial[] }) {
  return (
    <ul className="grid list-none gap-3 sm:grid-cols-2">
      {ubicaciones.map(ubicacion => (
        <li key={ubicacion.id} className="flex flex-col rounded-control border border-arena-300/80 bg-white p-4">
          <h3 className="flex items-center gap-2 font-semibold text-tinta-900">
            <Icono nombre="mapa" className="size-5 text-lago-600" />
            {ubicacion.etiqueta}
          </h3>
          <p className="mt-2 text-tinta-700">{ubicacion.descripcion}</p>
          <a className="mt-3 inline-flex min-h-11 items-center gap-1.5 self-start font-semibold text-lago-600 underline decoration-lago-600/40 underline-offset-4 hover:decoration-lago-600" href={ubicacion.mapaUrl} rel="noreferrer">
            Buscar {ubicacion.etiqueta} en OpenStreetMap
            <Icono nombre="externo" className="size-4" />
          </a>
          <ReferenciasFuentes ids={ubicacion.fuenteIds} fuentes={fuentes} />
        </li>
      ))}
    </ul>
  );
}

// Datos prácticos breves (accesos, horarios de referencia, servicios) con su fuente y fecha.
export function InfoPractica({ datos, fuentes }: { datos: DatoPractico[]; fuentes: FuenteOficial[] }) {
  return (
    <dl className="divide-y divide-arena-300/80 rounded-control border border-arena-300/80 bg-white">
      {datos.map(dato => (
        <div key={dato.id} className="grid gap-1 p-4 sm:grid-cols-[12rem_1fr] sm:gap-4">
          <dt className="font-semibold text-tinta-900">{dato.etiqueta}</dt>
          <dd className="text-tinta-700">
            {dato.valor}
            {dato.verificadoEl && <span className="block text-sm text-tinta-500">Verificado el <time dateTime={dato.verificadoEl}>{fechaVisible(dato.verificadoEl)}</time></span>}
            <ReferenciasFuentes ids={dato.fuenteIds} fuentes={fuentes} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

const TIPOS: Record<TipoAtractivo, { etiqueta: string; icono: NombreIcono }> = {
  naturaleza: { etiqueta: "Naturaleza", icono: "montana" },
  cultura: { etiqueta: "Cultura", icono: "fuente" },
  patrimonio: { etiqueta: "Patrimonio", icono: "escudo" },
  actividad: { etiqueta: "Actividad", icono: "brujula" },
  gastronomia: { etiqueta: "Gastronomía", icono: "info" },
};

// Atractivo de un destino. Sin foto con licencia aprobada, la tarjeta es solo texto (no hay relleno genérico).
export function TarjetaAtractivo({ atractivo, localidad, fuentes, nivelTitulo = "h3" }: { atractivo: Atractivo; localidad?: Pick<Localidad, "nombre">; fuentes: FuenteOficial[]; nivelTitulo?: "h3" | "h4" }) {
  const tipo = TIPOS[atractivo.tipo];
  const Titulo = nivelTitulo;
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-tarjeta border border-arena-300/80 bg-white shadow-tarjeta">
      {atractivo.foto && <FotoConCredito foto={atractivo.foto} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="p-3 pb-0" />}
      <div className="flex flex-1 flex-col p-4">
        <p className="antetitulo flex items-center gap-1.5 text-terracota-600">
          <Icono nombre={tipo.icono} className="size-4" />
          {tipo.etiqueta}
          {localidad && <span className="font-normal normal-case tracking-normal text-tinta-500">· {localidad.nombre}</span>}
        </p>
        <Titulo className="mt-1 text-lg font-semibold text-tinta-900">{atractivo.nombre}</Titulo>
        <p className="mt-2 text-tinta-700">{atractivo.descripcion}</p>
        {atractivo.mapaUrl && (
          <a className="mt-3 inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-lago-600 underline decoration-lago-600/40 underline-offset-4" href={atractivo.mapaUrl} rel="noreferrer">
            Ver en el mapa <Icono nombre="externo" className="size-4" />
          </a>
        )}
        <ReferenciasFuentes ids={atractivo.fuenteIds} fuentes={fuentes} />
      </div>
    </article>
  );
}
