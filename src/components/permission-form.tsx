"use client";

import { useState, useTransition } from "react";
import { updateProjectPermissions } from "@/app/actions/items";
import type { ClientProject } from "@/lib/serialize";

const FLAGS: { key: keyof Flags; label: string; help: string }[] = [
  { key: "customerCanCreate", label: "Punkte anlegen", help: "Kunde darf neue offene Punkte erfassen." },
  { key: "customerCanEdit", label: "Felder bearbeiten", help: "Kunde darf Beschreibung, Maßnahme, Termin und Verantwortliche ändern." },
  { key: "customerCanComment", label: "Kommentieren", help: "Kunde darf den Verlauf ergänzen (keine internen Notizen)." },
  { key: "customerCanChangeStatus", label: "Status ziehen", help: "Kunde darf Karten auf der Tafel verschieben und den Status setzen." },
  { key: "customerCanSeeAudit", label: "Protokoll einsehen", help: "Kunde sieht die vollständige Änderungshistorie der geteilten Punkte." },
  { key: "customerCanExport", label: "Excel exportieren", help: "Kunde darf die OPL im Vorlagenformat V5.0 herunterladen." },
  {
    key: "customerCanSeeInternalOwners",
    label: "Interne Namen sehen",
    help: "Kunde sieht, welche Person intern verantwortlich ist — sonst nur „Internes Team“.",
  },
];

type Flags = {
  customerCanCreate: boolean;
  customerCanEdit: boolean;
  customerCanComment: boolean;
  customerCanChangeStatus: boolean;
  customerCanSeeAudit: boolean;
  customerCanExport: boolean;
  customerCanSeeInternalOwners: boolean;
};

export function PermissionForm({ project }: { project: ClientProject }) {
  const [flags, setFlags] = useState<Flags>({
    customerCanCreate: project.customerCanCreate,
    customerCanEdit: project.customerCanEdit,
    customerCanComment: project.customerCanComment,
    customerCanChangeStatus: project.customerCanChangeStatus,
    customerCanSeeAudit: project.customerCanSeeAudit,
    customerCanExport: project.customerCanExport,
    customerCanSeeInternalOwners: project.customerCanSeeInternalOwners,
  });
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="mt-8 max-w-2xl space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          await updateProjectPermissions(project.id, flags);
          setSaved(true);
        });
      }}
    >
      {FLAGS.map((f) => (
        <label
          key={f.key}
          className="flex cursor-pointer items-start gap-4 rounded-2xl border border-line bg-raised p-4"
        >
          <input
            type="checkbox"
            className="mt-1"
            checked={flags[f.key]}
            onChange={(e) => setFlags((prev) => ({ ...prev, [f.key]: e.target.checked }))}
          />
          <span>
            <span className="block font-medium">{f.label}</span>
            <span className="text-sm text-muted">{f.help}</span>
          </span>
        </label>
      ))}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-copper"
      >
        {pending ? "Speichern…" : "Kundenrechte speichern"}
      </button>
      {saved ? <p className="text-sm text-ok">Gespeichert und protokolliert.</p> : null}
    </form>
  );
}
