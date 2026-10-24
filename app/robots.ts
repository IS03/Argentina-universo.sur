import { isPagesPreview } from "@/lib/pages/environment";
import { createRobots } from "@/lib/seo";

export default function robots() {
  return createRobots(isPagesPreview(process.env));
}
