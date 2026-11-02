"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { StepHeader } from "./StepHeader";
import { PieceCard } from "./PieceCard";
import { Field, aria, ErrorText, Req } from "./Field";
import type { PhotoItem } from "./PhotoTile";
import { EMPTY_PICKUP, EMPTY_SELLER, emptyPiece, type PickupState, type PieceState, type SellerState } from "./types";
import { uploadDepotImage } from "@/lib/image";
import { createLimiter } from "@/lib/limit";
import { CERTIFICATION_TEXT, FLOOR_LABELS } from "@/lib/labels";
import { CONTACT_CONSENT_TEXT, depotContent as c } from "@/lib/content/depot";
import { PHONE_COUNTRIES } from "@/lib/depot/phone";
import { MAX_PIECES, depotSchema, pickupStepSchema, pieceSchema, sellerStepSchema } from "@/lib/validation/depot";

const DRAFT_KEY = "remarq-depot-brouillon-v2";
export const SELLER_KEY = "remarq-depot-vendeur-v2";

/** Deux photos compressées et envoyées à la fois : évite de saturer un téléphone. */
const uploadQueue = createLimiter(2);

type Draft = { seller: SellerState; pickup: PickupState; pieces: Omit<PieceState, "photos">[] };

const piecePayload = (p: PieceState) => ({
  brand: p.brand,
  model: p.model,
  itemType: p.itemType || undefined,
  quantity: p.quantity === "" ? undefined : Number(p.quantity),
  description: p.description,
  conditionScore: p.conditionScore,
  conditionDetails: p.conditionDetails,
  photos: p.photos.filter((ph) => ph.status === "done").map((ph) => ({ path: ph.path!, thumbPath: ph.thumbPath!, slot: ph.slot })),
});

const pickupPayload = (p: PickupState, certified: boolean) => ({
  ...p,
  floor: p.floor || null,
  hasElevator: p.hasElevator === "" ? null : p.hasElevator === "yes",
  certified,
});

/** Chemin Zod (« seller.phone », « pieces.0.brand ») → clé d'erreur du formulaire. */
function errorKey(path: PropertyKey[]): string {
  const [head, ...rest] = path.map(String);
  if (head === "seller" || head === "pickup") return rest[0] ?? head;
  return [head, ...rest.slice(0, 2)].join(".");
}

/** Étapes : 1 pièces, 2 enlèvement, 3 coordonnées. */
function stepOfError(key: string): number {
  if (key.startsWith("pieces")) return 1;
  if (["street", "postalCode", "city", "floor", "hasElevator", "accessNotes", "certified"].includes(key)) return 2;
  return 3;
}

export function DepotForm({ brands, source = null }: { brands: { id: string; name: string }[]; source?: string | null }) {
  const router = useRouter();
  const brandListId = useId();
  const [submissionId] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState(1);
  const [seller, setSeller] = useState<SellerState>(EMPTY_SELLER);
  const [pieces, setPieces] = useState<PieceState[]>(() => [emptyPiece()]);
  const [pickup, setPickup] = useState<PickupState>(EMPTY_PICKUP);
  const [certified, setCertified] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasInteracted = useRef(false);

  // ------------------------------------------------------------ brouillon
  useEffect(() => {
    try {
      const draft: Draft | null = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
      const previous: Partial<Pick<Draft, "seller" | "pickup">> | null = JSON.parse(sessionStorage.getItem(SELLER_KEY) ?? "null");
      if (draft) {
        setSeller({ ...EMPTY_SELLER, ...draft.seller });
        setPickup({ ...EMPTY_PICKUP, ...draft.pickup });
        // Les photos ne sont pas gardées : on reprend à l'étape des pièces (la première).
        if (draft.pieces?.length) setPieces(draft.pieces.slice(0, MAX_PIECES).map((p) => ({ ...emptyPiece(), ...p, photos: [] })));
      } else if (previous) {
        setSeller({ ...EMPTY_SELLER, ...previous.seller });
        setPickup({ ...EMPTY_PICKUP, ...previous.pickup });
      }
    } catch {
      // stockage indisponible : formulaire vide
    }
    setDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;
    const t = setTimeout(() => {
      try {
        const draft: Draft = { seller, pickup, pieces: pieces.map(({ photos: _photos, ...rest }) => rest) };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [seller, pickup, pieces, draftLoaded]);

  const clearError = (key: string) => {
    if (errors[key]) setErrors(({ [key]: _removed, ...rest }) => rest);
  };

  // ------------------------------------------------------------ pièces et photos
  const updatePiece = (key: string, patch: Partial<PieceState>) => {
    setPieces((list) => list.map((p) => (p.key === key ? { ...p, ...patch } : p)));
    const index = pieces.findIndex((p) => p.key === key);
    Object.keys(patch).forEach((k) => clearError(`pieces.${index}.${k}`));
  };

  const updatePhoto = useCallback((pieceKey: string, photoKey: string, patch: Partial<PhotoItem>) => {
    setPieces((list) =>
      list.map((p) => (p.key === pieceKey ? { ...p, photos: p.photos.map((ph) => (ph.key === photoKey ? { ...ph, ...patch } : ph)) } : p)),
    );
  }, []);

  const startUpload = useCallback(
    (pieceKey: string, item: PhotoItem) => {
      updatePhoto(pieceKey, item.key, { status: "uploading", progress: 0, error: undefined });
      uploadQueue(() => uploadDepotImage(item.file, submissionId, (progress) => updatePhoto(pieceKey, item.key, { progress })))
        .then(({ path, thumbPath }) => updatePhoto(pieceKey, item.key, { status: "done", progress: 1, path, thumbPath }))
        .catch((err: Error) => updatePhoto(pieceKey, item.key, { status: "error", error: err.message }));
    },
    [submissionId, updatePhoto],
  );

  const addPhotos = (pieceKey: string, index: number, files: File[]) => {
    const items: PhotoItem[] = files.map((file) => ({
      key: crypto.randomUUID(),
      slot: "other",
      file,
      previewUrl: URL.createObjectURL(file),
      status: "uploading",
      progress: 0,
    }));
    setPieces((list) => list.map((p) => (p.key === pieceKey ? { ...p, photos: [...p.photos, ...items] } : p)));
    clearError(`pieces.${index}.photos`);
    items.forEach((item) => startUpload(pieceKey, item));
  };

  const removePhoto = (pieceKey: string, photoKey: string) => {
    setPieces((list) =>
      list.map((p) => {
        if (p.key !== pieceKey) return p;
        const removed = p.photos.find((ph) => ph.key === photoKey);
        if (removed) URL.revokeObjectURL(removed.previewUrl);
        return { ...p, photos: p.photos.filter((ph) => ph.key !== photoKey) };
      }),
    );
  };

  const removePiece = (key: string) => {
    setPieces((list) => {
      list.find((p) => p.key === key)?.photos.forEach((ph) => URL.revokeObjectURL(ph.previewUrl));
      return list.filter((p) => p.key !== key);
    });
    setErrors({});
  };

  const addPiece = () => {
    const piece = emptyPiece();
    setPieces((list) => [...list, piece]);
    requestAnimationFrame(() => document.getElementById(`piece-${pieces.length}-brand`)?.focus());
  };

  // ------------------------------------------------------------ navigation
  const scrollToTop = () => {
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      headingRef.current?.focus({ preventScroll: true });
    });
  };

  const goTo = (n: number) => {
    hasInteracted.current = true;
    setStep(n);
    setFormError(null);
    scrollToTop();
  };

  const fail = (map: Record<string, string>, message: string, target?: number) => {
    setErrors(map);
    setFormError(message);
    if (target && target !== step) setStep(target);
    requestAnimationFrame(() => {
      const first = Object.keys(map)[0];
      const el = first ? document.getElementById(first.startsWith("pieces.") ? `piece-${first.split(".")[1]}-${first.split(".")[2]}` : first) : null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus({ preventScroll: true });
      } else {
        scrollToTop();
      }
    });
  };

  const issuesToMap = (issues: { path: PropertyKey[]; message: string }[], prefix: PropertyKey[] = []) => {
    const map: Record<string, string> = {};
    for (const issue of issues) map[errorKey([...prefix, ...issue.path])] ??= issue.message;
    return map;
  };

  const photosPending = pieces.some((p) => p.photos.some((ph) => ph.status === "uploading"));
  const photosFailed = pieces.some((p) => p.photos.some((ph) => ph.status === "error"));

  const nextFromPieces = () => {
    if (photosPending) return fail({}, "Patientez : des photos sont encore en cours d'envoi.");
    if (photosFailed) {
      const i = pieces.findIndex((p) => p.photos.some((ph) => ph.status === "error"));
      return fail({ [`pieces.${i}.photos`]: "Une photo n'a pas pu être envoyée : réessayez ou retirez-la." }, "Une photo n'a pas pu être envoyée.");
    }
    const map: Record<string, string> = {};
    pieces.forEach((p, i) => {
      const parsed = pieceSchema.safeParse(piecePayload(p));
      if (!parsed.success) Object.assign(map, issuesToMap(parsed.error.issues, ["pieces", i]));
    });
    if (Object.keys(map).length) return fail(map, "Merci de compléter les champs signalés.");
    setErrors({});
    goTo(2);
  };

  const nextFromPickup = () => {
    const parsed = pickupStepSchema.safeParse(pickupPayload(pickup, certified));
    if (!parsed.success) return fail(issuesToMap(parsed.error.issues), "Merci de compléter les champs signalés.");
    setErrors({});
    goTo(3);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) return nextFromPieces();
    if (step === 2) return nextFromPickup();

    const sellerCheck = sellerStepSchema.safeParse(seller);
    if (!sellerCheck.success) return fail(issuesToMap(sellerCheck.error.issues), "Merci de compléter les champs signalés.");

    const parsed = depotSchema.safeParse({
      submissionId,
      source,
      seller,
      pieces: pieces.map(piecePayload),
      pickup: pickupPayload(pickup, certified),
    });
    if (!parsed.success) {
      const map = issuesToMap(parsed.error.issues);
      return fail(map, "Merci de compléter les champs signalés.", stepOfError(Object.keys(map)[0] ?? ""));
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/depot/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const map: Record<string, string> = {};
        for (const issue of body.issues ?? []) map[errorKey(String(issue.path).split("."))] ??= issue.message;
        setSubmitting(false);
        return fail(map, body.error ?? "L'envoi a échoué. Réessayez dans un instant.", stepOfError(Object.keys(map)[0] ?? ""));
      }
      try {
        localStorage.removeItem(DRAFT_KEY);
        sessionStorage.setItem(SELLER_KEY, JSON.stringify({ seller, pickup }));
      } catch {}
      router.push(pieces.length > 1 ? `/depot/merci?pieces=${pieces.length}` : "/depot/merci");
    } catch {
      setSubmitting(false);
      fail({}, "Connexion impossible. Vérifiez votre réseau puis réessayez.");
    }
  };

  // ------------------------------------------------------------ rendu
  const sellerInput = (name: keyof SellerState) => ({
    value: seller[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setSeller((s) => ({ ...s, [name]: e.target.value }));
      clearError(name);
    },
  });
  const pickupInput = (name: keyof PickupState) => ({
    value: pickup[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setPickup((s) => ({ ...s, [name]: e.target.value }));
      clearError(name);
    },
  });

  const titles = [c.pieces.title, c.pickup.title, c.seller.title];
  const intros = [c.pieces.intro, c.pickup.intro, c.seller.intro];

  return (
    <div ref={topRef} className="scroll-mt-4 overflow-hidden rounded-ui border border-line bg-paper">
      <StepHeader step={step} />
      <form onSubmit={onSubmit} noValidate className="space-y-8 p-4 sm:p-6">
        <div className="space-y-2">
          <p className="text-sm text-ink-soft">Étape {step} sur 3</p>
          <h2 ref={headingRef} tabIndex={-1} className="text-2xl outline-none sm:text-3xl">{titles[step - 1]}</h2>
          <p className="text-ink-soft">{intros[step - 1]}</p>
        </div>

        <div aria-live="assertive">
          {formError && (
            <div role="alert" className="rounded-ui border border-danger bg-red-50 p-4 text-sm text-danger">{formError}</div>
          )}
        </div>

        {/* ---------------------------------------------------------- 1 · pièces */}
        {step === 1 && (
          <div className="space-y-5">
            <datalist id={brandListId}>
              {brands.map((b) => <option key={b.id} value={b.name} />)}
              <option value="Inconnu" />
            </datalist>
            {pieces.map((p, i) => (
              <PieceCard
                key={p.key}
                index={i}
                piece={p}
                brandListId={brandListId}
                errors={errors}
                canRemove={pieces.length > 1}
                onChange={(patch) => updatePiece(p.key, patch)}
                onRemove={() => removePiece(p.key)}
                onAddPhotos={(files) => addPhotos(p.key, i, files)}
                onRetryPhoto={(item) => startUpload(p.key, item)}
                onRemovePhoto={(key) => removePhoto(p.key, key)}
              />
            ))}
            {pieces.length < MAX_PIECES && (
              <button type="button" onClick={addPiece} className="flex w-full items-center justify-center gap-2 rounded-ui border border-dashed border-line px-4 py-5 hover:border-ink hover:bg-paper-alt">
                <span aria-hidden className="text-xl leading-none">+</span> {c.pieces.addPiece}
              </button>
            )}
            <p className="text-sm text-ink-soft">{c.pieces.manyPieces}</p>
          </div>
        )}

        {/* ---------------------------------------------------------- 2 · enlèvement */}
        {step === 2 && (
          <div className="space-y-5">
            <Field id="street" label="Adresse" required error={errors.street}>
              <input {...aria("street", errors.street)} autoComplete="street-address" {...pickupInput("street")} />
            </Field>
            <div className="grid grid-cols-[2fr_3fr] gap-5">
              <Field id="postalCode" label="Code postal" required error={errors.postalCode}>
                <input {...aria("postalCode", errors.postalCode)} autoComplete="postal-code" inputMode="numeric" {...pickupInput("postalCode")} />
              </Field>
              <Field id="city" label="Ville" required error={errors.city}>
                <input {...aria("city", errors.city)} autoComplete="address-level2" {...pickupInput("city")} />
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="floor" label="Étage" optional>
                <select {...aria("floor")} {...pickupInput("floor")}>
                  <option value="">Choisir…</option>
                  {Object.entries(FLOOR_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <fieldset>
                <legend className="field-label">Ascenseur <span className="text-ink-muted">(facultatif)</span></legend>
                <div className="flex gap-3">
                  {[["yes", "Oui"], ["no", "Non"]].map(([v, l]) => (
                    <label key={v} className={clsx("flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-ui border px-3 py-2", pickup.hasElevator === v ? "border-ink bg-paper-alt" : "border-line")}>
                      <input type="radio" name="hasElevator" value={v} checked={pickup.hasElevator === v} onChange={pickupInput("hasElevator").onChange} className="accent-ink" />
                      {l}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <Field id="accessNotes" label="Accès difficile ou précisions" optional>
              <textarea {...aria("accessNotes")} rows={3} placeholder={c.pickup.accessPlaceholder} {...pickupInput("accessNotes")} />
            </Field>
            <div>
              <label className={clsx("flex cursor-pointer items-start gap-3 rounded-ui border p-4", errors.certified ? "border-danger" : "border-line")}>
                <input
                  id="certified"
                  type="checkbox"
                  checked={certified}
                  onChange={(e) => {
                    setCertified(e.target.checked);
                    clearError("certified");
                  }}
                  aria-invalid={!!errors.certified || undefined}
                  aria-describedby={errors.certified ? "certified-error" : undefined}
                  className="mt-1 h-5 w-5 shrink-0 accent-ink"
                />
                <span>{CERTIFICATION_TEXT}<Req /></span>
              </label>
              <ErrorText id="certified" error={errors.certified} />
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------- 3 · coordonnées */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="firstName" label="Prénom" required error={errors.firstName}>
                <input {...aria("firstName", errors.firstName)} autoComplete="given-name" {...sellerInput("firstName")} />
              </Field>
              <Field id="lastName" label="Nom" optional>
                <input {...aria("lastName")} autoComplete="family-name" {...sellerInput("lastName")} />
              </Field>
            </div>
            <Field id="email" label="E-mail" required error={errors.email}>
              <input {...aria("email", errors.email)} type="email" inputMode="email" autoComplete="email" placeholder="vous@exemple.fr" {...sellerInput("email")} />
            </Field>
            <div>
              <label htmlFor="phone" className="field-label">Téléphone<Req /></label>
              <div className="flex">
                <label htmlFor="phoneDial" className="sr-only">Indicatif</label>
                <select id="phoneDial" autoComplete="tel-country-code" className="field w-auto shrink-0 rounded-r-none border-r-0 pr-7" {...sellerInput("phoneDial")}>
                  {PHONE_COUNTRIES.map((p) => <option key={p.code} value={p.dial}>{p.flag} {p.dial}</option>)}
                </select>
                <input
                  {...aria("phone", errors.phone, "phone-hint")}
                  type="tel"
                  autoComplete="tel-national"
                  placeholder="6 12 34 56 78"
                  className={clsx("field min-w-0 flex-1 rounded-l-none", errors.phone && "border-danger")}
                  {...sellerInput("phone")}
                />
              </div>
              <p id="phone-hint" className="field-hint">{c.seller.phoneHint}</p>
              <ErrorText id="phone" error={errors.phone} />
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------- actions */}
        <div className="space-y-3">
          <div className="flex gap-3">
            {step > 1 && (
              <button type="button" className="btn-secondary py-4" onClick={() => goTo(step - 1)} disabled={submitting}>
                <span aria-hidden>←</span> Retour
              </button>
            )}
            <button type="submit" className="btn-primary flex-1 py-4" disabled={submitting}>
              {step === 1 && (photosPending ? "Photos en cours d'envoi…" : <>Continuer <span aria-hidden>→</span></>)}
              {step === 2 && <>Continuer <span aria-hidden>→</span></>}
              {step === 3 && (submitting ? "Envoi en cours…" : c.seller.submit)}
            </button>
          </div>
          {step === 3 && (
            <p className="text-sm text-ink-soft">
              {CONTACT_CONSENT_TEXT} <Link href="/confidentialite" className="underline">Confidentialité</Link>
            </p>
          )}
          {draftLoaded && hasInteracted.current && <p className="text-right text-xs text-ink-muted">{c.draftSaved}</p>}
        </div>
      </form>
    </div>
  );
}
