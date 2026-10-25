"use client";

import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { GoogleAnalytics } from "@next/third-parties/google";
import { leerConsentimiento, guardarConsentimiento, suscribirConsentimiento } from "@/lib/consentimiento";
import { COMANDOS_CONSENTIMIENTO, COMANDO_REVOCAR, cookiesGA } from "@/lib/analytics";
import { ROUTES } from "@/lib/site-links";
import { gtag, borrarCookies } from "./gtag";
import { BOTON_DECISION } from "./estilos";

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
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-xl border border-arena-300/70 bg-arena-50/95 backdrop-blur-md shadow-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <p className="flex-1 text-sm leading-relaxed text-tinta-900">
          Con tu permiso usamos cookies de Google Analytics para conocer, de forma agregada, cómo se usa el sitio y
          mejorarlo. Podés cambiar tu decisión cuando quieras en{" "}
          <Link href={ROUTES.privacidad} className="underline underline-offset-2 hover:text-lago-600">
            Privacidad y cookies
          </Link>
          .
        </p>
        <div className="flex gap-3 justify-end shrink-0">
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
