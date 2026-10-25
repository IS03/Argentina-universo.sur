import Carrusel from "@/components/Carrusel";
import Link from "next/link";
import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import SeguirExplorando from "@/components/ui/SeguirExplorando";
import Icono from "@/components/ui/Icono";
import { boton } from "@/components/ui/estilos";
import { regionDeProvincia } from "@/lib/regiones";
import { ROUTES, INTERNAL_ANCHORS } from "@/lib/site-links";
import { getActividadBySlug, getActividades } from "@/lib/data";
import { notFound } from "next/navigation";
import ActividadVisitTracker from "@/components/ActividadVisitTracker";
import MapaUbicacion from "@/components/mapa/MapaUbicacion";
import type { Metadata } from "next";
import { actividadMetadata } from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const actividades = await getActividades();
  return actividades.map((actividad) => ({
    slug: actividad.actividadSlug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const actividad = await getActividadBySlug(slug);

  if (!actividad) notFound();
  return actividadMetadata(actividad);
}

export default async function ActividadPage({ params }: PageProps) {
  const { slug } = await params;
  const actividad = await getActividadBySlug(slug);

  if (!actividad) {
    notFound();
  }
  const region = regionDeProvincia(actividad.slug);

  return (
    <>
      <ActividadVisitTracker slug={slug} />
      <EncabezadoPagina
        migas={[{ href: ROUTES.home, etiqueta: "Inicio" }, { href: ROUTES.actividades, etiqueta: "Qué hacer" }]}
        antetitulo={actividad.provincia}
        colorAntetitulo={region?.texto}
        titulo={actividad.actividad}
        bajada={
          <span className="flex items-start gap-2">
            <Icono nombre="pin" className="mt-1 size-5 text-terracota-600" />
            {actividad.localizacion}
          </span>
        }
      />

      <div className="contenedor py-10 sm:py-14">
        {/* Mapa: arriba del pliegue en móvil se muestra sin teselas hasta activarlo. */}
        {actividad.lat && actividad.lon && (
          <MapaUbicacion
            lat={actividad.lat}
            lon={actividad.lon}
            titulo={actividad.actividad}
            detalle={actividad.localizacion}
            className="mb-10"
            teselasEnMovil={false}
          />
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
          <div className="prosa">
            {actividad.des_1 && <p>{actividad.des_1}</p>}
            {actividad.des_2 && <p>{actividad.des_2}</p>}
          </div>
          <aside aria-label={`Más en ${actividad.provincia}`} className="self-start rounded-tarjeta border border-arena-300/80 bg-white p-5 shadow-tarjeta">
            <p className="text-sm text-tinta-500">Provincia</p>
            <p className="mt-0.5 font-display text-2xl text-tinta-900">{actividad.provincia}</p>
            {region && <p className={`mt-1 text-sm font-medium ${region.texto}`}>Región {region.nombre}</p>}
            <Link href={ROUTES.actividadesPorProvincia(actividad.slug)} prefetch={false} className={boton("primario", "mt-5 w-full")}>
              {INTERNAL_ANCHORS.verActividadesEnProvincia(actividad.provincia)}
            </Link>
            <Link href={ROUTES.provincia(actividad.slug)} className={boton("secundario", "mt-3 w-full")}>
              {INTERNAL_ANCHORS.turismoEnProvincia(actividad.provincia)}
            </Link>
          </aside>
        </div>

        {/* Imágenes */}
        {actividad.fotos.length > 0 && (
          <div className="mt-12">
            <Carrusel fotos={actividad.fotos} alt={actividad.actividad} />
          </div>
        )}

        {/* Enlazado interno (SEO): provincia, actividades, inicio */}
        <SeguirExplorando
          etiqueta="Navegación relacionada"
          enlaces={[
            { href: ROUTES.provincia(actividad.slug), etiqueta: INTERNAL_ANCHORS.turismoEnProvincia(actividad.provincia), icono: "mapa" },
            { href: ROUTES.actividades, etiqueta: INTERNAL_ANCHORS.verActividades, icono: "brujula" },
            { href: ROUTES.escapadas, etiqueta: INTERNAL_ANCHORS.verEscapadas, icono: "documento" },
          ]}
        />
      </div>
    </>
  );
}
