/**
 * URL absolues de l'application, sans valeur en dur.
 * Ordre : NEXT_PUBLIC_SITE_URL (à définir en Production) → URL de production Vercel
 * → URL du déploiement Vercel (prévisualisations) → local.
 */
type Env = Record<string, string | undefined>;

const clean = (url: string) => url.replace(/\/+$/, "");
const withProtocol = (host: string) => (/^https?:\/\//.test(host) ? host : `https://${host}`);

export function getSiteUrl(env: Env = process.env) {
  if (env.NEXT_PUBLIC_SITE_URL) return clean(withProtocol(env.NEXT_PUBLIC_SITE_URL));
  if (env.VERCEL_ENV === "production" && env.VERCEL_PROJECT_PRODUCTION_URL) return clean(withProtocol(env.VERCEL_PROJECT_PRODUCTION_URL));
  if (env.VERCEL_URL) return clean(withProtocol(env.VERCEL_URL));
  return "http://localhost:3100";
}

/** Boutique Shopify (liens « retour au site »). */
export function getShopUrl(env: Env = process.env) {
  return clean(withProtocol(env.NEXT_PUBLIC_SHOP_URL || "https://remarq.fr"));
}

export function absoluteUrl(path: string, env: Env = process.env) {
  return `${getSiteUrl(env)}${path.startsWith("/") ? path : `/${path}`}`;
}
