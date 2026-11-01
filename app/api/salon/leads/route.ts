import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseLead } from "@/lib/salon/lead";
import { salonContent } from "@/lib/content/salon";
import { buildSalonEmail } from "@/lib/email/salon-email";
import { sendEmail } from "@/lib/email/send";
import { absoluteUrl } from "@/lib/site-url";

/** Limite : 5 envois par adresse IP sur 10 minutes. */
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60_000;

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "inconnue";
}

export async function POST(request: Request) {
  const parsed = parseLead(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error, field: parsed.field }, { status: 400 });

  const formUrl = absoluteUrl("/depot");
  // Robot : on répond comme si tout allait bien, sans rien enregistrer ni envoyer.
  if (parsed.spam) return NextResponse.json({ ok: true, emailSent: true, formUrl });

  const supabase = createAdminClient();
  const ipHash = createHmac("sha256", process.env.SUPABASE_SECRET_KEY ?? "remarq").update(clientIp(request)).digest("hex");

  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const { count, error: countError } = await supabase
    .from("salon_leads")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);
  if (countError) return NextResponse.json({ error: "Service indisponible, réessayez dans un instant." }, { status: 500 });
  if ((count ?? 0) >= RATE_LIMIT) {
    return NextResponse.json({ error: "Trop de demandes en peu de temps. Réessayez dans quelques minutes." }, { status: 429 });
  }

  const { data: lead, error } = await supabase
    .from("salon_leads")
    .insert({
      email: parsed.email,
      source: parsed.source,
      consent: true,
      consent_text: salonContent.consentRecord,
      ip_hash: ipHash,
    })
    .select("id")
    .single();
  if (error || !lead) return NextResponse.json({ error: "Votre demande n'a pas pu être enregistrée. Réessayez." }, { status: 500 });

  const result = await sendEmail(buildSalonEmail({ to: parsed.email, formUrl }));
  await supabase
    .from("salon_leads")
    .update(result.ok ? { email_sent_at: new Date().toISOString() } : { email_error: result.error.slice(0, 500) })
    .eq("id", lead.id);

  return NextResponse.json({ ok: true, emailSent: result.ok, formUrl });
}
