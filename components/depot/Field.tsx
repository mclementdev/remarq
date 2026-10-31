import clsx from "clsx";

export const Req = () => <span className="text-accent" aria-hidden> *</span>;
export const Opt = ({ text = "facultatif" }: { text?: string }) => <span className="text-ink-muted"> ({text})</span>;

/** Props ARIA d'un champ selon son erreur éventuelle. */
export function aria(id: string, error?: string, hintId?: string) {
  const describedBy = [error ? `${id}-error` : null, hintId].filter(Boolean).join(" ") || undefined;
  return { id, "aria-invalid": !!error || undefined, "aria-describedby": describedBy, className: clsx("field", error && "border-danger") };
}

export function ErrorText({ id, error }: { id: string; error?: string }) {
  return error ? <p id={`${id}-error`} className="field-error">{error}</p> : null;
}

/** Libellé + champ + aide + erreur. */
export function Field({ id, label, required, optional, hint, error, children, className }: {
  id: string;
  label: string;
  required?: boolean;
  optional?: string | true;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {required && <Req />}
        {optional && <Opt text={optional === true ? undefined : optional} />}
      </label>
      {children}
      {hint && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
      <ErrorText id={id} error={error} />
    </div>
  );
}
