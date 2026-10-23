import { getProvincias, getActividades } from "@/lib/data";
import { resumirProvincia, resumirActividad } from "@/lib/catalog";

// JSON estático generado en el build con lo mínimo para dibujar tarjetas. Lo pide la portada
// solo cuando el visitante tiene historial en localStorage ("Continuar explorando"); así el
// HTML de la portada no crece con el catálogo.
export const dynamic = "force-static";

export async function GET() {
  const [provincias, actividades] = await Promise.all([getProvincias(), getActividades()]);
  return Response.json(
    { provincias: provincias.map(resumirProvincia), actividades: actividades.map(resumirActividad) },
    { headers: { "X-Robots-Tag": "noindex" } },
  );
}
