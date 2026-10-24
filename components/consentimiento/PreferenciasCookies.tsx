"use client";

import { useSyncExternalStore } from "react";
import { leerConsentimiento, guardarConsentimiento, suscribirConsentimiento } from "@/lib/consentimiento";
import { BOTON_DECISION } from "./estilos";

const ESTADO = {
  pendiente: "Cargando tu preferencia…",
  aceptada: "Aceptaste las cookies de Google Analytics.",
  rechazada: "Rechazaste las cookies de Google Analytics: no se carga ni recibe datos.",
  sinDecidir: "Todavía no elegiste: Google Analytics no se carga hasta que aceptes.",
};

// Panel de /privacidad para cambiar la decisión tomada en el banner.
export default function PreferenciasCookies() {
  const decision = useSyncExternalStore(suscribirConsentimiento, leerConsentimiento, () => "pendiente" as const);
  const estado = decision === null ? ESTADO.sinDecidir : ESTADO[decision];
  return (
    <div className="rounded-xl border border-[#C9B99B]/70 bg-[#FAF8F3] p-4 sm:p-5 mb-4">
      <p className="text-[#5A4E3D] font-medium mb-4" role="status" aria-live="polite">
        {estado}
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={BOTON_DECISION}
          aria-pressed={decision === "rechazada"}
          disabled={decision === "pendiente"}
          onClick={() => guardarConsentimiento("rechazada")}
        >
          Rechazar
        </button>
        <button
          type="button"
          className={BOTON_DECISION}
          aria-pressed={decision === "aceptada"}
          disabled={decision === "pendiente"}
          onClick={() => guardarConsentimiento("aceptada")}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
