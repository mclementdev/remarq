"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { ARCHIVE_STATUSES, KANBAN_COLUMNS, STATUS_LABELS, STATUS_SHORT_LABELS, isStatus, type FurnitureStatus } from "@/lib/status";
import { CATEGORY_LABELS } from "@/lib/labels";
import { agingLabel, nonConformCounter } from "@/lib/calc/aging";
import { formatEuro } from "@/lib/format";
import { buildTransitionContext, emailFurniture } from "@/lib/transition-context";
import { ModeBadge } from "@/components/ui/Badges";
import { Thumb } from "@/components/ui/Thumb";
import { TransitionDialog, type TransitionTarget } from "@/components/transitions/TransitionDialog";
import type { AppSettings } from "@/lib/settings";
import type { FurnitureOverview } from "@/lib/types";

export type BoardCard = FurnitureOverview & { thumbUrl: string | null };

type Props = {
  cards: BoardCard[];
  archives: Record<string, { count: number; recent: BoardCard[] }>;
  brands: { id: string; name: string }[];
  settings: AppSettings;
  initialStatus?: string;
};

// ---------------------------------------------------------------------------
function CardBody({ card, settings }: { card: BoardCard; settings: AppSettings }) {
  const counter =
    card.status === "non_conform" && card.non_conform_at ? nonConformCounter(card.non_conform_at, settings.non_conform_delay_days) : null;
  return (
    <div className="flex gap-2.5">
      <Thumb src={card.thumbUrl} alt="" size={52} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium leading-5">
          {(card.quantity ?? 1) > 1 && <span className="mr-1 text-accent">×{card.quantity}</span>}
          {card.name}
        </p>
        <p className="truncate text-xs text-ink-soft">{card.brand_name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <ModeBadge mode={card.mode} />
          {(card.submission_size ?? 0) > 1 && (
            <span className="badge border-line text-ink-soft" title="Pièce d'une demande groupée">
              {card.item_index}/{card.submission_size}
            </span>
          )}
          {card.expected_sale_price !== null && <span className="text-xs">{formatEuro(card.expected_sale_price)}</span>}
        </div>
        <p className={clsx("mt-1 text-[11px]", counter?.expired ? "text-danger" : "text-ink-muted")}>
          {counter ? counter.label : card.status_changed_at && agingLabel(card.status_changed_at)}
        </p>
      </div>
    </div>
  );
}

function DraggableCard({ card, settings }: { card: BoardCard; settings: AppSettings }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id! });
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-roledescription="carte déplaçable"
      aria-label={`${card.name}, ${card.brand_name ?? ""}`}
      data-testid="kanban-card"
      className={clsx(
        "relative cursor-grab touch-none rounded-ui border border-line-soft bg-paper p-2 hover:border-line active:cursor-grabbing",
        isDragging && "opacity-30",
      )}
    >
      <Link href={`/meubles/${card.id}`} className="absolute inset-0 z-0" aria-label={`Ouvrir la fiche ${card.name}`} draggable={false} />
      <div className="pointer-events-none relative">
        <CardBody card={card} settings={settings} />
      </div>
    </li>
  );
}

function Column({ status, cards, settings }: { status: FurnitureStatus; cards: BoardCard[]; settings: AppSettings }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      aria-label={STATUS_LABELS[status]}
      data-status={status}
      className={clsx("flex w-64 shrink-0 flex-col rounded-ui bg-paper-alt", isOver && "ring-2 ring-accent")}
    >
      <header className="flex items-start justify-between gap-2 px-3 pb-2 pt-3">
        <h2 className="text-[11px] font-medium uppercase leading-4 tracking-button" title={STATUS_LABELS[status]}>
          {STATUS_SHORT_LABELS[status]}
        </h2>
        <span className="rounded-badge bg-paper px-1.5 text-xs">{cards.length}</span>
      </header>
      <ul className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {cards.map((c) => <DraggableCard key={c.id} card={c} settings={settings} />)}
      </ul>
    </section>
  );
}

function ArchiveZone({ status, count, recent, open }: { status: FurnitureStatus; count: number; recent: BoardCard[]; open: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div ref={setNodeRef} data-status={status} className={clsx("rounded-ui border border-dashed border-line bg-paper p-2", isOver && "border-accent ring-2 ring-accent")}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs">{STATUS_SHORT_LABELS[status]}</span>
        <span className="rounded-badge bg-paper-alt px-1.5 text-xs">{count}</span>
      </div>
      {open && (
        <ul className="mt-2 space-y-1">
          {recent.map((c) => (
            <li key={c.id} className="truncate text-xs">
              <Link href={`/meubles/${c.id}`} className="hover:underline">{c.name}</Link>
            </li>
          ))}
          {count > recent.length && (
            <li><Link href={`/meubles?statut=${status}`} className="text-xs text-ink-muted underline">Voir les {count}</Link></li>
          )}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
export function Board({ cards: initialCards, archives: initialArchives, brands, settings, initialStatus }: Props) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [archives, setArchives] = useState(initialArchives);
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [mode, setMode] = useState("");
  const [onlyStatus, setOnlyStatus] = useState(initialStatus && isStatus(initialStatus) ? initialStatus : "");
  const [archivesOpen, setArchivesOpen] = useState(!!onlyStatus && ARCHIVE_STATUSES.includes(onlyStatus as FurnitureStatus));
  const [dragging, setDragging] = useState<BoardCard | null>(null);
  const [target, setTarget] = useState<TransitionTarget | null>(null);

  // Synchronise après router.refresh().
  const [prevInitial, setPrevInitial] = useState(initialCards);
  if (prevInitial !== initialCards) {
    setPrevInitial(initialCards);
    setCards(initialCards);
    setArchives(initialArchives);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return cards.filter((c) => {
      if (needle) {
        const hay = [c.name, c.brand_name, c.seller_first_name, c.seller_last_name].join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (brand && c.brand_id !== brand) return false;
      if (category && c.category !== category) return false;
      if (mode === "none" && c.mode) return false;
      if (mode && mode !== "none" && c.mode !== mode) return false;
      return true;
    });
  }, [cards, q, brand, category, mode]);

  const byStatus = useMemo(() => {
    const map = Object.fromEntries(KANBAN_COLUMNS.map((s) => [s, [] as BoardCard[]])) as Record<string, BoardCard[]>;
    for (const c of filtered) if (c.status && map[c.status]) map[c.status].push(c);
    return map;
  }, [filtered]);

  const columns = onlyStatus && KANBAN_COLUMNS.includes(onlyStatus as FurnitureStatus) ? [onlyStatus as FurnitureStatus] : KANBAN_COLUMNS;

  const onDragStart = (e: DragStartEvent) => setDragging(cards.find((c) => c.id === e.active.id) ?? null);
  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const card = cards.find((c) => c.id === e.active.id);
    const to = e.over?.id;
    if (!card || !isStatus(to) || to === card.status) return;
    setTarget({
      furnitureId: card.id!,
      furnitureName: card.name ?? "",
      to,
      ctx: buildTransitionContext(card, settings),
      email: { furniture: emailFurniture(card), brandName: card.brand_name },
    });
  };

  const onChanged = (id: string, to: FurnitureStatus) => {
    const moved = cards.find((c) => c.id === id);
    if (ARCHIVE_STATUSES.includes(to)) {
      setCards((list) => list.filter((c) => c.id !== id));
      setArchives((a) => ({ ...a, [to]: { count: (a[to]?.count ?? 0) + 1, recent: moved ? [moved, ...(a[to]?.recent ?? [])] : a[to]?.recent ?? [] } }));
    } else {
      setCards((list) => list.map((c) => (c.id === id ? { ...c, status: to, status_changed_at: new Date().toISOString() } : c)));
    }
    router.refresh();
  };

  const filtersActive = q || brand || category || mode || onlyStatus;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3" role="search">
        <div className="w-64">
          <label htmlFor="kb-q" className="field-label">Recherche</label>
          <input id="kb-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, marque, vendeur…" className="field" />
        </div>
        <div>
          <label htmlFor="kb-brand" className="field-label">Marque</label>
          <select id="kb-brand" value={brand} onChange={(e) => setBrand(e.target.value)} className="field">
            <option value="">Toutes</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="kb-cat" className="field-label">Catégorie</label>
          <select id="kb-cat" value={category} onChange={(e) => setCategory(e.target.value)} className="field">
            <option value="">Toutes</option>
            {Object.entries(CATEGORY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="kb-mode" className="field-label">Mode</label>
          <select id="kb-mode" value={mode} onChange={(e) => setMode(e.target.value)} className="field">
            <option value="">Tous</option>
            <option value="buyout">Rachat</option>
            <option value="consignment">Dépôt-vente</option>
            <option value="none">Non défini</option>
          </select>
        </div>
        {onlyStatus && (
          <span className="badge mb-2 gap-2 border-accent">
            Statut : {STATUS_SHORT_LABELS[onlyStatus as FurnitureStatus]}
          </span>
        )}
        {filtersActive && (
          <button
            type="button"
            className="btn-ghost btn-sm mb-1"
            onClick={() => {
              setQ(""); setBrand(""); setCategory(""); setMode(""); setOnlyStatus("");
              router.replace("/crm");
            }}
          >
            Tout afficher
          </button>
        )}
      </div>

      <DndContext id="kanban-board" sensors={sensors} collisionDetection={pointerWithin} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
        <div className="flex h-[calc(100dvh-13rem)] min-h-[480px] gap-3 overflow-x-auto pb-2">
          {columns.map((s) => <Column key={s} status={s} cards={byStatus[s] ?? []} settings={settings} />)}

          <aside aria-label="Archives" className={clsx("flex shrink-0 flex-col gap-2 rounded-ui border border-line-soft p-2", archivesOpen ? "w-60" : "w-44")}>
            <button type="button" className="flex items-center justify-between text-[11px] font-medium uppercase tracking-button" onClick={() => setArchivesOpen((o) => !o)} aria-expanded={archivesOpen}>
              Archives
              <span aria-hidden>{archivesOpen ? "−" : "+"}</span>
            </button>
            <div className="flex flex-col gap-2 overflow-y-auto">
              {ARCHIVE_STATUSES.map((s) => (
                <ArchiveZone key={s} status={s} count={archives[s]?.count ?? 0} recent={archives[s]?.recent ?? []} open={archivesOpen} />
              ))}
            </div>
          </aside>
        </div>
        <DragOverlay dropAnimation={null}>
          {dragging && (
            <div className="w-60 rotate-1 rounded-ui border border-ink bg-paper p-2 shadow-lg">
              <CardBody card={dragging} settings={settings} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <TransitionDialog target={target} settings={settings} onClose={() => setTarget(null)} onChanged={onChanged} />
    </div>
  );
}
