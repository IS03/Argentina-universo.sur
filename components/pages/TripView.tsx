import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TripArticle from "@/components/escapadas/TripArticle";
import type { PublishedTrip } from "@/lib/pages/trips";
export default function TripView({ trip }: { trip: PublishedTrip }) {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto pt-32 pb-16 px-6 text-[#5A4E3D]">
        <TripArticle trip={trip} />
      </main>
      <Footer />
    </>
  );
}
