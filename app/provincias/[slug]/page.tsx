import Carrusel from "@/components/Carrusel";
import MapaUbicacion from "@/components/mapa/MapaUbicacion";
import Link from "next/link";
import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import SeguirExplorando from "@/components/ui/SeguirExplorando";
import Icono from "@/components/ui/Icono";
import { boton } from "@/components/ui/estilos";
import { regionDeProvincia } from "@/lib/regiones";
import { ROUTES, INTERNAL_ANCHORS } from "@/lib/site-links";
import { 
  getProvinciaBySlug, 
  getProvincias,
  getPlanesSantaFe,
  getPreguntasFrecuentesSantaFe,
  getNoticiasSantaFe,
  getOficinasInformesSantaFe,
  getAgenciasSantaFe,
  getAgendaSantaFe
} from "@/lib/data";
import { notFound } from "next/navigation";
import ProvinciaVisitTracker from "@/components/ProvinciaVisitTracker";
import NavegacionSantaFe from "@/components/santa-fe/NavegacionSantaFe";
import SantaFeSectionsGrid from "@/components/santa-fe/SantaFeSectionsGrid";
import PreguntasFrecuentesSection from "@/components/santa-fe/PreguntasFrecuentesSection";
import type { Metadata } from "next";
import { provinciaMetadata } from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const provincias = await getProvincias();
  return provincias.map((provincia) => ({
    slug: provincia.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const provincia = await getProvinciaBySlug(slug);

  if (!provincia) notFound();
  return provinciaMetadata(provincia);
}

export default async function ProvinciaPage({ params }: PageProps) {
  const { slug } = await params;
  const provincia = await getProvinciaBySlug(slug);

  if (!provincia) {
    notFound();
  }

  // Cargar datos especiales solo para Santa Fe
  const isSantaFe = slug === "santa_fe";
  const planes = isSantaFe ? await getPlanesSantaFe() : null;
  const preguntasFrecuentes = isSantaFe ? await getPreguntasFrecuentesSantaFe() : null;
  const noticias = isSantaFe ? await getNoticiasSantaFe() : null;
  const oficinas = isSantaFe ? await getOficinasInformesSantaFe() : null;
  const agencias = isSantaFe ? await getAgenciasSantaFe() : null;
  const agenda = isSantaFe ? await getAgendaSantaFe() : null;
  const eventos = agenda?.vigentes ?? null;
  const region = regionDeProvincia(provincia.slug);
  const descripciones = [provincia.des_1, provincia.des_2, provincia.des_3].filter(Boolean);

  return (
    <>
      <ProvinciaVisitTracker slug={slug} />
      <EncabezadoPagina
        migas={[{ href: ROUTES.home, etiqueta: "Inicio" }, { href: ROUTES.provincias, etiqueta: "Provincias" }]}
        antetitulo={region ? `Región ${region.nombre}` : undefined}
        colorAntetitulo={region?.texto}
        titulo={provincia.provincia}
        bajada={region?.lema}
      />

      <div className="contenedor py-10 sm:py-14">
        {/* Navegación rápida solo para Santa Fe */}
        {isSantaFe && <div className="mb-10"><NavegacionSantaFe actual="resumen" /></div>}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
          {/* Descripción */}
          <div className="prosa">
            {descripciones.map((texto, i) => <p key={i}>{texto}</p>)}
          </div>

          <aside aria-label={`Datos de viaje: ${provincia.provincia}`} className="self-start rounded-tarjeta border border-arena-300/80 bg-white p-5 shadow-tarjeta lg:sticky lg:top-[calc(var(--alto-encabezado)+1.5rem)]">
            <dl className="grid grid-cols-2 gap-4 text-sm lg:grid-cols-1">
              {region && (
                <div>
                  <dt className="text-tinta-500">Región</dt>
                  <dd className="mt-0.5 font-semibold"><a href={`${ROUTES.provincias}#${region.ancla}`} className={`inline-flex min-h-6 items-center underline decoration-current/30 underline-offset-4 ${region.texto}`}>{region.nombre}</a></dd>
                </div>
              )}
              {provincia.nombre_capital && (
                <div>
                  <dt className="text-tinta-500">Capital</dt>
                  <dd className="mt-0.5 font-semibold text-tinta-900">{provincia.nombre_capital}</dd>
                </div>
              )}
            </dl>
            {/* Sin prefetch: /actividades?provincia=… es un rewrite por query y Next 16.3+ predice su
                segmento a partir de /actividades, lo que da 404 (vercel/next.js#97244). El clic
                navega igual en el cliente, pidiendo el árbol completo al servidor. */}
            <Link
              href={ROUTES.actividadesPorProvincia(provincia.slug)}
              prefetch={false}
              className={boton("primario", "mt-5 w-full")}
            >
              {INTERNAL_ANCHORS.verActividadesEnProvincia(provincia.provincia)}
              <Icono nombre="flecha" className="size-4" />
            </Link>
          </aside>
        </div>

        {/* Carrusel */}
        {provincia.fotos.length > 0 && (
          <div className="mt-12">
            <Carrusel fotos={provincia.fotos} alt={provincia.provincia} />
          </div>
        )}

        {/* Sección Capital */}
        {provincia.nombre_capital && provincia.lat_capital && provincia.lon_capital && (
          <section aria-labelledby="titulo-capital" className="mt-14">
            <p className="antetitulo text-terracota-600">Dónde queda</p>
            <h2 id="titulo-capital" className="mt-1 mb-6 font-display text-seccion text-tinta-900">
              Su capital: {provincia.nombre_capital}
            </h2>
            <MapaUbicacion
              lat={provincia.lat_capital}
              lon={provincia.lon_capital}
              titulo={provincia.nombre_capital}
            />
          </section>
        )}

        {/* Sección: Preguntas Frecuentes (solo para Santa Fe, después del mapa) */}
        {isSantaFe && preguntasFrecuentes && preguntasFrecuentes.length > 0 && (
          <div className="mt-14"><PreguntasFrecuentesSection preguntas={preguntasFrecuentes} /></div>
        )}

        {/* Grid de secciones con previews solo para Santa Fe */}
        {isSantaFe && planes && eventos && oficinas && agencias && noticias && (
          <div className="mt-14">
            <SantaFeSectionsGrid
              planes={planes}
              eventos={eventos}
              oficinas={oficinas}
              agencias={agencias}
              noticias={noticias}
            />
          </div>
        )}

        <SeguirExplorando
          etiqueta="Navegación relacionada"
          enlaces={[
            { href: ROUTES.actividadesPorProvincia(provincia.slug), etiqueta: INTERNAL_ANCHORS.verActividadesEnProvincia(provincia.provincia), icono: "brujula", prefetch: false },
            { href: ROUTES.provincias, etiqueta: INTERNAL_ANCHORS.verTodasLasProvincias, icono: "mapa" },
            { href: ROUTES.escapadas, etiqueta: INTERNAL_ANCHORS.verEscapadas, icono: "documento" },
          ]}
        />
      </div>
    </>
  );
}
