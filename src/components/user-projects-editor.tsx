"use client";

import { useState, useTransition } from "react";
import {
  assignUserToProject,
  removeUserFromProject,
  updateMemberRole,
} from "@/app/actions/admin";
import { defaultProjectRole, PROJECT_ROLE_META, rolesForUserKind, type ProjectRole } from "@/lib/roles";

export function UserProjectsEditor({
  userId,
  userRole,
  assignments,
  available,
}: {
  userId: string;
  userRole: string;
  assignments: { projectId: string; code: string; name: string; customerName: string; role: string }[];
  available: { id: string; code: string; name: string; customerName: string }[];
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const options = rolesForUserKind(userRole);
  const [projectId, setProjectId] = useState(available[0]?.id ?? "");
  const [role, setRole] = useState<ProjectRole>(defaultProjectRole(userRole));

  function run(fn: () => Promise<unknown>) {
    setError(null);
    start(async () => {
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Aktion fehlgeschlagen.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-sm border border-line bg-raised">
        <table className="w-full text-sm">
          <thead className="bg-sidebar text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            <tr>
              <th className="px-4 py-3 text-left">Projekt</th>
              <th className="px-4 py-3 text-left">Kunde</th>
              <th className="px-4 py-3 text-left">Rolle</th>
              <th className="px-4 py-3 text-right"> </th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a, index) => (
              <tr
                key={a.projectId}
                className={`border-t border-line ${index % 2 === 1 ? "bg-sidebar/80" : "bg-raised"}`}
              >
                <td className="px-4 py-3">
                  <p className="font-medium">{a.name}</p>
                  <p className="font-mono text-xs text-brand">{a.code}</p>
                </td>
                <td className="px-4 py-3 text-muted">{a.customerName}</td>
                <td className="px-4 py-3">
                  <select
                    className="field w-auto py-1.5"
                    value={a.role}
                    disabled={pending}
                    onChange={(e) =>
                      run(() =>
                        updateMemberRole({
                          projectId: a.projectId,
                          userId,
                          role: e.target.value,
                        }),
                      )
                    }
                  >
                    {options.map((r) => (
                      <option key={r} value={r}>
                        {PROJECT_ROLE_META[r].label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="btn text-danger"
                    disabled={pending}
                    onClick={() =>
                      run(() => removeUserFromProject({ projectId: a.projectId, userId }))
                    }
                  >
                    Entfernen
                  </button>
                </td>
              </tr>
            ))}
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-sm text-muted">
                  Diese Person ist keinem Projekt zugeordnet und sieht deshalb keine OPL.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {available.length > 0 ? (
        <form
          className="flex flex-wrap items-end gap-2 rounded-sm border border-line bg-raised p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!projectId) return;
            run(async () => {
              await assignUserToProject({ userId, projectId, role });
              const next = available.find((p) => p.id !== projectId);
              setProjectId(next?.id ?? "");
            });
          }}
        >
          <label className="min-w-[220px] flex-1">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted">
              Projekt
            </span>
            <select className="field" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.name} ({p.customerName})
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-[220px] flex-1">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted">
              Rolle
            </span>
            <select
              className="field"
              value={role}
              onChange={(e) => setRole(e.target.value as ProjectRole)}
            >
              {options.map((r) => (
                <option key={r} value={r}>
                  {PROJECT_ROLE_META[r].label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-primary h-10" disabled={pending || !projectId}>
            Zuordnen
          </button>
        </form>
      ) : (
        <p className="text-sm text-muted">Keine weiteren Projekte verfügbar.</p>
      )}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
