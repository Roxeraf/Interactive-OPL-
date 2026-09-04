"use client";

import { useState, useTransition } from "react";
import { createOrganization, updateOrganization } from "@/app/actions/admin";
import { ORG_KIND_LABEL } from "@/lib/constants";

export function OrganizationEditor({
  org,
}: {
  org?: { id: string; name: string; kind: string };
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="max-w-xl space-y-4 rounded-sm border border-line bg-raised p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const name = String(fd.get("name") ?? "");
        const kind = String(fd.get("kind") ?? "");
        setError(null);
        setSaved(false);
        start(async () => {
          try {
            if (org) await updateOrganization(org.id, { name, kind });
            else await createOrganization({ name, kind });
            setSaved(true);
            if (!org) e.currentTarget.reset();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
          }
        });
      }}
    >
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted">
          Name
        </span>
        <input name="name" required defaultValue={org?.name} className="field" placeholder="Nordwerk AG" />
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted">
          Typ
        </span>
        <select name="kind" className="field" defaultValue={org?.kind ?? "CUSTOMER"}>
          {(["CUSTOMER", "PURELOX"] as const).map((k) => (
            <option key={k} value={k}>
              {ORG_KIND_LABEL[k]}
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {saved ? <p className="text-sm text-ok">Gespeichert.</p> : null}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Speichern…" : org ? "Kunde speichern" : "Kunde anlegen"}
      </button>
    </form>
  );
}
