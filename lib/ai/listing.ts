import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

/** Modèle configurable (cahier des charges §3) ; défaut : modèle Opus actuel. */
export const DEFAULT_MODEL = "claude-opus-5-5";

const SiteSchema = z.object({
  title: z.string().describe("Titre au format : Type de meuble, nom du modèle, matière/couleur, par Fabricant, design pays, années XXXX"),
  presentation: z.string().describe("2 à 4 phrases sobres et rythmées, sans superlatifs creux"),
  characteristics: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .describe("Marque, Designer, Époque, Dimensions, Matières, État détaillé, Travaux réalisés — uniquement les informations connues"),
  missing: z.array(z.string()).describe("Informations utiles absentes des données, à compléter à la main"),
});

const LbcSchema = z.object({
  title: z.string().describe("Titre Leboncoin, 70 caractères maximum"),
  description: z.string().describe("Description structurée en paragraphes courts : état, dimensions, marque, authenticité, livraison"),
  category: z.string().describe("Catégorie Leboncoin suggérée (ex. Ameublement)"),
  keywords: z.array(z.string()).describe("5 à 10 mots-clés de recherche"),
});

const OutputSchema = z.object({ site: SiteSchema, leboncoin: LbcSchema });
export type ListingOutput = z.infer<typeof OutputSchema>;

/** Format enregistré en base (jsonb) et édité dans la fiche. */
export type SiteListing = { title: string; body: string; missing: string[]; generatedAt: string; editedAt?: string };
export type LbcListing = { title: string; body: string; category: string; price: string; keywords: string; generatedAt: string; editedAt?: string };

const SYSTEM = `Tu rédiges les annonces de vente de Remarq, boutique française de mobilier de design d'occasion haut de gamme (site mobilistore.fr).

Ton : sobre, précis, élégant, en français. Phrases courtes. Pas de superlatifs creux (« magnifique », « sublime », « incroyable », « pièce unique » sans justification), pas d'emoji, pas de points d'exclamation.

Règle absolue : n'invente rien. N'utilise que les informations fournies. Si une information manque (designer, année, dimensions, matière…), ne la devine pas : omets-la et ajoute-la à la liste « missing ». L'état doit être décrit honnêtement, avec les défauts signalés et les travaux de remise en état réalisés.

Annonce site — titre au format exact : « Type de meuble, nom du modèle, matière/couleur, par Fabricant, design pays, années XXXX » (ex. « Fauteuil Safari cuir blanc par Ibisco, design italien, années 1970 »). N'indique le pays de design ou la décennie que s'ils découlent des données (le pays d'un fabricant connu est admis). Omets un segment inconnu plutôt que de l'inventer.

Annonce Leboncoin — titre de 70 caractères maximum. Description structurée (état, dimensions, marque, authenticité) qui se termine par la mention « Livraison par transporteur, frais à la charge de l'acheteur. ». Ne mets pas le prix dans la description.`;

export type ListingInput = Record<string, string | number | null | undefined>;

function describeInput(input: ListingInput) {
  return Object.entries(input)
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
    .map(([k, v]) => `- ${k} : ${v}`)
    .join("\n");
}

export class ListingError extends Error {}

export async function generateListing(input: ListingInput, instruction?: string | null): Promise<ListingOutput> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ListingError("La clé ANTHROPIC_API_KEY n'est pas configurée sur le serveur.");
  }
  const client = new Anthropic();
  const userText = [
    "Données du meuble :",
    describeInput(input),
    instruction ? `\nConsigne supplémentaire de l'équipe : ${instruction}` : "",
  ].join("\n");

  try {
    const response = await client.beta.messages.parse({
      model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages: [{ role: "user", content: userText }],
      output_config: { effort: "medium", format: betaZodOutputFormat(OutputSchema) },
    });
    if (response.stop_reason === "refusal") {
      throw new ListingError("La génération a été refusée par le modèle. Reformulez la consigne ou rédigez le texte à la main.");
    }
    if (response.stop_reason === "max_tokens" || !response.parsed_output) {
      throw new ListingError("La réponse du modèle est incomplète. Réessayez.");
    }
    return response.parsed_output;
  } catch (error) {
    if (error instanceof ListingError) throw error;
    if (error instanceof Anthropic.AuthenticationError) throw new ListingError("Clé API Anthropic invalide.");
    if (error instanceof Anthropic.RateLimitError) throw new ListingError("Trop de demandes en même temps : réessayez dans une minute.");
    if (error instanceof Anthropic.BadRequestError) throw new ListingError(`Requête refusée par l'API : ${error.message}`);
    if (error instanceof Anthropic.APIConnectionError) throw new ListingError("Impossible de joindre l'API Anthropic. Vérifiez la connexion.");
    if (error instanceof Anthropic.APIError) throw new ListingError(`Erreur de l'API Anthropic (${error.status}). Réessayez.`);
    throw new ListingError("Erreur inattendue pendant la génération.");
  }
}

/** Met en forme la sortie structurée en textes éditables. */
export function toStoredListings(out: ListingOutput, price: string): { site: SiteListing; lbc: LbcListing } {
  const now = new Date().toISOString();
  const characteristics = out.site.characteristics.map((c) => `${c.label} : ${c.value}`).join("\n");
  return {
    site: {
      title: out.site.title.trim(),
      body: [out.site.presentation.trim(), characteristics].filter(Boolean).join("\n\n"),
      missing: out.site.missing,
      generatedAt: now,
    },
    lbc: {
      title: out.leboncoin.title.trim().slice(0, 70),
      body: out.leboncoin.description.trim(),
      category: out.leboncoin.category.trim(),
      price,
      keywords: out.leboncoin.keywords.join(", "),
      generatedAt: now,
    },
  };
}
