import { createHash } from "node:crypto";
import { REGION_POR_PROVINCIA } from "../catalog.ts";
export type LegacyTrip = {
  schemaVersion?: 1;
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
export type TripSectionKind = "highlights" | "activities" | "nature" | "culture" | "practical";
export type TripPhoto = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  variants: { src: string; width: number }[];
  rights: {
    status: "pending" | "approved";
    holder: string;
    licenseName: string;
    licenseUrl: string;
    evidenceUrl: string;
    reviewer: string;
    reviewedAt: string;
  };
};
// Variable operating conditions (closures, works, suspensions): dated and sourced, kept apart from the
// permanent description and never valid for publication without a fresh verification.
export type TripOperationalNotice = { id: string; sectionId: string; text: string; sourceIds: string[]; verifiedAt: string };
export const OPERATIONAL_NOTICE_MAX_AGE_DAYS = 7;
export type StructuredTrip = Omit<LegacyTrip, "schemaVersion" | "sections"> & {
  schemaVersion: 2;
  introductionSourceIds: string[];
  geography: {
    provinceSlugs: string[];
    localities: { id: string; name: string; provinceSlug: string; sourceIds: string[] }[];
  };
  sections: { id: string; kind: TripSectionKind; title: string; paragraphs: string[]; sourceIds: string[] }[];
  locations: { id: string; label: string; description: string; mapUrl: string; sourceIds: string[] }[];
  photos: TripPhoto[];
  operationalNotices?: TripOperationalNotice[];
  editorial: {
    documentaryStatus: "researching" | "sources-checked";
    updatedAt: string;
    origin: {
      kind: "git-editorial";
      legacyGuideIds: string[];
      // Filled only by a later authorized reconciliation; never inferred from names or slugs.
      masterRefs: { sheet: string; originalId: string }[];
    };
    pendingReviews: string[];
  };
};
export type Trip = LegacyTrip | StructuredTrip;
export type PublicTripPhoto = Omit<TripPhoto, "rights"> & {
  attribution: { holder: string; licenseName: string; licenseUrl: string };
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
  if (!trip || ![undefined, 1, 2].includes(trip.schemaVersion) || !["draft", "approved"].includes(trip.status) || typeof trip.publicationAuthorized !== "boolean") return ["Invalid editorial state/schema"];
  if (!Array.isArray(trip.sources) || !trip.sources.length || trip.sources.some(s => !s || !s.id || !s.title || typeof s.url !== "string" || typeof s.checkedAt !== "string")) return ["Invalid source shape"];
  if (!Array.isArray(trip.sections) || !trip.sections.length || trip.sections.some(s => !s || !s.title || !Array.isArray(s.paragraphs) || !s.paragraphs.length || s.paragraphs.some(p => typeof p !== "string") || !Array.isArray(s.sourceIds))) return ["Invalid section shape"];
  if (!Array.isArray(trip.related) || trip.related.some(l => !l || typeof l.href !== "string" || !l.label)) return ["Invalid related links"];
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
  if (trip.schemaVersion === 2) errors.push(...validateStructuredTrip(trip));
  if (trip.status === "approved" && !tripPublishable(trip))
    errors.push("Approval lacks human review/publication permission");
  return errors;
}

function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
function https(value: string): boolean {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}
function validateStructuredTrip(trip: StructuredTrip): string[] {
  const errors: string[] = [];
  const sources = new Set(trip.sources.map(source => source.id));
  const linked = (ids: string[]) => Array.isArray(ids) && ids.length > 0 && ids.every(id => sources.has(id));
  const unique = (ids: string[]) => new Set(ids).size === ids.length;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trip.slug)) errors.push("Invalid trip slug");
  if (!linked(trip.introductionSourceIds)) errors.push("Introduction evidence missing");
  const provinces = Array.isArray(trip.geography?.provinceSlugs) ? trip.geography.provinceSlugs : [];
  if (!provinces.length || !unique(provinces) || provinces.some(slug => !Object.hasOwn(REGION_POR_PROVINCIA, slug))) errors.push("Unknown or duplicate jurisdiction");
  if (!Array.isArray(trip.geography?.localities) || !trip.geography.localities.length || !unique(trip.geography.localities.map(l => l.id)) || trip.geography.localities.some(l => !l.id || !l.name || !provinces.includes(l.provinceSlug) || !linked(l.sourceIds))) errors.push("Invalid locality relations");
  const kinds = new Set(["highlights", "activities", "nature", "culture", "practical"]);
  if (!unique(trip.sections.map(s => s.id)) || trip.sections.some(s => !/^[a-z0-9-]+$/.test(s.id) || !kinds.has(s.kind) || !s.title || !s.paragraphs?.length || s.paragraphs.some(p => !p.trim()))) errors.push("Invalid structured sections");
  for (const kind of ["highlights", "activities", "practical"]) if (!trip.sections.some(s => s.kind === kind)) errors.push("Missing section: " + kind);
  if (!Array.isArray(trip.locations) || !trip.locations.length || !unique(trip.locations.map(l => l.id)) || trip.locations.some(l => !l.id || !l.label || !l.description || !https(l.mapUrl) || !linked(l.sourceIds))) errors.push("Invalid location/evidence");
  if (!https(trip.mapUrl) || trip.related.some(l => !/^\/(?!\/)/.test(l.href))) errors.push("Unsafe map or related URL");
  const editorial = trip.editorial;
  if (!editorial || !["researching", "sources-checked"].includes(editorial.documentaryStatus) || !validDate(editorial.updatedAt) || editorial.origin?.kind !== "git-editorial" || !Array.isArray(editorial.origin.legacyGuideIds) || !unique(editorial.origin.legacyGuideIds) || !Array.isArray(editorial.origin.masterRefs) || !Array.isArray(editorial.pendingReviews)) errors.push("Invalid editorial provenance");
  const notices = trip.operationalNotices ?? [];
  if (!Array.isArray(notices) || !unique(notices.map(n => n?.id)) || notices.some(n => !n || !/^[a-z0-9-]+$/.test(n.id) || !trip.sections.some(s => s.id === n.sectionId) || !n.text?.trim() || !linked(n.sourceIds) || !validDate(n.verifiedAt))) errors.push("Invalid operational notice");
  else if (trip.status === "approved")
    for (const notice of notices) {
      const age = (Date.parse(trip.review?.date ?? "") - Date.parse(notice.verifiedAt)) / 86_400_000;
      if (!(age >= 0 && age <= OPERATIONAL_NOTICE_MAX_AGE_DAYS)) errors.push("Operational notice must be re-verified before publication: " + notice.id);
    }
  if (!Array.isArray(trip.photos)) errors.push("Photo inventory missing");
  else for (const photo of trip.photos) {
    const local = (url: string) => /^\/(?:img|media)\/[a-zA-Z0-9_./-]+\.(?:webp|avif)$/.test(url) && !url.includes("..");
    if (!photo.alt?.trim() || !photo.caption || !local(photo.src) || !Number.isInteger(photo.width) || !Number.isInteger(photo.height) || photo.width <= 0 || photo.height <= 0 || !photo.variants?.length || !unique(photo.variants.map(v => String(v.width))) || photo.variants.some(v => !local(v.src) || !Number.isInteger(v.width) || v.width <= 0 || v.width > photo.width)) errors.push("Invalid optimized photo");
    if (photo.rights?.status !== "approved" || !photo.rights.holder || !photo.rights.licenseName || !https(photo.rights.licenseUrl) || !https(photo.rights.evidenceUrl) || !photo.rights.reviewer || !validDate(photo.rights.reviewedAt)) errors.push("Photo rights require independent review");
  }
  return errors;
}

// Explicit public projection. Reviews, authorization, Work reconciliation and unknown fields stay private.
export type PublishedTrip = Pick<LegacyTrip,
  "id" | "slug" | "title" | "destination" | "province" | "description" |
  "sources" | "address" | "mapUrl" | "related"
> & {
  sections: (LegacyTrip["sections"][number] & { id?: string; kind?: TripSectionKind })[];
  introductionSourceIds?: string[];
  geography?: StructuredTrip["geography"];
  locations?: StructuredTrip["locations"];
  photos?: PublicTripPhoto[];
  operationalNotices?: TripOperationalNotice[];
};
export function publishedTripProjection(trip: Trip): PublishedTrip {
  if (!tripPublishable(trip)) throw new Error("Trip has no valid publication approval");
  const errors = validateTrip(trip);
  if (errors.length) throw new Error("Invalid approved trip: " + errors.join("; "));
  const projected: PublishedTrip = {
    id: trip.id, slug: trip.slug, title: trip.title,
    destination: trip.destination, province: trip.province, description: trip.description,
    sources: trip.sources.map(({id, title, url, checkedAt}) => ({id, title, url, checkedAt})),
    sections: trip.sections.map(({title, paragraphs, sourceIds}) => ({title, paragraphs: [...paragraphs], sourceIds: [...sourceIds]})),
    address: trip.address, mapUrl: trip.mapUrl,
    related: trip.related.map(({href, label}) => ({href, label})),
  };
  if (trip.schemaVersion === 2) {
    projected.introductionSourceIds = [...trip.introductionSourceIds];
    projected.sections = trip.sections.map(({id, kind, title, paragraphs, sourceIds}) => ({id, kind, title, paragraphs: [...paragraphs], sourceIds: [...sourceIds]}));
    projected.geography = {
      provinceSlugs: [...trip.geography.provinceSlugs],
      localities: trip.geography.localities.map(({id, name, provinceSlug, sourceIds}) => ({id, name, provinceSlug, sourceIds: [...sourceIds]})),
    };
    projected.locations = trip.locations.map(({id, label, description, mapUrl, sourceIds}) => ({id, label, description, mapUrl, sourceIds: [...sourceIds]}));
    if (trip.operationalNotices?.length)
      projected.operationalNotices = trip.operationalNotices.map(({id, sectionId, text, sourceIds, verifiedAt}) => ({id, sectionId, text, sourceIds: [...sourceIds], verifiedAt}));
    projected.photos = trip.photos.map(({src, alt, caption, width, height, variants, rights}) => ({
      src, alt, caption, width, height,
      variants: variants.map(({src, width}) => ({src, width})),
      attribution: {holder: rights.holder, licenseName: rights.licenseName, licenseUrl: rights.licenseUrl},
    }));
  }
  return projected;
}
