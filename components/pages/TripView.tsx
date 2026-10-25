import TripArticle from "@/components/escapadas/TripArticle";
import EspacioPublicitario from "@/components/publicidad/EspacioPublicitario";
import { MigasDePan } from "@/components/ui/EncabezadoPagina";
import { ROUTES } from "@/lib/site-links";
import type { PublishedTrip } from "@/lib/pages/trips";
export default function TripView({ trip }: { trip: PublishedTrip }) {
  return (
    <TripArticle
      trip={trip}
      migas={<MigasDePan migas={[{ href: ROUTES.home, etiqueta: "Inicio" }, { href: ROUTES.escapadas, etiqueta: "Escapadas" }]} actual={trip.title} />}
      lateral={<EspacioPublicitario id="escapada-lateral" />}
    />
  );
}
