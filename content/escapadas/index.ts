import "server-only";
import elPalmar from "./el-palmar.json";
import { tripPublishable, publishedTripProjection, type Trip } from "@/lib/pages/trips";
const trips: Trip[] = [elPalmar as Trip];
// The same gate applies in Vercel, static exports and Preview. No environment bypass.
export const publishedTrips = trips.filter(tripPublishable).map(publishedTripProjection);
