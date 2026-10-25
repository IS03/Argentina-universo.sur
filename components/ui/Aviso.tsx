import Icono, { type NombreIcono } from "@/components/ui/Icono";

type TonoAviso = "info" | "aviso";

const TONOS: Record<TonoAviso, { caja: string; icono: NombreIcono; color: string }> = {
  info: { caja: "border-lago-600/30 bg-info-50", icono: "info", color: "text-lago-600" },
  aviso: { caja: "border-aviso-700/30 bg-aviso-50", icono: "alerta", color: "text-aviso-700" },
};

// Mensaje destacado dentro del contenido (información práctica, estado operativo, advertencias).
export default function Aviso({ tono = "info", titulo, etiqueta, children }: { tono?: TonoAviso; titulo?: string; etiqueta?: string; children: React.ReactNode }) {
  const estilo = TONOS[tono];
  return (
    <aside aria-label={etiqueta ?? titulo} className={`flex gap-3 rounded-control border p-4 text-tinta-900 ${estilo.caja}`}>
      <Icono nombre={estilo.icono} className={`mt-0.5 size-5 ${estilo.color}`} />
      <div className="min-w-0 flex-1">
        {titulo && <p className="font-semibold">{titulo}</p>}
        <div className={titulo ? "mt-1" : ""}>{children}</div>
      </div>
    </aside>
  );
}
