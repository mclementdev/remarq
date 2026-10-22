"use client";

import { useOptimistic, useState, useTransition } from "react";
import clsx from "clsx";
import { addAppointment, deleteAppointment, setAppointmentDone } from "@/lib/actions/extras";
import { APPOINTMENT_TYPE_LABELS, PERIOD_LABELS, type AppointmentType, type Period } from "@/lib/labels";
import { formatLongDate, parisDay } from "@/lib/format";
import type { Appointment } from "@/lib/types";

export function CalendarSection({ furnitureId, appointments }: { furnitureId: string; appointments: Appointment[] }) {
  const [form, setForm] = useState({ type: "seller_pickup", appointment_date: "", period: "", note: "" });
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const today = parisDay();
  const [optimistic, setDone] = useOptimistic(appointments, (list, { id, done }: { id: string; done: boolean }) =>
    list.map((a) => (a.id === id ? { ...a, done } : a)),
  );

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {optimistic.map((a) => (
          <li key={a.id} className={clsx("flex items-start gap-3 rounded-ui border border-line-soft p-3 text-sm", a.done && "opacity-60")}>
            <input
              type="checkbox"
              checked={a.done}
              aria-label="Rendez-vous effectué"
              onChange={(e) => {
                const done = e.target.checked;
                startTransition(async () => {
                  setDone({ id: a.id, done });
                  await setAppointmentDone(a.id, done);
                });
              }}
              className="mt-1 h-4 w-4 accent-ink"
            />
            <div className="flex-1">
              <p className={clsx(a.done && "line-through")}>
                {APPOINTMENT_TYPE_LABELS[a.type as AppointmentType]} — {formatLongDate(a.appointment_date)}, {PERIOD_LABELS[a.period as Period].toLowerCase()}
              </p>
              {a.note && <p className="text-xs text-ink-soft">{a.note}</p>}
              {!a.done && a.appointment_date < today && <p className="text-xs text-danger">Date passée</p>}
            </div>
            <button
              type="button"
              className="text-xs text-ink-muted hover:text-danger"
              aria-label="Supprimer le rendez-vous"
              onClick={() => confirm("Supprimer ce rendez-vous ?") && startTransition(async () => { await deleteAppointment(a.id); })}
            >
              ✕
            </button>
          </li>
        ))}
        {!appointments.length && <li className="text-sm text-ink-muted">Aucun rendez-vous.</li>}
      </ul>

      {adding ? (
        <form
          className="space-y-3 rounded-ui bg-paper-alt p-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            startTransition(async () => {
              const res = await addAppointment(furnitureId, form);
              if (!res.ok) setError(res.error);
              else {
                setAdding(false);
                setForm({ type: "seller_pickup", appointment_date: "", period: "", note: "" });
              }
            });
          }}
        >
          <div>
            <label htmlFor="appt-type" className="field-label">Type</label>
            <select id="appt-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="field">
              {Object.entries(APPOINTMENT_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="appt-date" className="field-label">Date</label>
              <input id="appt-date" type="date" value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} className="field" />
            </div>
            <fieldset>
              <legend className="field-label">Créneau</legend>
              <div className="flex gap-2">
                {Object.entries(PERIOD_LABELS).map(([k, l]) => (
                  <label key={k} className={clsx("flex flex-1 cursor-pointer items-center justify-center rounded-ui border px-2 py-2 text-xs", form.period === k ? "border-ink bg-paper" : "border-line")}>
                    <input type="radio" name="appt-period" value={k} checked={form.period === k} onChange={() => setForm({ ...form, period: k })} className="sr-only" />
                    {l}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div>
            <label htmlFor="appt-note" className="field-label">Note</label>
            <input id="appt-note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="field" />
          </div>
          {error && <p role="alert" className="field-error">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost btn-sm" onClick={() => setAdding(false)}>Annuler</button>
            <button type="submit" className="btn-dark btn-sm" disabled={pending}>Ajouter</button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn-secondary btn-sm" onClick={() => setAdding(true)}>Ajouter un rendez-vous</button>
      )}
    </div>
  );
}
