"use client";

import { useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { addNote, deleteAttachment } from "@/lib/actions/extras";
import { formatDateTime } from "@/lib/format";

export type NoteView = {
  id: string;
  body: string;
  author: string | null;
  createdAt: string;
  attachments: { id: string; filename: string; url: string | null; mime: string | null }[];
};

const MAX_FILE_BYTES = 20 * 1024 * 1024;

function safeName(name: string) {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120);
}

export function NotesSection({ furnitureId, notes }: { furnitureId: string; notes: NoteView[] }) {
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [inputKey, setInputKey] = useState(0);
  const supabase = useMemo(() => createClient(), []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const uploaded = [];
      for (const file of files) {
        if (file.size > MAX_FILE_BYTES) {
          setError(`« ${file.name} » dépasse 20 Mo.`);
          return;
        }
        const path = `meubles/${furnitureId}/${crypto.randomUUID()}-${safeName(file.name)}`;
        const { error: upError } = await supabase.storage.from("attachments").upload(path, file, { contentType: file.type || undefined });
        if (upError) {
          setError(`Échec de l'envoi de « ${file.name} ».`);
          return;
        }
        uploaded.push({ path, filename: file.name, mime: file.type || null, size: file.size });
      }
      const res = await addNote(furnitureId, body, uploaded);
      if (!res.ok) setError(res.error);
      else {
        setBody("");
        setFiles([]);
        setInputKey((k) => k + 1);
      }
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-2">
        <label htmlFor="note-body" className="sr-only">Nouvelle note</label>
        <textarea id="note-body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Ajouter une note interne…" className="field" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-sm">
            <span className="sr-only">Pièces jointes</span>
            <input key={inputKey} type="file" multiple accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} className="text-xs" />
          </label>
          <button type="submit" className="btn-dark btn-sm" disabled={pending || (!body.trim() && !files.length)}>
            {pending ? "Enregistrement…" : "Ajouter la note"}
          </button>
        </div>
        {error && <p role="alert" className="field-error">{error}</p>}
      </form>

      <ol className="space-y-3">
        {notes.map((n) => (
          <li key={n.id} className="rounded-ui bg-paper-alt p-3 text-sm">
            {n.body && <p className="whitespace-pre-line">{n.body}</p>}
            {n.attachments.length > 0 && (
              <ul className="mt-2 space-y-1">
                {n.attachments.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-xs">
                    <span aria-hidden>📎</span>
                    {a.url ? <a href={a.url} target="_blank" rel="noreferrer" className="underline">{a.filename}</a> : a.filename}
                    <button
                      type="button"
                      className="text-ink-muted hover:text-danger"
                      aria-label={`Supprimer ${a.filename}`}
                      onClick={() => {
                        if (confirm(`Supprimer « ${a.filename} » ?`)) startTransition(async () => { await deleteAttachment(a.id); });
                      }}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-1 text-xs text-ink-muted">{formatDateTime(n.createdAt)}{n.author && ` · ${n.author}`}</p>
          </li>
        ))}
        {!notes.length && <li className="text-sm text-ink-muted">Aucune note.</li>}
      </ol>
    </div>
  );
}
