import { ROUTES, INTERNAL_ANCHORS } from "@/lib/site-links";
import { staticPageMetadata } from "@/lib/seo";
import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import SeguirExplorando from "@/components/ui/SeguirExplorando";
import Icono, { type NombreIcono } from "@/components/ui/Icono";
import { chip } from "@/components/ui/estilos";

export const metadata = staticPageMetadata("/seguridad");

const secciones: { id: string; icono: NombreIcono; titulo: string; items: string[] }[] = [
  {
    id: "durante-el-viaje",
    icono: "brujula",
    titulo: "Durante el viaje",
    items: [
      "Cuidá tus pertenencias, especialmente en lugares concurridos.",
      "Identificá puntos de información turística, seguridad y centros de salud cercanos.",
      "Guardá los números de emergencia locales en tu celular.",
      "Evitá zonas poco iluminadas durante la noche.",
      "Consultá el pronóstico del clima antes y durante el viaje.",
      "Cumplí las normas de seguridad según la actividad que realices (chaleco salvavidas, casco, etc.).",
      "Respetá los circuitos habilitados para 4x4 y cuatriciclos.",
      "Usá antena con banderín rojo.",
      "En cuatriciclos no cabinados, utilizá calzado cerrado y pechera de protección.",
    ],
  },
  {
    id: "uso-responsable-fuego",
    icono: "fuego",
    titulo: "Uso responsable del fuego",
    items: [
      "No enciendas fuego en lugares no habilitados.",
      "Si está permitido, evitá hacerlo debajo de los árboles.",
      "Apagá completamente la fogata con abundante agua y asegurate de que quede fría.",
      "No descartes colillas de cigarrillo en espacios naturales.",
      "Si ves humo o fuego, avisá de inmediato a guardaparques o autoridades.",
      "No estaciones vehículos sobre pastizales secos.",
    ],
  },
  {
    id: "residuos-entorno",
    icono: "residuos",
    titulo: "Residuos y cuidado del entorno",
    items: [
      "Llevá siempre una bolsa para tus residuos (incluso los orgánicos).",
      "No dejes basura en espacios naturales.",
      "Si encontrás residuos ajenos, ayudá a retirarlos.",
      "Recordá que latas y vidrios pueden provocar incendios por efecto lupa.",
    ],
  },
  {
    id: "en-la-ruta",
    icono: "auto",
    titulo: "En la ruta",
    items: [
      "Verificá el estado del vehículo antes de salir.",
      "Llevá toda la documentación obligatoria.",
      "Usá siempre el cinturón de seguridad.",
      "Respetá las velocidades máximas y controles viales.",
      "No uses el celular mientras manejás.",
      "Viajá descansado y evitá conducir en horas de calor extremo.",
      "Mantené las luces bajas encendidas, de día y de noche.",
      "Ante presencia de fauna, reducí la velocidad.",
      "En caso de emergencia, colocá balizas a distancia prudente.",
    ],
  },
  {
    id: "playas-balnearios",
    icono: "ola",
    titulo: "En playas y balnearios",
    items: [
      "Seguí siempre las indicaciones del guardavidas.",
      "Ingresá al agua solo en zonas habilitadas.",
      "Respetá las banderas de seguridad.",
      "Prestá especial atención a menores y personas mayores.",
      "Evitá el ingreso al agua de noche o desde muelles.",
      "No descuides tus pertenencias personales.",
    ],
  },
  {
    id: "areas-naturales",
    icono: "hoja",
    titulo: "En áreas naturales",
    items: [
      "Caminá solo por senderos habilitados y señalizados.",
      "Informate sobre la dificultad y duración de los recorridos.",
      "Avisá a guardaparques si realizás senderos por tu cuenta.",
      "Respetá la flora, la fauna y la cartelería.",
      "No alimentes animales silvestres.",
      "Transitá, acampá y nadá solo en sitios permitidos.",
      "No ingreses con mascotas a Parques Nacionales.",
    ],
  },
  {
    id: "destinos-altura",
    icono: "montana",
    titulo: "En destinos de altura (+2500 msnm)",
    items: [
      "Consultá a tu médico antes de viajar.",
      "Evitá ascensos rápidos.",
      "Hidratate correctamente (2 a 3 litros por día).",
      "Durante los primeros días, realizá poca actividad física.",
      "Consumí hidratos de carbono en pequeñas cantidades.",
      "Evitá alcohol, tabaco y medicamentos que provoquen sueño.",
      "Ante síntomas como mareos o dolor intenso, descendé y consultá a un médico.",
    ],
  },
  {
    id: "salud-prevencion",
    icono: "salud",
    titulo: "Salud y prevención",
    items: [
      "Hidratate con frecuencia, aunque no tengas sed.",
      "Evitá el sol entre las 11 y las 17 h.",
      "Usá ropa liviana y clara, gorra, protector solar y repelente.",
      "Llevá un botiquín básico de primeros auxilios.",
    ],
  },
];

const EMERGENCIAS = [
  { numero: "911", etiqueta: "Emergencias", aria: "Llamar a emergencias 911" },
  { numero: "134", etiqueta: "Denuncias", aria: "Llamar a denuncias 134" },
];

export default function SeguridadPage() {
  return (
    <>
      <EncabezadoPagina
        migas={[{ href: ROUTES.home, etiqueta: "Inicio" }]}
        antetitulo="Guía de seguridad"
        titulo="Verano Seguro en Argentina"
        bajada="Disfrutar el verano también es viajar con responsabilidad."
      />

      <div className="contenedor py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
          <div className="prosa">
            <p>
              Estas recomendaciones te ayudan a prevenir riesgos, anticiparte a
              imprevistos y saber cómo actuar ante distintas situaciones durante tu
              viaje.
            </p>
            <p>
              Viajar seguro no depende solo del destino, sino también de cada viajero.
              Por eso, esta guía está pensada para acompañarte en la ruta, durante tu
              estadía y en cada actividad que realices, promoviendo experiencias
              tranquilas, cuidadas y responsables.
            </p>
          </div>

          {/* Emergencias primero: es lo que se busca con apuro, sobre todo desde el teléfono. */}
          <section id="emergencias" aria-labelledby="titulo-emergencias" className="-order-1 self-start rounded-tarjeta lg:order-none border border-region-norte/40 bg-white p-5 shadow-tarjeta">
            <h2 id="titulo-emergencias" className="flex items-center gap-2 text-lg font-semibold text-tinta-900">
              <Icono nombre="sirena" className="size-6 text-region-norte" />
              Emergencias
            </h2>
            <p className="mt-1 text-sm text-tinta-700">Guardá estos números en tu celular antes de viajar</p>
            <ul className="mt-4 grid list-none grid-cols-2 gap-3">
              {EMERGENCIAS.map(e => (
                <li key={e.numero}>
                  <a
                    href={`tel:${e.numero}`}
                    aria-label={e.aria}
                    className="flex min-h-20 flex-col items-center justify-center rounded-control bg-region-norte px-3 py-3 text-white transition-colors hover:bg-tinta-900"
                  >
                    <span className="flex items-center gap-1.5 text-2xl font-semibold tracking-wide">
                      <Icono nombre="telefono" className="size-5" />
                      {e.numero}
                    </span>
                    <span className="text-xs font-medium text-white/90">{e.etiqueta}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <nav aria-label="Temas de la guía" className="mt-10">
          <p className="antetitulo mb-3 text-tinta-500">Temas de la guía</p>
          <ul className="fila-desplazable -mx-4 list-none px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {secciones.map(seccion => (
              <li key={seccion.id}>
                <a href={`#${seccion.id}`} className={chip(false)}>
                  <Icono nombre={seccion.icono} className="size-4 text-terracota-600" />
                  {seccion.titulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-6">
          {secciones.map(seccion => (
            <section key={seccion.id} id={seccion.id} aria-labelledby={`${seccion.id}-titulo`} className="rounded-tarjeta border border-arena-300/80 bg-white p-5 shadow-tarjeta sm:p-6">
              <h2 id={`${seccion.id}-titulo`} className="flex items-center gap-3 font-display text-[1.75rem] leading-tight text-tinta-900">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-lago-100 text-lago-700">
                  <Icono nombre={seccion.icono} className="size-6" />
                </span>
                {seccion.titulo}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {seccion.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2.5 leading-relaxed text-tinta-700">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="mt-1 size-4 shrink-0 text-region-litoral" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 4.5 4.5L19 7" />
                    </svg>
                    <span className="flex-1">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-10 rounded-tarjeta bg-tinta-900 px-6 py-5 text-center font-display text-2xl text-white">
          Viajá seguro, viajá responsable
        </p>

        {/* Enlazado interno (SEO) */}
        <SeguirExplorando
          enlaces={[
            { href: ROUTES.provincias, etiqueta: INTERNAL_ANCHORS.verTodasLasProvincias, icono: "mapa" },
            { href: ROUTES.actividades, etiqueta: INTERNAL_ANCHORS.verActividades, icono: "brujula" },
            { href: ROUTES.escapadas, etiqueta: INTERNAL_ANCHORS.verEscapadas, icono: "documento" },
          ]}
        />
      </div>
    </>
  );
}
