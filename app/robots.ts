import { createRobots } from "@/lib/seo";

export default function robots() {
  return createRobots(process.env.VERCEL_ENV === "preview");
}
