import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/lib/site-links";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Página no encontrada",
  description: "La página que buscás no existe en Argentina Universo Sur.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-16 px-4 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl md:text-6xl font-semibold uppercase tracking-wide text-[#5A4E3D] mb-4">
          404
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md">
          La página que buscás no existe o fue movida.
        </p>
        <Link
          href={ROUTES.home}
          className="px-6 py-3 bg-[#5A4E3D] text-white rounded-lg hover:opacity-90 transition"
        >
          Volver al inicio
        </Link>
      </main>
      <Footer />
    </>
  );
}
