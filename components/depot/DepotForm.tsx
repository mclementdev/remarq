"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { PhotoTile, type PhotoItem } from "./PhotoTile";
import { uploadDepotImage } from "@/lib/image";
import { CATEGORY_LABELS, CONDITION_LABELS, FLOOR_LABELS, CERTIFICATION_TEXT } from "@/lib/labels";
import { MAX_CERTIFICATES, MAX_PHOTOS, MIN_PHOTOS, depotSchema } from "@/lib/validation/depot";

type Brand = { id: string; name: string };

const OTHER = "__other";
const DRAFT_KEY = "remarq-depot-brouillon";
export const SELLER_KEY = "remarq-depot-vendeur";

const GUIDED_SLOTS = [
  { slot: "front", label: "Face" },
  { slot: "back", label: "Dos" },
  { slot: "side", label: "Profil" },
  { slot: "detail", label: "Détail", hint: "signature / étiquette" },
  { slot: "defect", label: "Défaut", hint: "s'il y en a" },
] as const;

const EMPTY_FIELDS = {
  name: "",
  category: "",
  brand: "",
  brandOther: "",
  designer: "",
  manufactureYear: "",
  description: "",
  widthCm: "",
  depthCm: "",
  heightCm: "",
  materials: "",
  condition: "",
  defects: "",
  purchaseYear: "",
  originalPrice: "",
  desiredPrice: "",
  floor: "",
  hasElevator: "",
  accessNotes: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  street: "",
  postalCode: "",
  city: "",
};
type Fields = typeof EMPTY_FIELDS;
type FieldName = keyof Fields;
const SELLER_FIELDS: FieldName[] = ["firstName", "lastName", "email", "phone", "street", "postalCode", "city", "floor", "hasElevator", "accessNotes"];

/** "1 200,50" → 1200.5 ; vide → null ; invalide → NaN (rejeté par Zod). */
function parseNumber(v: string): number | null {
  const s = v.replace(/\s/g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function newKey() {
  return crypto.randomUUID();
}

export function DepotForm({ brands }: { brands: Brand[] }) {
  const router = useRouter();
  const [submissionId] = useState(() => crypto.randomUUID());
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [certified, setCertified] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [certificates, setCertificates] = useState<PhotoItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Brouillon (champs texte uniquement) + coordonnées d'un dépôt précédent.
  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
      const seller = JSON.parse(sessionStorage.getItem(SELLER_KEY) ?? "null");
      setFields((f) => ({ ...f, ...(seller ?? {}), ...(draft ?? {}) }));
    } catch {
      // stockage indisponible : on part d'un formulaire vide
    }
    setDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(fields));
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [fields, draftLoaded]);

  const set = (name: FieldName) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFields((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(({ [name]: _removed, ...rest }) => rest);
  };

  // ------------------------------------------------------------------ photos
  const startUpload = useCallback(
    (item: PhotoItem, setList: React.Dispatch<React.SetStateAction<PhotoItem[]>>) => {
      const update = (patch: Partial<PhotoItem>) =>
        setList((list) => list.map((p) => (p.key === item.key ? { ...p, ...patch } : p)));
      update({ status: "uploading", progress: 0, error: undefined });
      uploadDepotImage(item.file, submissionId, (progress) => update({ progress }))
        .then(({ path, thumbPath }) => update({ status: "done", progress: 1, path, thumbPath }))
        .catch((err: Error) => update({ status: "error", error: err.message }));
    },
    [submissionId],
  );

  const addPhoto = (slot: PhotoItem["slot"], file: File, kind: "photo" | "certificate" = "photo") => {
    const item: PhotoItem = { key: newKey(), slot, file, previewUrl: URL.createObjectURL(file), status: "uploading", progress: 0 };
    const setList = kind === "photo" ? setPhotos : setCertificates;
    setList((list) => [...list, item]);
    setErrors(({ photos: _p, certificates: _c, ...rest }) => rest);
    startUpload(item, setList);
  };

  const removePhoto = (key: string, kind: "photo" | "certificate" = "photo") => {
    const setList = kind === "photo" ? setPhotos : setCertificates;
    setList((list) => {
      const found = list.find((p) => p.key === key);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return list.filter((p) => p.key !== key);
    });
  };

  const retryPhoto = (item: PhotoItem, kind: "photo" | "certificate" = "photo") =>
    startUpload(item, kind === "photo" ? setPhotos : setCertificates);

  const extraPhotos = photos.filter((p) => p.slot === "other");
  const photoCount = photos.length;
  const canAddPhoto = photoCount < MAX_PHOTOS;
  const uploading = [...photos, ...certificates].some((p) => p.status === "uploading");
  const failed = [...photos, ...certificates].some((p) => p.status === "error");

  // ------------------------------------------------------------------ envoi
  const payload = useMemo(
    () => ({
      submissionId,
      name: fields.name,
      category: fields.category || undefined,
      brandId: fields.brand && fields.brand !== OTHER ? fields.brand : null,
      brandOther: fields.brand === OTHER ? fields.brandOther : null,
      designer: fields.designer,
      manufactureYear: fields.manufactureYear,
      description: fields.description,
      widthCm: parseNumber(fields.widthCm),
      depthCm: parseNumber(fields.depthCm),
      heightCm: parseNumber(fields.heightCm),
      materials: fields.materials,
      condition: fields.condition || undefined,
      defects: fields.defects,
      purchaseYear: fields.purchaseYear,
      originalPrice: parseNumber(fields.originalPrice),
      desiredPrice: parseNumber(fields.desiredPrice),
      floor: fields.floor || null,
      hasElevator: fields.hasElevator === "" ? null : fields.hasElevator === "yes",
      accessNotes: fields.accessNotes,
      firstName: fields.firstName,
      lastName: fields.lastName,
      email: fields.email.trim(),
      phone: fields.phone,
      street: fields.street,
      postalCode: fields.postalCode,
      city: fields.city,
      certified,
      photos: photos.filter((p) => p.status === "done").map((p) => ({ path: p.path!, thumbPath: p.thumbPath!, slot: p.slot })),
      certificates: certificates
        .filter((p) => p.status === "done")
        .map((p) => ({ path: p.path!, thumbPath: p.thumbPath!, slot: "other" as const })),
    }),
    [fields, certified, photos, certificates, submissionId],
  );

  const showErrors = (map: Record<string, string>, message: string) => {
    setErrors(map);
    setFormError(message);
    requestAnimationFrame(() => {
      summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      summaryRef.current?.focus();
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) {
      showErrors({}, "Patientez : des photos sont encore en cours d'envoi.");
      return;
    }
    if (failed) {
      showErrors({ photos: "Une photo n'a pas pu être envoyée : réessayez ou retirez-la." }, "Une photo n'a pas pu être envoyée.");
      return;
    }
    const parsed = depotSchema.safeParse(payload);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        const field = key === "brandId" && fields.brand === OTHER ? "brandOther" : key === "brandId" ? "brand" : key;
        map[field] ??= issue.message;
      }
      if (map.widthCm || map.depthCm || map.heightCm) map.dimensions = "Dimensions invalides (nombres en cm).";
      showErrors(map, "Merci de compléter les champs signalés ci-dessous.");
      return;
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
        for (const issue of body.issues ?? []) map[String(issue.path).split(".")[0]] ??= issue.message;
        showErrors(map, body.error ?? "L'envoi a échoué. Réessayez dans un instant.");
        setSubmitting(false);
        return;
      }
      try {
        localStorage.removeItem(DRAFT_KEY);
        const seller = Object.fromEntries(SELLER_FIELDS.map((k) => [k, fields[k]]));
        sessionStorage.setItem(SELLER_KEY, JSON.stringify(seller));
      } catch {}
      router.push("/depot/merci");
    } catch {
      showErrors({}, "Connexion impossible. Vérifiez votre réseau puis réessayez.");
      setSubmitting(false);
    }
  };

  // ------------------------------------------------------------------ rendu
  const err = (name: string) => errors[name];
  const describedBy = (name: string) => (errors[name] ? `${name}-error` : undefined);
  const ErrorText = ({ name }: { name: string }) =>
    errors[name] ? <p id={`${name}-error`} className="field-error">{errors[name]}</p> : null;
  const Req = () => <span className="text-accent" aria-hidden> *</span>;

  const textInput = (name: FieldName, label: string, opts: { required?: boolean; type?: string; autoComplete?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; placeholder?: string } = {}) => (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
        {opts.required && <Req />}
      </label>
      <input
        id={name}
        name={name}
        type={opts.type ?? "text"}
        autoComplete={opts.autoComplete}
        inputMode={opts.inputMode}
        placeholder={opts.placeholder}
        value={fields[name]}
        onChange={set(name)}
        aria-invalid={!!err(name)}
        aria-describedby={describedBy(name)}
        aria-required={opts.required}
        className={clsx("field", err(name) && "border-danger")}
      />
      <ErrorText name={name} />
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-12">
      <div ref={summaryRef} tabIndex={-1} aria-live="assertive" className="outline-none">
        {formError && (
          <div role="alert" className="rounded-ui border border-danger bg-red-50 p-4 text-sm text-danger">
            {formError}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------- A */}
      <section aria-labelledby="sec-meuble" className="space-y-6">
        <h2 id="sec-meuble" className="text-xl">1. Le meuble</h2>

        <fieldset>
          <legend className="field-label">
            Photos<Req /> <span className="text-ink-muted">({MIN_PHOTOS} minimum, {MAX_PHOTOS} maximum)</span>
          </legend>
          <p className="field-hint mb-3">
            Photographiez le meuble en entier, de face, de dos et de profil, puis un détail de la signature ou de l&apos;étiquette, et les éventuels défauts. Lumière du jour de préférence.
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5" id="photos">
            {GUIDED_SLOTS.map(({ slot, label, ...rest }) => {
              const item = photos.find((p) => p.slot === slot);
              return (
                <PhotoTile
                  key={slot}
                  label={label}
                  hint={"hint" in rest ? rest.hint : undefined}
                  item={item}
                  disabled={!item && !canAddPhoto}
                  onSelect={(f) => addPhoto(slot, f)}
                  onRetry={() => item && retryPhoto(item)}
                  onRemove={() => item && removePhoto(item.key)}
                />
              );
            })}
            {extraPhotos.map((item, i) => (
              <PhotoTile
                key={item.key}
                label={`Photo ${i + 1}`}
                item={item}
                onSelect={() => {}}
                onRetry={() => retryPhoto(item)}
                onRemove={() => removePhoto(item.key)}
              />
            ))}
            {canAddPhoto && (
              <PhotoTile label="Ajouter une photo" onSelect={(f) => addPhoto("other", f)} onRetry={() => {}} onRemove={() => {}} />
            )}
          </div>
          <p className={clsx("mt-3 text-sm", photoCount < MIN_PHOTOS ? "text-ink-soft" : "text-success")} aria-live="polite">
            {photoCount} / {MAX_PHOTOS} photo{photoCount > 1 ? "s" : ""}
            {photoCount < MIN_PHOTOS && ` — encore ${MIN_PHOTOS - photoCount} minimum`}
          </p>
          <ErrorText name="photos" />
        </fieldset>

        {textInput("name", "Nom / modèle du meuble", { required: true, placeholder: "ex. Fauteuil Safari" })}

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="field-label">Catégorie<Req /></label>
            <select id="category" value={fields.category} onChange={set("category")} aria-invalid={!!err("category")} aria-describedby={describedBy("category")} className={clsx("field", err("category") && "border-danger")}>
              <option value="">Choisir…</option>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <ErrorText name="category" />
          </div>
          <div>
            <label htmlFor="brand" className="field-label">Marque<Req /></label>
            <select id="brand" value={fields.brand} onChange={set("brand")} aria-invalid={!!err("brand")} aria-describedby={describedBy("brand")} className={clsx("field", err("brand") && "border-danger")}>
              <option value="">Choisir…</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              <option value={OTHER}>Autre (préciser)</option>
            </select>
            <ErrorText name="brand" />
          </div>
        </div>
        {fields.brand === OTHER && textInput("brandOther", "Précisez la marque", { required: true })}

        <div className="grid gap-6 sm:grid-cols-2">
          {textInput("designer", "Designer")}
          {textInput("manufactureYear", "Année approximative de fabrication", { placeholder: "ex. 1970" })}
        </div>

        <div>
          <label htmlFor="description" className="field-label">Description rapide<Req /></label>
          <textarea id="description" rows={4} value={fields.description} onChange={set("description")} aria-invalid={!!err("description")} aria-describedby={describedBy("description")} className={clsx("field", err("description") && "border-danger")} />
          <ErrorText name="description" />
        </div>

        <fieldset>
          <legend className="field-label">Dimensions en cm</legend>
          <div className="grid grid-cols-3 gap-3">
            {(["widthCm", "depthCm", "heightCm"] as const).map((n, i) => (
              <div key={n}>
                <label htmlFor={n} className="mb-1 block text-xs text-ink-soft">{["Largeur", "Profondeur", "Hauteur"][i]}</label>
                <input id={n} inputMode="decimal" value={fields[n]} onChange={set(n)} aria-invalid={!!err(n)} className={clsx("field", err(n) && "border-danger")} />
              </div>
            ))}
          </div>
          <ErrorText name="dimensions" />
        </fieldset>

        {textInput("materials", "Matières / couleur", { placeholder: "ex. cuir blanc, structure chrome" })}

        <div>
          <label htmlFor="condition" className="field-label">État<Req /></label>
          <select id="condition" value={fields.condition} onChange={set("condition")} aria-invalid={!!err("condition")} aria-describedby={describedBy("condition")} className={clsx("field", err("condition") && "border-danger")}>
            <option value="">Choisir…</option>
            {Object.entries(CONDITION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <ErrorText name="condition" />
        </div>

        <div>
          <label htmlFor="defects" className="field-label">Défauts éventuels (précisions)</label>
          <textarea id="defects" rows={3} value={fields.defects} onChange={set("defects")} className="field" />
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {textInput("purchaseYear", "Année d'achat", { inputMode: "numeric" })}
          {textInput("originalPrice", "Prix payé à l'origine (€)", { inputMode: "decimal" })}
          {textInput("desiredPrice", "Prix souhaité (€)", { inputMode: "decimal" })}
        </div>
        <p className="field-hint -mt-4">Les prix sont facultatifs : nous vous ferons ensuite nos propositions.</p>

        <fieldset>
          <legend className="field-label">Certificat d&apos;authenticité <span className="text-ink-muted">(facultatif, 1 à {MAX_CERTIFICATES} images)</span></legend>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {certificates.map((item, i) => (
              <PhotoTile key={item.key} label={`Certificat ${i + 1}`} item={item} onSelect={() => {}} onRetry={() => retryPhoto(item, "certificate")} onRemove={() => removePhoto(item.key, "certificate")} />
            ))}
            {certificates.length < MAX_CERTIFICATES && (
              <PhotoTile label="Certificat" onSelect={(f) => addPhoto("other", f, "certificate")} onRetry={() => {}} onRemove={() => {}} />
            )}
          </div>
          <ErrorText name="certificates" />
        </fieldset>
      </section>

      {/* ---------------------------------------------------------- B */}
      <section aria-labelledby="sec-enlevement" className="space-y-6">
        <h2 id="sec-enlevement" className="text-xl">2. Enlèvement</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="floor" className="field-label">Étage</label>
            <select id="floor" value={fields.floor} onChange={set("floor")} className="field">
              <option value="">Choisir…</option>
              {Object.entries(FLOOR_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <fieldset>
            <legend className="field-label">Ascenseur</legend>
            <div className="flex gap-3">
              {[["yes", "Oui"], ["no", "Non"]].map(([v, l]) => (
                <label key={v} className={clsx("flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-ui border px-3 py-2", fields.hasElevator === v ? "border-ink bg-paper-alt" : "border-line")}>
                  <input type="radio" name="hasElevator" value={v} checked={fields.hasElevator === v} onChange={set("hasElevator")} className="accent-ink" />
                  {l}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div>
          <label htmlFor="accessNotes" className="field-label">Accès difficile ou précisions</label>
          <textarea id="accessNotes" rows={3} value={fields.accessNotes} onChange={set("accessNotes")} placeholder="ex. escalier étroit, code d'accès, stationnement…" className="field" />
        </div>
      </section>

      {/* ---------------------------------------------------------- C */}
      <section aria-labelledby="sec-coordonnees" className="space-y-6">
        <h2 id="sec-coordonnees" className="text-xl">3. Vos coordonnées</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {textInput("firstName", "Prénom", { required: true, autoComplete: "given-name" })}
          {textInput("lastName", "Nom", { required: true, autoComplete: "family-name" })}
          {textInput("email", "E-mail", { required: true, type: "email", autoComplete: "email" })}
          {textInput("phone", "Téléphone", { required: true, type: "tel", autoComplete: "tel" })}
        </div>
        {textInput("street", "Adresse (rue)", { required: true, autoComplete: "street-address" })}
        <div className="grid grid-cols-[2fr_3fr] gap-6">
          {textInput("postalCode", "Code postal", { required: true, autoComplete: "postal-code", inputMode: "numeric" })}
          {textInput("city", "Ville", { required: true, autoComplete: "address-level2" })}
        </div>
      </section>

      {/* ---------------------------------------------------------- D */}
      <section aria-labelledby="sec-certification" className="space-y-4">
        <h2 id="sec-certification" className="text-xl">4. Certification</h2>
        <label className={clsx("flex cursor-pointer items-start gap-3 rounded-ui border p-4", err("certified") ? "border-danger" : "border-line")}>
          <input
            id="certified"
            type="checkbox"
            checked={certified}
            onChange={(e) => {
              setCertified(e.target.checked);
              setErrors(({ certified: _c, ...rest }) => rest);
            }}
            aria-invalid={!!err("certified")}
            aria-describedby={describedBy("certified")}
            className="mt-1 h-5 w-5 shrink-0 accent-ink"
          />
          <span>{CERTIFICATION_TEXT}<Req /></span>
        </label>
        <ErrorText name="certified" />
      </section>

      <div className="space-y-3">
        <button type="submit" className="btn-primary w-full py-4 text-sm" disabled={submitting}>
          {submitting ? "Envoi en cours…" : uploading ? "Photos en cours d'envoi…" : "Envoyer ma demande"}
        </button>
        <p className="text-center text-xs text-ink-muted"><span className="text-accent">*</span> champs obligatoires</p>
      </div>
    </form>
  );
}
