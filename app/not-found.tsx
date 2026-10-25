import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES, NAV_ANCHORS } from "@/lib/site-links";
import { boton } from "@/components/ui/estilos";

export const metadata: Metadata = {
  title: "Página no encontrada",
  description: "La página que buscás no existe en Argentina Universo Sur.",
  robots: {
    index: false,
    follow: true,
  },
};

const secciones = [
  { href: ROUTES.provincias, titulo: "Viaja por Argentina", texto: "Las 24 provincias, por región.", ancla: NAV_ANCHORS.provincias },
  { href: ROUTES.actividades, titulo: "Qué hacer", texto: "Actividades turísticas en todo el país.", ancla: NAV_ANCHORS.actividades },
  { href: ROUTES.escapadas, titulo: "Escapadas", texto: "Guías para viajes cortos.", ancla: NAV_ANCHORS.escapadas },
  { href: ROUTES.seguridad, titulo: "Guía de seguridad", texto: "Consejos antes y durante el viaje.", ancla: NAV_ANCHORS.seguridad },
];

const TARJETA = "block h-full rounded-tarjeta border border-arena-300/80 bg-white p-4 shadow-tarjeta hover:border-lago-600/50";

// El contenido de esta página viaja serializado en el RSC de todas las demás (límite de not-found
// del layout): se mantiene breve y sin íconos SVG. Sin enlaces a contenidos editoriales puntuales
// (también responde a rutas de borradores retirados) y sin prefetch.
export default function NotFound() {
  return (
    <div className="contenedor py-12 sm:py-16">
      <p className="antetitulo text-terracota-600">Error 404</p>
      <h1 className="mt-2 font-display text-titulo text-tinta-900">No encontramos esta página</h1>
      {/* 16 px en teléfonos: la frase entra en una línea con Geist y con su respaldo, así el cambio
          de fuente no reacomoda la página (CLS medido en PR16). */}
      <p className="mt-3 text-base text-tinta-700 sm:text-lg">La página que buscás no existe o fue movida.</p>
      <p className="mt-6">
        <Link href={ROUTES.home} className={boton("primario")}>
          Volver al inicio
        </Link>
      </p>
      <h2 className="mt-12 font-display text-seccion text-tinta-900">Seguí por acá</h2>
      <ul className="mt-5 grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {secciones.map(seccion => (
          <li key={seccion.href}>
            <Link href={seccion.href} prefetch={false} aria-label={seccion.ancla} className={TARJETA}>
              <span className="block font-semibold text-lago-600">{seccion.titulo}</span>
              <span className="block text-sm text-tinta-700">{seccion.texto}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
