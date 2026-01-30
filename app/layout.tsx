import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Turismo en Argentina | Universo Sur",
    template: "%s | Universo Sur",
  },
  description: "Descubrí los destinos más emblemáticos de Argentina. Guía completa de provincias, actividades turísticas, escapadas y experiencias únicas en todo el país.",
  keywords: ["turismo argentina", "destinos argentina", "viajes argentina", "provincias argentinas", "actividades turísticas", "escapadas argentina"],
  authors: [{ name: "Argentina Universo Sur" }],
  creator: "Argentina Universo Sur",
  publisher: "Argentina Universo Sur",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://argentina-universo-sur.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/",
    siteName: "Argentina Universo Sur",
    title: "Turismo en Argentina | Universo Sur",
    description: "Descubrí los destinos más emblemáticos de Argentina. Guía completa de provincias, actividades turísticas y experiencias únicas.",
    images: [
      {
        url: "/img/home/1.jpg",
        width: 1200,
        height: 630,
        alt: "Paisajes de Argentina",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Turismo en Argentina | Universo Sur",
    description: "Descubrí los destinos más emblemáticos de Argentina",
    images: ["/img/home/1.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          text-white
          antialiased
        `}
      >
        {children}
      </body>
    </html>
  );
}
