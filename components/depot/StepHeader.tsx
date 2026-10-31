import clsx from "clsx";
import { depotContent as c } from "@/lib/content/depot";

/** Bandeau de réassurance + progression 1-2-3 du formulaire. */
export function StepHeader({ step }: { step: number }) {
  return (
    <div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 border-b border-line-soft bg-paper-alt px-4 py-3 text-sm sm:px-6">
        {c.trust.map((t) => (
          <li key={t}><span aria-hidden className="text-success">✓</span> {t}</li>
        ))}
      </ul>
      <ol className="grid grid-cols-3 border-b border-line-soft px-2 py-5" aria-label="Étapes du formulaire">
        {c.steps.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const current = n === step;
          return (
            <li key={label} className="relative flex flex-col items-center gap-2 text-center" aria-current={current ? "step" : undefined}>
              {i > 0 && (
                <span aria-hidden className={clsx("absolute right-1/2 top-4 h-px w-full -translate-y-1/2", n <= step ? "bg-ink" : "bg-line")} />
              )}
              <span
                className={clsx(
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-sm",
                  done || current ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink-muted",
                )}
              >
                {done ? "✓" : n}
              </span>
              <span className={clsx("text-xs sm:text-sm", current ? "font-bold text-ink" : "text-ink-soft")}>
                {label}
                {done && <span className="sr-only"> (terminée)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
