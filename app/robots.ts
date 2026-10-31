import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/** Seules les pages publiques sont indexables ; le back-office ne l'est jamais. */
export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: [{ userAgent: "*", allow: ["/salon", "/depot", "/confidentialite"], disallow: ["/"] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
