import { createHash } from "node:crypto";
export type Trip = {
  id: string;
  slug: string;
  title: string;
  destination: string;
  province: string;
  description: string;
  status: "draft" | "approved";
  publicationAuthorized: boolean;
  review: { reviewer: string; date: string; contentSha256: string } | null;
  sources: { id: string; title: string; url: string; checkedAt: string }[];
  sections: { title: string; paragraphs: string[]; sourceIds: string[] }[];
  address: string;
  mapUrl: string;
  related: { href: string; label: string }[];
};
function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ":" + canonical(v))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
export function tripContentHash(trip: Trip): string {
  const { status, review, publicationAuthorized, ...content } = trip;
  void status;
  void review;
  void publicationAuthorized;
  return createHash("sha256").update(canonical(content)).digest("hex");
}
export function tripPublishable(trip: Trip): boolean {
  return (
    trip.status === "approved" &&
    trip.publicationAuthorized &&
    !!trip.review?.reviewer &&
    !!trip.review?.date &&
    !Number.isNaN(Date.parse(trip.review.date)) &&
    trip.review?.contentSha256 === tripContentHash(trip)
  );
}
export function validateTrip(trip: Trip): string[] {
  const errors: string[] = [];
  const sources = new Set(trip.sources.map((s) => s.id));
  if (!trip.id || !trip.slug || !trip.title) errors.push("Missing identity");
  if (sources.size !== trip.sources.length) errors.push("Duplicate source IDs");
  for (const source of trip.sources)
    if (
      !source.url.startsWith("https://") ||
      !/^\d{4}-\d{2}-\d{2}$/.test(source.checkedAt) ||
      Number.isNaN(Date.parse(source.checkedAt)) ||
      new Date(source.checkedAt).toISOString().slice(0, 10) !== source.checkedAt
    )
      errors.push("Invalid source");
  for (const section of trip.sections)
    if (
      !section.sourceIds.length ||
      section.sourceIds.some((id) => !sources.has(id))
    )
      errors.push("Unresolved section evidence");
  if (trip.status === "approved" && !tripPublishable(trip))
    errors.push("Approval lacks human review/publication permission");
  return errors;
}

// Explicit public projection: editorial authorization, reviews and unknown import fields stay server-side.
export type PublishedTrip = Pick<Trip,
  "id" | "slug" | "title" | "destination" | "province" | "description" |
  "sources" | "sections" | "address" | "mapUrl" | "related"
>;
export function publishedTripProjection(trip: Trip): PublishedTrip {
  if (!tripPublishable(trip)) throw new Error("Trip has no valid publication approval");
  return {
    id: trip.id, slug: trip.slug, title: trip.title,
    destination: trip.destination, province: trip.province, description: trip.description,
    sources: trip.sources.map(({id, title, url, checkedAt}) => ({id, title, url, checkedAt})),
    sections: trip.sections.map(({title, paragraphs, sourceIds}) => ({title, paragraphs: [...paragraphs], sourceIds: [...sourceIds]})),
    address: trip.address, mapUrl: trip.mapUrl,
    related: trip.related.map(({href, label}) => ({href, label})),
  };
}
