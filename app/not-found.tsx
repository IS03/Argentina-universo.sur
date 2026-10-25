import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/lib/site-links";

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
      <div className="min-h-screen pt-10 sm:pt-14 pb-16 px-4 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl md:text-6xl font-semibold uppercase tracking-wide text-tinta-900 mb-4">
          404
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md">
          La página que buscás no existe o fue movida.
        </p>
        <Link
          href={ROUTES.home}
          className="px-6 py-3 bg-tinta-900 text-white rounded-lg hover:opacity-90 transition"
        >
          Volver al inicio
        </Link>
      </div>
    </>
  );
}
