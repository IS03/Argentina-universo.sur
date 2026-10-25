import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import { idMedicionGA } from "@/lib/analytics";
import MedicionConConsentimiento from "@/components/consentimiento/MedicionConConsentimiento";
import { SCRIPT_DECISION_INICIAL } from "@/lib/consentimiento";

import { isPagesPreview } from "@/lib/pages/environment";
import PagesConsent from "@/components/pages/PagesConsent";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
const isPreview = isPagesPreview(process.env);
const isPages = process.env.AUS_STATIC_EXPORT === "1";
// GA4 solo en producción y con NEXT_PUBLIC_GA_ID; en local, CI y Preview queda en null y no hay banner.
const gaId = idMedicionGA(process.env);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// Serif de títulos: un único archivo (400, latin), con métricas de respaldo ajustadas por next/font.
const displaySerif = Instrument_Serif({
  variable: "--font-display-serif",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Turismo en Argentina | Universo Sur", template: "%s | Universo Sur" },
  authors: [{ name: SITE_NAME }], creator: SITE_NAME, publisher: SITE_NAME,
  formatDetection: { email: false, address: false, telephone: false },
  // Canonical y OG de cada URL viven en su page, evitando heredarlos en páginas 404.
  robots: {
    index: !isPreview, follow: !isPreview,
    googleBot: {
      index: !isPreview, follow: !isPreview,
      "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: el script del <head> puede marcar <html data-consentimiento> antes de hidratar.
    <html lang="es" suppressHydrationWarning={gaId ? true : undefined}>
      {gaId && (
        <head>
          {/* Oculta el banner a quien ya decidió, antes del primer pintado. */}
          <script id="decision-cookies" dangerouslySetInnerHTML={{ __html: SCRIPT_DECISION_INICIAL }} />
          {/* Sin JavaScript GA4 no puede cargarse: no tiene sentido pedir permiso. */}
          <noscript>
            <style>{"#aviso-cookies{display:none}"}</style>
          </noscript>
        </head>
      )}
      <body className={`${geistSans.variable} ${displaySerif.variable} flex min-h-dvh flex-col antialiased`}>
        <a
          href="#contenido"
          className="sr-only z-[60] rounded-full bg-tinta-900 px-5 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
        >
          Saltar al contenido
        </a>
        <Navbar />
        <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <Footer />
        {!isPages && <Analytics />}
        {!isPages && <SpeedInsights />}
        {/* GA4 se carga solo después de que la persona acepta en el banner. */}
        {!isPages && gaId && <MedicionConConsentimiento gaId={gaId} />}
        {isPages && gaId && <PagesConsent gaId={gaId} />}
      </body>
    </html>
  );
}
