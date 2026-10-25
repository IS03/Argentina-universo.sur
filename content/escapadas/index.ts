import "server-only";
import caba from "./caba.json";
import iguazu from "./puerto-iguazu.json";
import talampaya from "./talampaya-e-ischigualasto.json";
import elPalmar from "./el-palmar.json";
import { tripPublishable, publishedTripProjection, validateTrip, type Trip } from "@/lib/pages/trips";
const trips: Trip[] = [elPalmar, caba, iguazu, talampaya] as Trip[];
// An invalid record or an "approved" status without a review bound to this exact hash fails the build
// instead of being dropped silently. Drafts stay valid input and are simply withheld.
for (const trip of trips) {
  const errors = validateTrip(trip);
  if (errors.length) throw new Error(`Unauthorized or invalid escapada "${trip.slug}": ${errors.join("; ")}`);
}
// The same gate applies in Vercel, static exports and Preview. No environment bypass.
export const publishedTrips = trips.filter(tripPublishable).map(publishedTripProjection);
