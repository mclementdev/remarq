import { createClient } from "@/lib/supabase/server";
import { signPaths } from "@/lib/storage";
import { getSettings } from "@/lib/settings";
import { ARCHIVE_STATUSES, KANBAN_COLUMNS } from "@/lib/status";
import { Board, type BoardCard } from "@/components/kanban/Board";

export const metadata = { title: "CRM" };

const ARCHIVE_PREVIEW = 15;

export default async function CrmPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const supabase = await createClient();

  const [settings, { data: brands }, { data: active }, ...archiveResults] = await Promise.all([
    getSettings(supabase),
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("furniture_overview").select("*").in("status", KANBAN_COLUMNS).order("status_changed_at", { ascending: true }),
    ...ARCHIVE_STATUSES.map((s) =>
      supabase
        .from("furniture_overview")
        .select("*", { count: "exact" })
        .eq("status", s)
        .order("status_changed_at", { ascending: false })
        .limit(ARCHIVE_PREVIEW),
    ),
  ]);

  const thumbs = await signPaths(supabase, (active ?? []).map((r) => r.thumb_path));
  const withThumb = (r: NonNullable<typeof active>[number]): BoardCard => ({ ...r, thumbUrl: r.thumb_path ? thumbs[r.thumb_path] ?? null : null });
  const archives = Object.fromEntries(
    ARCHIVE_STATUSES.map((s, i) => [
      s,
      { count: archiveResults[i].count ?? 0, recent: (archiveResults[i].data ?? []).map((r) => ({ ...r, thumbUrl: null })) },
    ]),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl">CRM</h1>
      <Board
        key={statut ?? "all"}
        cards={(active ?? []).map(withThumb)}
        archives={archives}
        brands={brands ?? []}
        settings={settings}
        initialStatus={statut}
      />
    </div>
  );
}
