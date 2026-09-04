"use client";

import { useState, useTransition } from "react";
import { updateProjectCustomer } from "@/app/actions/admin";

export function ProjectCustomerForm({
  projectId,
  organizationId,
  customers,
}: {
  projectId: string;
  organizationId: string | null;
  customers: { id: string; name: string }[];
}) {
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (customers.length === 0) {
    return <p className="text-sm text-muted">Legen Sie zuerst ein Kundenunternehmen unter Kunden an.</p>;
  }

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const next = String(fd.get("organizationId") ?? "");
        setError(null);
        setSaved(false);
        start(async () => {
          try {
            await updateProjectCustomer(projectId, next);
            setSaved(true);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
          }
        });
      }}
    >
      <label className="min-w-[240px] flex-1">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted">
          Kundenunternehmen
        </span>
        <select name="organizationId" className="field" defaultValue={organizationId ?? customers[0].id}>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn-primary h-10" disabled={pending}>
        {pending ? "…" : "Kunde setzen"}
      </button>
      {saved ? <p className="text-sm text-ok">Gespeichert.</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </form>
  );
}
