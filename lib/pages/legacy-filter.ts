import { SLUGS_PROVINCIAS, seleccionDesdeParametro } from "../site-links.ts";
export function legacyFilterDestination(input: string): string | null {
  const url = new URL(input, "https://www.argentinauniversosur.com");
  if (url.pathname !== "/actividades" || !url.searchParams.get("provincia"))
    return null;
  return `/actividades/por-provincia/${seleccionDesdeParametro(url.searchParams.get("provincia"))}${url.search}`;
}
export function cloudflareFilterRules(host = "www.argentinauniversosur.com") {
  if (!/^[a-z0-9.-]+$/.test(host))
    throw Error("Expected an authorized hostname, without scheme or path");
  const path = `http.host eq ${JSON.stringify(host)} and http.request.uri.path eq "/actividades"`;
  const value = 'http.request.uri.args["provincia"][0]';
  const known = `{${SLUGS_PROVINCIAS.map((s) => JSON.stringify(s)).join(" ")}}`;
  const rule = (
    description: string,
    expression: string,
    destination: { value?: string; expression?: string },
  ) => ({
    description,
    expression,
    action: "redirect",
    action_parameters: {
      from_value: {
        status_code: 308,
        preserve_query_string: true,
        target_url: destination,
      },
    },
    enabled: true,
  });
  return [
    rule("Legacy Catamarca activities", `${path} and ${value} eq "catarmaca"`, {
      expression:
        'concat("https://", http.host, "/actividades/por-provincia/catamarca")',
    }),
    rule("Legacy province activities", `${path} and ${value} in ${known}`, {
      expression: `concat("https://", http.host, "/actividades/por-provincia/", ${value})`,
    }),
    rule(
      "Unknown province activities",
      `${path} and ${value} ne "" and not ${value} in ${known} and ${value} ne "catarmaca"`,
      {
        expression:
          'concat("https://", http.host, "/actividades/por-provincia/sin-resultados")',
      },
    ),
  ];
}
