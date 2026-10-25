// Review documents only, deliberately outside public/ and every upload artifact. No review web server.
import { mkdir, writeFile } from "node:fs/promises";
import { readEditorialTrips } from "../pages/editorial-security.mjs";
import { tripContentHash, tripPublishable } from "../../lib/pages/trips.ts";
const out = new URL("../../.artifacts/pr12/review/", import.meta.url);
await mkdir(out, {recursive: true});
const trips = await readEditorialTrips(process.cwd());
for (const trip of trips) {
  const text = [
    `# ${trip.title}`, "",
    `**Documento de revisión. Estado: ${trip.status}. Publicable: ${tripPublishable(trip) ? "sí" : "no"}.**`,
    `ID: ${trip.id}. SHA-256 del contenido: \`${tripContentHash(trip)}\`.`,
    "La generación de este documento no otorga aprobación ni permiso de publicación.", "",
    `${trip.destination} · ${trip.province}`, "", trip.description,
    ...trip.sections.flatMap(section => ["", `## ${section.title}`, "", ...section.paragraphs.flatMap(p => [p, ""]), "Fuentes: " + section.sourceIds.join(", "),
      ...(trip.operationalNotices ?? []).filter(n => n.sectionId === section.id).flatMap(n => ["", `> **Estado operativo verificado el ${n.verifiedAt}** (reverificar antes de publicar): ${n.text} Fuentes: ${n.sourceIds.join(", ")}`])]),
    "", "## Ubicación y mapas", "",
    ...(trip.schemaVersion === 2 ? trip.locations.flatMap(l => [`### ${l.label}`, "", l.description, "", `[Mapa orientativo](${l.mapUrl})`, ""]) : [trip.address, "", `[Mapa orientativo](${trip.mapUrl})`]),
    "", "## Fuentes oficiales", "",
    ...trip.sources.map(source => `- ${source.id}: [${source.title}](${source.url}), consultada el ${source.checkedAt}.`),
    "", "## Enlaces relacionados", "", ...trip.related.map(link => `- ${link.label}: ${link.href}`),
    "", "## Revisión pendiente", "", "- [ ] Texto y fuentes contrastados por el responsable.",
    "- [ ] Fotografías seleccionadas con permiso y atribución comprobados; actualmente no se incorporaron fotos.",
    "- [ ] Revisión humana identificada y vinculada a este hash.",
    "- [ ] Decisión independiente de permiso de publicación.",
    "- [ ] Equivalencia con el PDF, respaldo y retirada revisados por separado.", "",
  ].join("\n");
  await writeFile(new URL(trip.slug + ".md", out), text);
}
console.log(`${trips.length} review documents in ${out.pathname}; 0 publication writes.`);
