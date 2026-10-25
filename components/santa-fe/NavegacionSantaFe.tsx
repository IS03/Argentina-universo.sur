import Link from "next/link";
import Icono from "@/components/ui/Icono";
import { chip } from "@/components/ui/estilos";
import FilaDesplazable from "@/components/ui/FilaDesplazable";
import { SECCIONES_SANTA_FE, type IdSeccionSantaFe } from "./secciones";

// Navegación entre la página de Santa Fe y sus subsecciones. Server Component: la sección actual
// llega por props y se marca con aria-current; en teléfonos es una fila desplazable.
export default function NavegacionSantaFe({ actual }: { actual: IdSeccionSantaFe }) {
  return (
    <nav aria-label="Secciones de Santa Fe">
      <FilaDesplazable activo={actual} className="-mx-4 px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {SECCIONES_SANTA_FE.map(seccion => {
          const esActual = seccion.id === actual;
          return (
            <li key={seccion.id}>
              <Link href={seccion.href} prefetch={false} aria-current={esActual ? "page" : undefined} className={chip(esActual)}>
                <Icono nombre={seccion.icono} className={`size-4 ${esActual ? "" : "text-region-litoral"}`} />
                {seccion.etiqueta}
              </Link>
            </li>
          );
        })}
      </FilaDesplazable>
    </nav>
  );
}
