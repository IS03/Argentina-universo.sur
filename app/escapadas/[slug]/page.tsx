import { notFound } from "next/navigation";
import { trips } from "@/content/escapadas";
import { tripPublishable } from "@/lib/pages/trips";
import { pageMetadata } from "@/lib/seo";
import TripView from "@/components/pages/TripView";
export const dynamicParams = false;
export function generateStaticParams() {
  return trips
    .filter((t) => process.env.AUS_STATIC_EXPORT === "1" || tripPublishable(t))
    .map((t) => ({ slug: t.slug }));
}
function find(slug: string) {
  const trip = trips.find((t) => t.slug === slug);
  if (
    !trip ||
    (process.env.AUS_STATIC_EXPORT !== "1" && !tripPublishable(trip))
  )
    notFound();
  return trip;
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const trip = find((await params).slug);
  return {
    ...pageMetadata("/escapadas/" + trip.slug, trip.title, trip.description),
    ...(!tripPublishable(trip)
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <TripView trip={find((await params).slug)} />;
}
