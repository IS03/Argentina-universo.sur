"use client";
import { useSyncExternalStore } from "react";
import MedicionConConsentimiento from "@/components/consentimiento/MedicionConConsentimiento";
const subscribe = () => () => {};
const allowedHost = () => location.hostname === "www.argentinauniversosur.com";
// Even a production artifact served on a pages.dev alias cannot mount GA4.
export default function PagesConsent({ gaId }: { gaId: string }) {
  const allowed = useSyncExternalStore(subscribe, allowedHost, () => false);
  return <MedicionConConsentimiento gaId={gaId} measurementAllowed={allowed} />;
}
