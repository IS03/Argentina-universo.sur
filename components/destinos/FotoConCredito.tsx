import type { Foto } from "@/lib/destinos/modelo";
import Icono from "@/components/ui/Icono";

interface FotoConCreditoProps {
  foto: Foto;
  // Ancho real del espacio donde se muestra (ver components/ui/grillas.ts para el criterio).
  sizes: string;
  prioridad?: boolean;
  className?: string;
}

// Foto con licencia verificada y crédito visible. Las variantes ya existen como archivos locales:
// no hay optimizador en tiempo de ejecución ni inserciones de terceros.
export default function FotoConCredito({ foto, sizes, prioridad = false, className = "" }: FotoConCreditoProps) {
  return (
    <figure className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={foto.src}
        srcSet={foto.variantes.map(v => `${v.src} ${v.ancho}w`).join(", ")}
        sizes={sizes}
        width={foto.ancho}
        height={foto.alto}
        alt={foto.alt}
        loading={prioridad ? "eager" : "lazy"}
        fetchPriority={prioridad ? "high" : undefined}
        decoding="async"
        className="h-auto w-full rounded-tarjeta bg-arena-200 object-cover"
      />
      <figcaption className="mt-2 flex items-start gap-1.5 text-sm text-tinta-500">
        <Icono nombre="camara" className="mt-0.5 size-4" />
        <span>
          {foto.leyenda && <>{foto.leyenda} · </>}
          {foto.credito.titular} ·{" "}
          <a className="underline underline-offset-2 hover:text-lago-700" href={foto.credito.urlLicencia} rel="noreferrer">
            {foto.credito.licencia}
          </a>
        </span>
      </figcaption>
    </figure>
  );
}
