import type { Provincia } from "@/lib/data";
import { resumirProvincia } from "@/lib/catalog";
import { agruparPorRegion } from "@/lib/regiones";
import MapaArgentina from "./MapaArgentina";
import ProvinciaCard from "./ProvinciaCard";
import { GRILLA_TARJETAS } from "@/components/ui/grillas";
import Icono from "@/components/ui/Icono";
import EspacioPublicitario from "@/components/publicidad/EspacioPublicitario";
import { anunciosDelEspacio } from "@/lib/publicidad";

interface ViajeArgentinaProps {
  provincias: Provincia[];
}

// Server Component: las 24 provincias llegan agrupadas por región en el HTML, y la leyenda del
// mapa salta a cada grupo con anclas. Sin JavaScript solo falta el mapa interactivo.
export default function ViajeArgentina({ provincias }: ViajeArgentinaProps) {
  const grupos = agruparPorRegion(provincias, p => p.zona);
  // Desde 1280 px el anuncio ocupa una columna a la derecha de la tarjeta (del lado de la leyenda, el
  // más liviano): la leyenda pasa a una columna y el mapa conserva casi todo su ancho. Antes, el
  // anuncio va en el flujo después de la tarjeta, sin tapar el mapa.
  const conAnuncio = anunciosDelEspacio("provincias-lateral-mapa").length > 0;
  return (
    <>
      <div data-publicidad-mapa className={conAnuncio ? "xl:grid xl:grid-cols-[minmax(0,1fr)_250px] xl:gap-10" : undefined}>
        <div id="mapa-provincias" className={`grid grid-cols-[minmax(0,1fr)] items-center gap-8 rounded-tarjeta border border-arena-300/80 bg-white p-5 shadow-tarjeta sm:p-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12 ${conAnuncio ? "xl:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]" : ""}`}>
          <MapaArgentina provincias={provincias.map(({ provincia, slug }) => ({ provincia, slug }))} />
          <nav aria-label="Regiones de Argentina">
            <p className="antetitulo text-terracota-600">Seis regiones</p>
            <h2 id="mapa-provincias-heading" className="mt-1 font-display text-seccion text-tinta-900">Mapa y listado de provincias</h2>
            <p className="mt-2 text-tinta-700">Elegí una provincia en el mapa o saltá a su región.</p>
            <ul className={`mt-6 grid list-none grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2 md:grid-cols-1 ${conAnuncio ? "" : "xl:grid-cols-2"}`}>
              {grupos.map(({ region, items }) => (
                <li key={region.nombre}>
                  <a href={`#${region.ancla}`} className="group flex min-h-14 items-center gap-3 rounded-control border border-arena-300/80 px-3 py-2 transition-colors hover:border-arena-400 hover:bg-arena-50">
                    <span aria-hidden="true" className={`size-3.5 shrink-0 rounded-full ${region.fondo}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-tinta-900">{region.nombre}</span>
                      <span className="block truncate text-sm text-tinta-500">{region.lema}</span>
                    </span>
                    <span className="text-sm text-tinta-500">{items.length}</span>
                    <Icono nombre="flecha" className="size-4 rotate-90 text-tinta-500 group-hover:text-lago-600" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        {conAnuncio && (
          <div data-publicidad-columna="mapa" className="mt-10 xl:mt-0 xl:self-stretch">
            <EspacioPublicitario id="provincias-lateral-mapa" className="xl:sticky xl:top-[calc(var(--alto-encabezado)+1.5rem)]" />
          </div>
        )}
      </div>

      {grupos.map(({ region, items }) => (
        <section key={region.nombre} id={region.ancla} aria-labelledby={`${region.ancla}-titulo`} className="mt-14 sm:mt-20">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-arena-300/80 pb-4">
            <div>
              <p className={`antetitulo ${region.texto}`}>{items.length} {items.length === 1 ? "provincia" : "provincias"}</p>
              <h2 id={`${region.ancla}-titulo`} className="mt-1 font-display text-seccion text-tinta-900">{region.nombre}</h2>
            </div>
            <p className="text-tinta-700">{region.lema}</p>
          </div>
          <div className={GRILLA_TARJETAS}>
            {items.map((provincia) => (
              <ProvinciaCard key={provincia.slug} provincia={resumirProvincia(provincia)} />
            ))}
          </div>
        </section>
      ))}

      <p className="mt-14 text-center">
        <a href="#mapa-provincias" className="inline-flex min-h-11 items-center gap-2 font-semibold text-lago-600 hover:text-lago-700">
          <Icono nombre="flecha" className="size-4 -rotate-90" />
          Volver al mapa
        </a>
      </p>
    </>
  );
}
