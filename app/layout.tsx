import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

const isPreview = process.env.VERCEL_ENV === "preview";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
