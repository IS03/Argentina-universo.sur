// Recetas de clases del sistema visual. Funcionan igual en <Link>, <a> y <button>.
// Todas las variantes tienen al menos 44 px de alto: el área táctil mínima en teléfonos.

type VarianteBoton = "primario" | "claro" | "secundario" | "sutil" | "sobre-imagen";

const BASE_BOTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[0.9375rem] font-semibold leading-tight " +
  "transition-[background-color,border-color,color,box-shadow] duration-200 ease-suave";

const VARIANTES_BOTON: Record<VarianteBoton, string> = {
  primario: "bg-lago-600 text-white shadow-sm hover:bg-lago-700",
  // Acción principal sobre fotos o fondos oscuros.
  claro: "bg-white text-tinta-900 shadow-sm hover:bg-arena-100",
  secundario: "border border-arena-400 bg-white/70 text-tinta-900 hover:border-lago-600 hover:text-lago-700",
  sutil: "text-lago-600 underline decoration-lago-600/40 underline-offset-4 hover:decoration-lago-600 px-1",
  "sobre-imagen": "border border-white/70 bg-tinta-900/35 text-white backdrop-blur-sm hover:bg-tinta-900/55",
};

export function boton(variante: VarianteBoton = "primario", extra = ""): string {
  return `${BASE_BOTON} ${VARIANTES_BOTON[variante]} ${extra}`.trim();
}

// Chip de filtro o de navegación. activo se expresa además con aria-pressed o aria-current.
export function chip(activo: boolean, extra = ""): string {
  const estado = activo
    ? "border-tinta-900 bg-tinta-900 text-white"
    : "border-arena-400 bg-white text-tinta-900 hover:border-lago-600 hover:text-lago-700";
  return `inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors duration-200 ${estado} ${extra}`.trim();
}

// Enlace de texto dentro de párrafos: subrayado siempre visible (no se depende solo del color).
export const ENLACE_TEXTO = "font-medium text-lago-600 underline decoration-lago-600/40 underline-offset-[3px] hover:decoration-lago-600";

export const TARJETA = "rounded-tarjeta border border-arena-300/80 bg-white shadow-tarjeta";
