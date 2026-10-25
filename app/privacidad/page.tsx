import Link from "next/link";
import type { Metadata } from "next";
import { ROUTES } from "@/lib/site-links";
import { pageMetadata } from "@/lib/seo";
import { ULTIMA_ACTUALIZACION, RESPONSABLE, CONTACTO_PRIVACIDAD, RETENCION_GA, COOKIES, ALMACENAMIENTO_LOCAL } from "@/lib/privacidad";
import { idMedicionGA } from "@/lib/analytics";
import PreferenciasCookies from "@/components/consentimiento/PreferenciasCookies";
import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import Icono from "@/components/ui/Icono";

// Igual que el layout: el panel de preferencias solo existe donde GA4 está configurado.
const isPages = process.env.AUS_STATIC_EXPORT === "1";
const medicionActiva = idMedicionGA(process.env) !== null;

// Página legal: accesible desde el pie, sin indexar y fuera del sitemap (no compite con el contenido turístico).
export const metadata: Metadata = {
  ...pageMetadata(
    "/privacidad",
    "Privacidad y cookies",
    "Cómo Argentina Universo Sur mide el uso del sitio, qué cookies y almacenamiento local utiliza y cómo ejercer tus derechos sobre los datos personales.",
  ),
  robots: { index: false, follow: true },
};

const enlace = "font-medium text-lago-600 underline decoration-lago-600/40 underline-offset-[3px] hover:decoration-lago-600";
const titulo = "font-display text-[1.875rem] leading-tight text-tinta-900 mb-4";
const parrafo = "text-[1.0625rem] text-tinta-700 leading-relaxed mb-4";
const lista = "list-disc marker:text-terracota-600 pl-6 space-y-2 text-[1.0625rem] text-tinta-700 leading-relaxed mb-4";
const celda = "border-b border-arena-300 px-3 py-3 align-top text-left";
const seccion = "mb-12";

// Índice del aviso: mismos ids que los títulos de cada sección.
const indice = [
  ["responsable", "Responsable"],
  ["medicion", "Medición del uso del sitio"],
  ["preferencias", "Tu decisión sobre las cookies"],
  ["cookies", "Cookies y almacenamiento local"],
  ["terceros", "Otros servicios de terceros"],
  ["control", "Cómo evitar la medición"],
  ["derechos", "Tus derechos"],
  ["cambios", "Cambios en este aviso"],
];

export default function PrivacidadPage() {
  return (
    <>
      <EncabezadoPagina
        migas={[{ href: ROUTES.home, etiqueta: "Inicio" }]}
        antetitulo="Aviso legal"
        titulo="Privacidad y cookies"
        bajada={<>Última actualización: {ULTIMA_ACTUALIZACION}</>}
      />
      <div className="contenedor grid gap-10 py-10 sm:py-14 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
        <nav aria-label="Secciones del aviso" className="lg:sticky lg:top-[calc(var(--alto-encabezado)+1.5rem)] lg:self-start">
          <p className="antetitulo mb-3 text-tinta-500">En este aviso</p>
          <ol className="grid list-none gap-1 sm:grid-cols-2 lg:grid-cols-1 lg:border-l lg:border-arena-300">
            {indice.map(([id, texto]) => (
              <li key={id}>
                <a href={`#${id}`} className="flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-medium text-tinta-700 hover:bg-arena-100 hover:text-lago-700 lg:-ml-px lg:rounded-none lg:border-l-2 lg:border-transparent lg:hover:border-lago-600 lg:hover:bg-transparent">
                  <Icono nombre="flecha" className="size-3.5 text-terracota-600 lg:hidden" />
                  {texto}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="max-w-3xl">
          <section className={seccion} aria-labelledby="responsable">
            <h2 id="responsable" className={titulo}>Responsable</h2>
            <p className={parrafo}>
              Argentina Universo Sur (www.argentinauniversosur.com), de {RESPONSABLE}, es responsable de los datos que
              se tratan en este sitio. Para consultas o para ejercer tus derechos escribí a{" "}
              <a href={`mailto:${CONTACTO_PRIVACIDAD}`} className={enlace}>{CONTACTO_PRIVACIDAD}</a>.
            </p>
            <p className={parrafo}>
              El sitio no tiene formularios, registro de usuarios ni publicidad: no te pedimos nombre, correo ni otros
              datos para usarlo, y no vendemos ni cedemos información a terceros.
            </p>
          </section>

          <section className={seccion} aria-labelledby="medicion">
            <h2 id="medicion" className={titulo}>Medición del uso del sitio</h2>
            <p className={parrafo}>
              Usamos herramientas de estadística para saber qué páginas se visitan y cómo funciona el sitio, y así
              mejorar sus contenidos. Ninguna de ellas recibe tu nombre, correo ni datos de contacto.
            </p>
            <ul className={lista}>
              <li>
                <strong>Google Analytics 4</strong> (Google LLC): registra páginas visitadas, origen de la visita,
                tipo de dispositivo y navegador, ubicación aproximada (país y ciudad), desplazamiento en la página,
                clics en enlaces externos y descargas de las guías en PDF.
                Google usa la dirección IP para estimar la ubicación y no la almacena. Desactivamos las señales de
                Google (datos demográficos y entre dispositivos), la personalización de anuncios y todo uso
                publicitario. Los datos se conservan {RETENCION_GA}.
              </li>
              <li>
                <strong>Solo con tu consentimiento:</strong> Google Analytics no se carga, no crea cookies ni envía
                datos hasta que aceptás en el aviso de cookies. Si rechazás, no se carga en ninguna página.
              </li>
              {isPages ? (
                <li>Esta versión no utiliza Vercel Web Analytics ni Speed Insights. No se ha activado Cloudflare Web Analytics.</li>
              ) : (
              <li>
                <strong>Vercel Web Analytics y Speed Insights</strong> (Vercel Inc., proveedor de alojamiento):
                cuentan visitas y miden la velocidad de carga de forma agregada, sin cookies ni identificadores
                persistentes.
              </li>
              )}
            </ul>
          </section>

          <section className={seccion} aria-labelledby="preferencias">
            <h2 id="preferencias" className={titulo}>Tu decisión sobre las cookies</h2>
            {medicionActiva ? (
              <>
                <p className={parrafo}>
                  Podés aceptar o rechazar las cookies de Google Analytics, y cambiar tu decisión en cualquier momento.
                  Si las rechazás después de haberlas aceptado, dejamos de medir y borramos esas cookies de tu navegador.
                </p>
                <PreferenciasCookies />
                <p className={parrafo}>
                  Guardamos tu decisión en tu navegador durante 12 meses; después te volvemos a preguntar.
                </p>
              </>
            ) : (
              <p className={parrafo}>
                Google Analytics no está activo en este momento. Si lo activamos, te vamos a pedir permiso antes de
                cargarlo.
              </p>
            )}
          </section>

          <section className={seccion} aria-labelledby="cookies">
            <h2 id="cookies" className={titulo}>Cookies y almacenamiento local</h2>
            <p className={parrafo}>Cookies de Google Analytics, que se crean solo si aceptás:</p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse overflow-hidden rounded-control border border-arena-300 bg-white text-sm text-tinta-700">
                <thead className="bg-arena-100 text-tinta-900">
                  <tr>
                    <th scope="col" className={celda}>Nombre</th>
                    <th scope="col" className={celda}>Proveedor</th>
                    <th scope="col" className={celda}>Finalidad</th>
                    <th scope="col" className={celda}>Duración</th>
                  </tr>
                </thead>
                <tbody>
                  {COOKIES.map(cookie => (
                    <tr key={cookie.nombre}>
                      <td className={celda}><code>{cookie.nombre}</code></td>
                      <td className={celda}>{cookie.proveedor}</td>
                      <td className={celda}>{cookie.finalidad}</td>
                      <td className={celda}>{cookie.duracion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={parrafo}>
              El sitio también usa el almacenamiento local de tu navegador para recordar tu decisión sobre las cookies
              y las últimas páginas que visitaste. Esa información queda en tu dispositivo, no se envía a ningún
              servidor y podés borrarla en cualquier momento desde la configuración del navegador:
            </p>
            <ul className={lista}>
              {ALMACENAMIENTO_LOCAL.map(item => (
                <li key={item.nombre}><code>{item.nombre}</code>: {item.finalidad}</li>
              ))}
            </ul>
          </section>

          <section className={seccion} aria-labelledby="terceros">
            <h2 id="terceros" className={titulo}>Otros servicios de terceros</h2>
            <ul className={lista}>
              <li>
                <strong>Alojamiento:</strong> el sitio se sirve desde {isPages ? "Cloudflare Pages" : "Vercel"}, que {isPages ? "procesa" : "registra"} datos técnicos de cada
                solicitud (dirección IP, navegador, página pedida) para operar y proteger el servicio.
              </li>
              {isPages && <li>Los enlaces a guías PDF que permanecen en el sitio anterior abren esa versión publicada; sus servicios de alojamiento se describen en la política de ese sitio.</li>}
              <li>
                <strong>Mapas:</strong> los mapas de ubicación muestran imágenes de OpenStreetMap. Al verlos o
                activarlos, tu navegador las descarga de los servidores de la OpenStreetMap Foundation, que recibe tu
                dirección IP como en cualquier solicitud web.
              </li>
              <li>
                <strong>Enlaces externos:</strong> los enlaces a sitios oficiales y redes sociales se rigen por las
                políticas de esos sitios.
              </li>
            </ul>
            <p className={parrafo}>
              Estos proveedores pueden procesar los datos fuera de Argentina, incluso en Estados Unidos. Más
              información:{" "}
              <a href="https://policies.google.com/privacy?hl=es" className={enlace} target="_blank" rel="noopener noreferrer">Google</a>,{" "}
              <a href={isPages ? "https://www.cloudflare.com/privacypolicy/" : "https://vercel.com/legal/privacy-policy"} className={enlace} target="_blank" rel="noopener noreferrer">{isPages ? "Cloudflare" : "Vercel"}</a> y{" "}
              <a href="https://osmfoundation.org/wiki/Privacy_Policy" className={enlace} target="_blank" rel="noopener noreferrer">OpenStreetMap Foundation</a>.
            </p>
          </section>

          <section className={seccion} aria-labelledby="control">
            <h2 id="control" className={titulo}>Cómo evitar la medición</h2>
            <ul className={lista}>
              <li>Rechazar en el aviso de cookies o cambiar tu decisión en esta página.</li>
              <li>Bloquear o borrar las cookies desde la configuración de tu navegador.</li>
              <li>
                Instalar el{" "}
                <a href="https://tools.google.com/dlpage/gaoptout?hl=es" className={enlace} target="_blank" rel="noopener noreferrer">
                  complemento de inhabilitación de Google Analytics
                </a>
                .
              </li>
              <li>Usar la navegación privada o un bloqueador de rastreo.</li>
            </ul>
            <p className={parrafo}>El sitio funciona igual si rechazás las cookies o bloqueás la medición.</p>
          </section>

          <section className={seccion} aria-labelledby="derechos">
            <h2 id="derechos" className={titulo}>Tus derechos</h2>
            <p className={parrafo}>
              Podés solicitar el acceso, la rectificación, la actualización o la supresión de tus datos personales
              escribiendo a <a href={`mailto:${CONTACTO_PRIVACIDAD}`} className={enlace}>{CONTACTO_PRIVACIDAD}</a>, conforme
              a la Ley N° 25.326 de Protección de los Datos Personales.
            </p>
            <p className={parrafo}>
              El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma
              gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto
              conforme lo establecido en el artículo 14, inciso 3 de la Ley N° 25.326.
            </p>
            <p className={parrafo}>
              La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326,
              tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus
              derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.
            </p>
          </section>

          <section className={seccion} aria-labelledby="cambios">
            <h2 id="cambios" className={titulo}>Cambios en este aviso</h2>
            <p className={parrafo}>
              Si cambiamos las herramientas o el uso de los datos, actualizaremos este aviso y su fecha.
            </p>
          </section>

          <nav className="pt-8 border-t border-arena-300/80 text-sm" aria-label="Volver">
            <Link href={ROUTES.home} className={enlace}>Volver al inicio</Link>
          </nav>
        </article>
      </div>
    </>
  );
}
