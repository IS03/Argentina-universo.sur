import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Actividades Turísticas Argentina | Qué hacer",
  description: "Descubrí las mejores actividades turísticas en cada provincia de Argentina. Qué hacer, dónde ir y experiencias únicas. Filtra por provincia y encuentra tu próxima aventura.",
  keywords: ["actividades turísticas argentina", "qué hacer en argentina", "turismo argentina", "experiencias turísticas", "actividades por provincia"],
  openGraph: {
    title: "Actividades Turísticas Argentina | Qué hacer",
    description: "Descubrí las mejores actividades turísticas en cada provincia de Argentina. Qué hacer, dónde ir y experiencias únicas.",
    url: "/actividades",
    siteName: "Argentina Universo Sur",
    images: [
      {
        url: "/img/home/1.jpg",
        width: 1200,
        height: 630,
        alt: "Actividades turísticas en Argentina",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Actividades Turísticas Argentina | Qué hacer",
    description: "Descubrí las mejores actividades turísticas en cada provincia de Argentina",
    images: ["/img/home/1.jpg"],
  },
  alternates: {
    canonical: "/actividades",
  },
};

export default function ActividadesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
