import { notFound } from "next/navigation";
import { publishedTrips } from "@/content/escapadas";
import { pageMetadata } from "@/lib/seo";
import TripView from "@/components/pages/TripView";
export const dynamicParams = false;
export function generateStaticParams() {
  return publishedTrips.map((trip) => ({ slug: trip.slug }));
}
function find(slug: string) {
  const trip = publishedTrips.find((trip) => trip.slug === slug);
  if (!trip) notFound();
  return trip;
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const trip = find((await params).slug);
  return pageMetadata("/escapadas/" + trip.slug, trip.title, trip.description);
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <TripView trip={find((await params).slug)} />;
}
