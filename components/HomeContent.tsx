import Link from "next/link";
import { ROUTES, INTERNAL_ANCHORS } from "@/lib/site-links";
import { REGION_POR_PROVINCIA } from "@/lib/catalog";
import { REGIONES_VISUALES } from "@/lib/regiones";
import ProvinciaCard from "@/components/ProvinciaCard";
import HeroCarousel from "@/components/home/HeroCarousel";
import ContinuarExplorando from "@/components/home/ContinuarExplorando";
import EspacioPublicitario from "@/components/publicidad/EspacioPublicitario";
import { EncabezadoSeccion } from "@/components/ui/Bloques";
import Icono, { type NombreIcono } from "@/components/ui/Icono";
import { boton } from "@/components/ui/estilos";
import { GRILLA_DESTACADAS, ITEM_DESTACADA, SIZES_DESTACADAS } from "@/components/ui/grillas";
import type { ProvinciaResumen } from "@/lib/catalog";

interface HomeContentProps {
  provinciasDestacadas: ProvinciaResumen[];
  totalActividades: number;
  totalEscapadas: number;
}

const provinciasPorRegion = (region: string) => Object.values(REGION_POR_PROVINCIA).filter(r => r === region).length;

function Portada() {
  return (
    <section aria-labelledby="titulo-portada" className="relative isolate overflow-hidden bg-tinta-900 text-white">
      <div className="absolute inset-0 -z-10">
        <HeroCarousel />
        {/* Velo para que el texto blanco supere 4,5:1 sobre cualquier foto del carrusel. */}
        <div className="absolute inset-0 z-[3] bg-gradient-to-t from-tinta-900/90 via-tinta-900/45 to-tinta-900/15" />
        <div className="absolute inset-0 z-[3] hidden bg-gradient-to-r from-tinta-900/60 to-transparent md:block" />
      </div>
      <div className="contenedor flex min-h-[min(80svh,46rem)] flex-col justify-end pt-24 pb-10 sm:pb-14 lg:pb-20">
        <p className="antetitulo text-sol-400">Universo Sur</p>
        <h1 id="titulo-portada" className="mt-3 max-w-3xl font-display text-display">
          Turismo en Argentina
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/90 sm:text-xl">
          Descubrí destinos, paisajes y experiencias únicas en todo el país. Explorá provincias, actividades turísticas y escapadas.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {/* Ancla: funciona sin JavaScript y respeta el movimiento reducido (globals.css). */}
          <a href="#provincias-destacadas" className={boton("claro")}>
            Explorar destinos
            <Icono nombre="flecha" className="size-4 rotate-90" />
          </a>
          <Link href={ROUTES.actividades} prefetch={false} className={boton("sobre-imagen")}>
            Qué hacer en Argentina
          </Link>
        </div>
      </div>
    </section>
  );
}

const planificar: { href: string; icono: NombreIcono; titulo: string; texto: (n: HomeContentProps) => string }[] = [
  { href: ROUTES.actividades, icono: "brujula", titulo: "Qué hacer", texto: n => `${n.totalActividades} actividades turísticas para elegir por provincia.` },
  { href: ROUTES.escapadas, icono: "documento", titulo: "Escapadas", texto: n => `${n.totalEscapadas} guías para viajes cortos, organizadas por región.` },
  { href: ROUTES.seguridad, icono: "escudo", titulo: "Viajá seguro", texto: () => "Ruta, playas, áreas naturales, altura y emergencias." },
];

// Server Component: el contenido turístico llega en el HTML inicial. Solo el carrusel y el
// historial de visitas se ejecutan en el navegador.
export default function HomeContent(props: HomeContentProps) {
  return (
    <>
      <Portada />

      <div className="contenedor py-14 sm:py-20">
        <section id="provincias-destacadas" aria-labelledby="titulo-destacadas">
          <EncabezadoSeccion id="titulo-destacadas" antetitulo="Empezá por acá" titulo="Provincias destacadas" bajada="Tres puertas de entrada para conocer el país: río y ciudad, sierras y costa atlántica." />
          <div className={GRILLA_DESTACADAS}>
            {props.provinciasDestacadas.map((provincia) => (
              <div key={provincia.slug} className={ITEM_DESTACADA}>
                <ProvinciaCard provincia={provincia} sizes={SIZES_DESTACADAS} destacada />
              </div>
            ))}
          </div>
        </section>
        <p className="mt-6">
          <Link href={ROUTES.provincias} className={boton("secundario")}>
            {INTERNAL_ANCHORS.verTodasLasProvincias}
            <Icono nombre="flecha" className="size-4" />
          </Link>
        </p>
      </div>

      <section aria-labelledby="titulo-regiones" className="border-y border-arena-300/70 bg-arena-100">
        <div className="contenedor py-14 sm:py-20">
          <EncabezadoSeccion id="titulo-regiones" antetitulo="Seis regiones" titulo="Explorá por región" bajada="Del altiplano a Tierra del Fuego: elegí un paisaje y encontrá sus provincias." />
          <ul className="grid list-none grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {REGIONES_VISUALES.map(region => (
              <li key={region.nombre}>
                <Link
                  href={`${ROUTES.provincias}#${region.ancla}`}
                  className={`group flex h-full min-h-36 flex-col justify-between rounded-tarjeta p-4 text-white shadow-tarjeta transition-transform duration-300 ease-suave hover:-translate-y-0.5 motion-reduce:transform-none ${region.fondo}`}
                >
                  <span className="text-xs font-medium text-white/85">{provinciasPorRegion(region.nombre)} {provinciasPorRegion(region.nombre) === 1 ? "provincia" : "provincias"}</span>
                  <span>
                    <span className="block font-display text-2xl leading-tight">{region.nombre}</span>
                    <span className="mt-1 block text-sm leading-snug text-white/90">{region.lema}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <EspacioPublicitario id="portada-entre-secciones" className="contenedor pt-10" />

      {/* SECCIÓN DINÁMICA: CONTINUAR EXPLORANDO */}
      <ContinuarExplorando />

      <section aria-labelledby="titulo-planificar" className="contenedor py-14 sm:py-20">
        <EncabezadoSeccion id="titulo-planificar" antetitulo="Antes de salir" titulo="Planificá tu viaje" />
        <ul className="grid list-none gap-4 md:grid-cols-3 md:gap-6">
          {planificar.map(item => (
            <li key={item.href}>
              <Link href={item.href} className="group flex h-full items-center gap-4 rounded-tarjeta border border-arena-300/80 bg-white p-4 shadow-tarjeta transition-[border-color,box-shadow] duration-300 hover:border-lago-600/50 hover:shadow-elevada sm:p-6">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-lago-100 text-lago-700">
                  <Icono nombre={item.icono} className="size-6" />
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="text-lg font-semibold text-tinta-900 group-hover:text-lago-700">{item.titulo}</span>
                  <span className="mt-1 text-tinta-700">{item.texto(props)}</span>
                </span>
                <Icono nombre="flecha" className="size-5 text-lago-600 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
