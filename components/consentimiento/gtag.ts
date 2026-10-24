declare global {
  interface Window {
    dataLayer?: unknown[];
    [desactivar: `ga-disable-${string}`]: boolean | undefined;
  }
}

// Igual que el fragmento oficial de gtag: gtag.js solo procesa objetos `arguments`, no arrays.
export const gtag: (...comando: readonly unknown[]) => void = function () {
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params -- gtag.js ignora los arrays: requiere `arguments`.
  window.dataLayer.push(arguments);
};

// Expira las cookies de GA4 en el host y en cada dominio padre (GA las crea en el dominio más alto posible).
export function borrarCookies(nombres: string[]) {
  const existentes = document.cookie.split(";").map(c => c.split("=")[0].trim()).filter(n => n.startsWith("_ga"));
  const partes = location.hostname.split(".");
  const dominios = ["", ...partes.slice(0, -1).map((_, i) => "." + partes.slice(i).join("."))];
  for (const nombre of new Set([...nombres, ...existentes])) {
    for (const dominio of dominios) {
      document.cookie = `${nombre}=; Max-Age=0; path=/${dominio ? `; domain=${dominio}` : ""}`;
    }
  }
}
