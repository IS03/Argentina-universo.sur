import { readEditorialTrips } from "../pages/editorial-security.mjs";
import { tripPublishable } from "../../lib/pages/trips.ts";
import { canonicalUrl } from "../../lib/seo.ts";
// Same publication gate as app/sitemap.ts; drafts never enlarge the expected public URL set.
export async function approvedTripUrls(root) {
  return (await readEditorialTrips(root)).filter(tripPublishable).map(trip => canonicalUrl("/escapadas/" + trip.slug));
}
