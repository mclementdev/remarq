import { describe, expect, it } from "vitest";
import { absoluteUrl, getShopUrl, getSiteUrl } from "@/lib/site-url";

describe("URL du site", () => {
  it("priorité à NEXT_PUBLIC_SITE_URL, sans barre finale", () => {
    expect(getSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://outil.remarq.fr/", VERCEL_URL: "x.vercel.app" })).toBe("https://outil.remarq.fr");
  });

  it("en production Vercel sans DNS : l'adresse *.vercel.app de production", () => {
    expect(getSiteUrl({ VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "remarq-ten.vercel.app", VERCEL_URL: "remarq-abc123.vercel.app" })).toBe("https://remarq-ten.vercel.app");
  });

  it("en prévisualisation : l'adresse du déploiement", () => {
    expect(getSiteUrl({ VERCEL_ENV: "preview", VERCEL_PROJECT_PRODUCTION_URL: "remarq-ten.vercel.app", VERCEL_URL: "remarq-git-salon.vercel.app" })).toBe("https://remarq-git-salon.vercel.app");
  });

  it("en local", () => {
    expect(getSiteUrl({})).toBe("http://localhost:3100");
    expect(absoluteUrl("depot", {})).toBe("http://localhost:3100/depot");
  });

  it("boutique : remarq.fr par défaut", () => {
    expect(getShopUrl({})).toBe("https://remarq.fr");
    expect(getShopUrl({ NEXT_PUBLIC_SHOP_URL: "remarq.fr" })).toBe("https://remarq.fr");
  });
});
