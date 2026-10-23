import Home from "@/components/HomeContent";
import { staticPageMetadata } from "@/lib/seo";

export const metadata = staticPageMetadata("/");

export default function HomePage() {
  return <Home />;
}
