"use client";

import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { GoogleAnalytics } from "@next/third-parties/google";
import { leerConsentimiento, guardarConsentimiento, suscribirConsentimiento } from "@/lib/consentimiento";
import { COMANDOS_CONSENTIMIENTO, COMANDO_REVOCAR, cookiesGA } from "@/lib/analytics";
import { ROUTES } from "@/lib/site-links";
import { gtag, borrarCookies } from "./gtag";
import { BOTON_DECISION } from "./estilos";
import Icono from "@/components/ui/Icono";

/**
 * Banner de cookies y carga de GA4 según la decisión guardada (que vive en el navegador). El banner
 * viene en el HTML y se pinta con la página; a quien ya decidió se lo oculta el script del <head>
 * (SCRIPT_DECISION_INICIAL) y, al hidratar, deja de renderizarse. Sin decisión, GA4 no se carga.
 */
export default function MedicionConConsentimiento({ gaId, measurementAllowed = true }: { gaId: string; measurementAllowed?: boolean }) {
  const decision = useSyncExternalStore(suscribirConsentimiento, leerConsentimiento, () => "pendiente" as const);
  if (decision === "pendiente" || decision === null) return <BannerCookies />;
  if (decision === "rechazada") return <RevocarGA gaId={gaId} />;
  if (!measurementAllowed) return null;
  return (
    <>
      <PermisosGA gaId={gaId} />
      <GoogleAnalytics gaId={gaId} />
    </>
  );
}

// useLayoutEffect corre antes que el useEffect con el que next/script inserta el config de GA4.
function PermisosGA({ gaId }: { gaId: string }) {
  useLayoutEffect(() => {
    window[`ga-disable-${gaId}`] = false;
    for (const comando of COMANDOS_CONSENTIMIENTO) gtag(...comando);
  }, [gaId]);
  return null;
}

// Rechazo (también si antes había aceptado en esta pestaña): sin envíos y sin cookies de GA4.
function RevocarGA({ gaId }: { gaId: string }) {
  useEffect(() => {
    window[`ga-disable-${gaId}`] = true;
    if (window.dataLayer) gtag(...COMANDO_REVOCAR);
    borrarCookies(cookiesGA(gaId));
  }, [gaId]);
  return null;
}

function BannerCookies() {
  return (
    <section
      id="aviso-cookies"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-30 p-3 sm:p-4 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-4 rounded-tarjeta border border-arena-300 bg-white p-4 shadow-elevada sm:flex-row sm:items-center sm:gap-6 sm:p-5">
        <p className="flex flex-1 gap-3 text-sm leading-relaxed text-tinta-900">
          <Icono nombre="info" className="mt-0.5 size-5 text-lago-600" />
          <span>
            Con tu permiso usamos cookies de Google Analytics para conocer, de forma agregada, cómo se usa el sitio y
            mejorarlo. Podés cambiar tu decisión cuando quieras en{" "}
            <Link href={ROUTES.privacidad} className="font-medium text-lago-600 underline underline-offset-2 hover:text-lago-700">
              Privacidad y cookies
            </Link>
            .
          </span>
        </p>
        <div className="flex shrink-0 justify-end gap-3">
          <button type="button" className={BOTON_DECISION} onClick={() => guardarConsentimiento("rechazada")}>
            Rechazar
          </button>
          <button type="button" className={BOTON_DECISION} onClick={() => guardarConsentimiento("aceptada")}>
            Aceptar
          </button>
        </div>
      </div>
    </section>
  );
}
