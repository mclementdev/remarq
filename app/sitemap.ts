import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/salon", "/depot", "/confidentialite"].map((path) => ({ url: absoluteUrl(path), changeFrequency: "monthly" }));
}
