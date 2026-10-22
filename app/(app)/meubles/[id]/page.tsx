import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { signPaths } from "@/lib/storage";
import { getSettings } from "@/lib/settings";
import { agingLabel, nonConformCounter } from "@/lib/calc/aging";
import { formatDate } from "@/lib/format";
import { CATEGORY_LABELS, type Category, type PhotoSlot } from "@/lib/labels";
import { STATUS_LABELS, type FurnitureStatus } from "@/lib/status";
import { ModeBadge, StatusBadge } from "@/components/ui/Badges";
import { Section } from "@/components/furniture/Section";
import { InfoSection } from "@/components/furniture/InfoSection";
import { SellerSection } from "@/components/furniture/SellerSection";
import { HistorySection } from "@/components/furniture/HistorySection";
import { PhotoGallery, type GalleryPhoto } from "@/components/furniture/PhotoGallery";
import { StatusActions } from "@/components/furniture/StatusActions";
import { EmailActions } from "@/components/furniture/EmailActions";
import { buildTransitionContext, emailFurniture } from "@/lib/transition-context";
import { buildEmailVars } from "@/lib/emails/render";
import type { EmailTemplateKey } from "@/lib/emails/templates";
import { NotesSection, type NoteView } from "@/components/furniture/NotesSection";
import { CalendarSection } from "@/components/furniture/CalendarSection";
import { ATTACHMENT_BUCKET } from "@/lib/storage";
import { FinanceSection } from "@/components/furniture/FinanceSection";
import { TimeSection } from "@/components/furniture/TimeSection";
import { ListingSection } from "@/components/furniture/ListingSection";
import { ConformitySection } from "@/components/furniture/ConformitySection";
import type { LbcListing, SiteListing } from "@/lib/ai/listing";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return { title: "Meuble" };
  const supabase = await createClient();
  const { data } = await supabase.from("furnitures").select("name").eq("id", id).maybeSingle();
  return { title: data?.name ?? "Meuble" };
}

export default async function FurniturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const supabase = await createClient();

  const [{ data: f }, settings, photosRes, historyRes, activityRes, brandsRes, profilesRes] = await Promise.all([
    supabase.from("furniture_overview").select("*").eq("id", id).maybeSingle(),
    getSettings(supabase),
    supabase.from("photos").select("*").eq("furniture_id", id).order("position"),
    supabase.from("status_history").select("*").eq("furniture_id", id).order("changed_at"),
    supabase.from("activity_log").select("*").eq("furniture_id", id).order("created_at"),
    supabase.from("brands").select("id, name, active").order("name"),
    supabase.from("profiles").select("id, first_name"),
  ]);
  const [{ data: appointments }, { data: notes }, { data: attachments }, { data: financeLines }, { data: timeEntries }] = await Promise.all([
    supabase.from("appointments").select("*").eq("furniture_id", id).order("appointment_date"),
    supabase.from("notes").select("*").eq("furniture_id", id).order("created_at", { ascending: false }),
    supabase.from("attachments").select("*").eq("furniture_id", id).order("created_at"),
    supabase.from("finance_lines").select("*").eq("furniture_id", id).order("line_date"),
    supabase.from("time_entries").select("*").eq("furniture_id", id).order("entry_date", { ascending: false }),
  ]);
  const attachmentUrls = await signPaths(supabase, (attachments ?? []).map((a) => a.storage_path), ATTACHMENT_BUCKET);
  if (!f || !f.id || !f.status) notFound();

  const photos = photosRes.data ?? [];
  const urls = await signPaths(supabase, photos.flatMap((p) => [p.storage_path, p.thumb_path]));
  const gallery = (kind: string): GalleryPhoto[] =>
    photos
      .filter((p) => p.kind === kind)
      .map((p) => ({
        id: p.id,
        url: urls[p.storage_path] ?? null,
        thumbUrl: (p.thumb_path && urls[p.thumb_path]) || urls[p.storage_path] || null,
        isMain: p.is_main,
        slot: p.slot as PhotoSlot,
      }));
  const authors = Object.fromEntries((profilesRes.data ?? []).map((p) => [p.id, p.first_name]));
  const status = f.status as FurnitureStatus;
  const counter = status === "non_conform" && f.non_conform_at ? nonConformCounter(f.non_conform_at, settings.non_conform_delay_days) : null;

  const ctx = buildTransitionContext(f, settings);
  const emailData = { furniture: emailFurniture(f), brandName: f.brand_name };
  const pickup = [...(appointments ?? [])].reverse().find((a) => a.type === "seller_pickup") ?? null;
  const emailVars = buildEmailVars(emailData.furniture, f.brand_name, settings, pickup);
  const suggestedEmails = suggestEmails(status, f.refusal_reason, f.mode);
  const noteViews: NoteView[] = (notes ?? []).map((n) => ({
    id: n.id,
    body: n.body,
    author: n.author_id ? authors[n.author_id] ?? null : null,
    createdAt: n.created_at,
    attachments: (attachments ?? [])
      .filter((a) => a.note_id === n.id)
      .map((a) => ({ id: a.id, filename: a.filename, mime: a.mime, url: attachmentUrls[a.storage_path] ?? null })),
  }));
  const actionProps = { furnitureId: id, furnitureName: f.name ?? "", status, ctx, email: emailData, settings };

  // Les champs de la vue sont typés « nullable » : la ligne existe, on les ré-affirme pour les sections.
  const furniture = f as typeof f & {
    id: string; name: string; category: Category; description: string; condition: "new" | "very_good" | "good" | "used" | "to_restore";
    seller_first_name: string; seller_last_name: string; seller_email: string; seller_phone: string;
    seller_street: string; seller_postal_code: string; seller_city: string;
  };

  return (
    <div className="space-y-6">
      <header className="sticky top-14 z-20 -mx-4 border-b border-line-soft bg-paper/95 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
        <nav aria-label="Fil d'Ariane" className="mb-1 text-xs text-ink-muted">
          <Link href="/meubles" className="hover:underline">Tous les meubles</Link> / <Link href="/crm" className="hover:underline">CRM</Link>
        </nav>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-2xl">{f.name}</h1>
          <span className="text-ink-soft">{f.brand_name}</span>
          <StatusBadge status={status} />
          <ModeBadge mode={f.mode} />
          {f.is_abandoned && <span className="badge border-danger text-danger">Abandonné par le client</span>}
          <span className="text-sm text-ink-muted" title={STATUS_LABELS[status]}>
            {counter ? (
              <span className={counter.expired ? "text-danger" : undefined}>
                {counter.label} · limite le {formatDate(counter.deadline)}
              </span>
            ) : (
              f.status_changed_at && agingLabel(f.status_changed_at)
            )}
          </span>
          <span className="flex-1" />
          <div className="flex flex-wrap gap-2">
            <StatusActions {...actionProps} variant="header" />
          </div>
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          {CATEGORY_LABELS[furniture.category]} · demande reçue le {formatDate(f.created_at)}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <Section id="informations" title="1. Informations du meuble">
            <div className="space-y-6">
              <PhotoGallery furnitureId={id} kind="deposit" photos={gallery("deposit")} withMain />
              <InfoSection furniture={furniture} brandName={f.brand_name} brands={brandsRes.data ?? []} />
              <div>
                <h3 className="mb-2 text-sm text-ink-muted">Certificat d&apos;authenticité</h3>
                <PhotoGallery furnitureId={id} kind="certificate" photos={gallery("certificate")} emptyText="Aucun certificat fourni." />
                <p className="mt-2 text-xs text-ink-muted">
                  Certification cochée le {formatDate(f.certified_at)} : « {f.certification_text} »
                </p>
              </div>
            </div>
          </Section>
          <Section id="finances" title="4. Finances">
            <FinanceSection
              furnitureId={id}
              finances={{
                mode: f.mode,
                original_price: f.original_price,
                desired_price: f.desired_price,
                offer_buyout_price: f.offer_buyout_price,
                expected_sale_price: f.expected_sale_price,
                transport_cost: f.transport_cost,
                final_buyout_price: f.final_buyout_price,
                consignment_commission: f.consignment_commission,
                consignment_terms: f.consignment_terms,
                listed_price: f.listed_price,
                final_sale_price: f.final_sale_price,
              }}
              lines={financeLines ?? []}
              hoursTotal={Number(f.hours_total ?? 0)}
              hourlyRate={settings.hourly_rate}
            />
          </Section>
          <Section id="temps" title="5. Temps passé">
            <TimeSection furnitureId={id} entries={timeEntries ?? []} hourlyRate={settings.hourly_rate} authors={authors} />
          </Section>
          <Section
            id="mise-en-ligne"
            title="7. Mise en ligne"
            actions={<a href={`/api/meubles/${id}/zip`} className="btn-secondary btn-sm" download>Télécharger les photos (ZIP)</a>}
          >
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-sm text-ink-muted">Photos de mise en ligne</h3>
                <PhotoGallery furnitureId={id} kind="listing" photos={gallery("listing")} emptyText="Aucune photo de mise en ligne : le ZIP contiendra les photos du dépôt." />
              </div>
              <ListingSection
                furnitureId={id}
                site={f.listing_site as SiteListing | null}
                lbc={f.listing_lbc as LbcListing | null}
                publication={{
                  published_site: !!f.published_site,
                  published_site_at: f.published_site_at,
                  published_lbc: !!f.published_lbc,
                  published_lbc_at: f.published_lbc_at,
                }}
              />
            </div>
          </Section>
          <Section id="conformite" title="8. Conformité">
            <ConformitySection
              furnitureId={id}
              report={f.conformity_report}
              choice={f.non_conform_choice}
              returnQuote={f.return_quote}
              counter={counter}
              gallery={<PhotoGallery furnitureId={id} kind="conformity" photos={gallery("conformity")} emptyText="Aucune photo de conformité." />}
            />
          </Section>
        </div>

        <div className="space-y-6">
          <Section id="vendeur" title="2. Vendeur">
            <SellerSection furniture={furniture} />
          </Section>
          <Section id="actions" title="3. Décision / Actions">
            <div className="space-y-5">
              <EmailActions furnitureId={id} vars={emailVars} to={f.seller_email ?? ""} suggested={suggestedEmails} />
              <StatusActions {...actionProps} variant="correction" />
            </div>
          </Section>
          <Section id="calendrier" title="6. Calendrier">
            <CalendarSection furnitureId={id} appointments={appointments ?? []} />
          </Section>
          <Section id="notes" title="9. Notes internes">
            <NotesSection furnitureId={id} notes={noteViews} />
          </Section>
          <Section id="historique" title="10. Historique">
            <HistorySection history={historyRes.data ?? []} activity={activityRes.data ?? []} authors={authors} />
          </Section>
        </div>
      </div>
    </div>
  );
}

/** Mails mis en avant selon le statut courant. */
function suggestEmails(status: FurnitureStatus, refusal: string | null, mode: string | null): EmailTemplateKey[] {
  switch (status) {
    case "new":
      return ["info_request"];
    case "info_requested":
      return ["info_request"];
    case "refused":
      return refusal ? [`refusal_${refusal}` as EmailTemplateKey] : [];
    case "accepted":
    case "offer_sent":
      return ["offer"];
    case "pickup_scheduled":
      return ["pickup_confirmation"];
    case "non_conform":
      return ["non_conform"];
    case "received":
    case "preparing":
      return ["received_ok"];
    case "sold":
      return mode === "consignment" ? ["sold_consignment"] : [];
    default:
      return [];
  }
}
