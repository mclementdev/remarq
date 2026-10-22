import clsx from "clsx";
import { STATUS_SHORT_LABELS, isArchived, type FurnitureStatus } from "@/lib/status";
import { MODE_LABELS, type Mode } from "@/lib/labels";

export function StatusBadge({ status, className }: { status: FurnitureStatus; className?: string }) {
  return (
    <span
      className={clsx(
        "badge whitespace-nowrap",
        status === "new" && "border-accent bg-accent/10",
        status === "non_conform" && "border-danger text-danger",
        status === "done" && "border-success text-success",
        isArchived(status) && status !== "done" && "border-line text-ink-muted",
        className,
      )}
    >
      {STATUS_SHORT_LABELS[status]}
    </span>
  );
}

export function ModeBadge({ mode }: { mode: Mode | null }) {
  if (!mode) return null;
  return (
    <span className={clsx("badge whitespace-nowrap", mode === "buyout" ? "border-ink bg-ink text-paper" : "border-ink bg-paper")}>
      {MODE_LABELS[mode]}
    </span>
  );
}
