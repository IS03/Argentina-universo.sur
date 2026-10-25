import "server-only";
import trip20 from "./santiago-del-estero.json";
import trip03 from "./pinamar.json";
import trip22 from "./la-pampa.json";
import trip18 from "./rio-gallegos.json";
import trip21 from "./misiones.json";
import trip23 from "./formosa.json";
import trip11 from "./entre-rios.json";
import trip14 from "./chaco.json";
import trip17 from "./san-luis.json";
import trip16 from "./san-juan.json";
import trip19 from "./neuquen.json";
import trip15 from "./mendoza.json";
import trip07 from "./sierra-de-la-ventana.json";
import trip09 from "./salta.json";
import trip05 from "./jujuy.json";
import trip10 from "./norte-de-cordoba.json";
import trip12 from "./ushuaia.json";
import trip04 from "./puerto-madryn.json";
import trip01 from "./el-calafate-y-el-chalten.json";
import trip08 from "./san-carlos-de-bariloche.json";
import caba from "./caba.json";
import iguazu from "./puerto-iguazu.json";
import talampaya from "./talampaya-e-ischigualasto.json";
import elPalmar from "./el-palmar.json";
import { tripPublishable, publishedTripProjection, validateTripAsOf, buildDate, type Trip } from "@/lib/pages/trips";
const trips: Trip[] = [trip20, trip03, trip22, trip18, trip21, trip23, trip11, trip14, trip17, trip16, trip19, trip15, trip07, trip09, trip05, trip10, trip12, trip04, trip01, trip08, elPalmar, caba, iguazu, talampaya] as Trip[];
// An invalid record, a date after the build or an "approved" status without a review bound to this exact
// hash fails the build instead of being dropped silently. Drafts stay valid input and are simply withheld.
const asOf = buildDate();
for (const trip of trips) {
  const errors = validateTripAsOf(trip, asOf);
  if (errors.length) throw new Error(`Unauthorized or invalid escapada "${trip.slug}": ${errors.join("; ")}`);
}
// The same gate applies in Vercel, static exports and Preview. No environment bypass.
export const publishedTrips = trips.filter(tripPublishable).map(trip => publishedTripProjection(trip, {asOf}));
