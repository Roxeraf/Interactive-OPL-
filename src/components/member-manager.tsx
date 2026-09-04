"use client";

import { useState, useTransition } from "react";
import {
  assignUserToProject,
  removeUserFromProject,
  updateMemberRole,
} from "@/app/actions/admin";
import { Avatar, RoleBadge } from "@/components/ui";
import { ROLE_LABEL, type Role } from "@/lib/constants";
import {
  defaultProjectRole,
  PROJECT_ROLE_META,
  rolesForUserKind,
  type ProjectRole,
} from "@/lib/roles";

export type MemberRow = {
  userId: string;
  name: string;
  email: string;
  initials: string;
  accent: string;
  userRole: string;
  organization: string | null;
  projectRole: string;
};

export type Candidate = {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string | null;
};

export function MemberManager({
  projectId,
  members,
  candidates,
}: {
  projectId: string;
  members: MemberRow[];
  candidates: Candidate[];
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState(candidates[0]?.id ?? "");
  const selected = candidates.find((c) => c.id === userId);
  const roleOptions = selected ? rolesForUserKind(selected.role) : [];
  const [role, setRole] = useState<ProjectRole>(
    selected ? defaultProjectRole(selected.role) : "PLX_MEMBER",
  );

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
      <ul className="divide-y divide-line rounded-sm border border-line bg-raised">
        {members.map((m) => {
          const options = rolesForUserKind(m.userRole);
          const meta = PROJECT_ROLE_META[m.projectRole as ProjectRole];
          return (
            <li key={m.userId} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Avatar
                person={{ initials: m.initials, accent: m.accent, name: m.name }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{m.name}</p>
                <p className="text-xs text-muted">
                  {ROLE_LABEL[m.userRole as Role] ?? m.userRole}
                  {m.organization ? ` · ${m.organization}` : ""}
                </p>
              </div>
              <RoleBadge
                label={meta?.short ?? m.projectRole}
                tone={m.userRole === "CUSTOMER" ? "ruby" : "navy"}
              />
              <select
                className="field w-auto py-1.5 text-sm"
                value={m.projectRole}
                disabled={pending}
                onChange={(e) =>
                  run(() =>
                    updateMemberRole({
                      projectId,
                      userId: m.userId,
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
              <button
                type="button"
                className="btn text-danger"
                disabled={pending}
                onClick={() =>
                  run(() => removeUserFromProject({ projectId, userId: m.userId }))
                }
              >
                Entfernen
              </button>
            </li>
          );
        })}
        {members.length === 0 ? (
          <li className="px-4 py-8 text-sm text-muted">Noch keine Beteiligten.</li>
        ) : null}
      </ul>

      {candidates.length > 0 ? (
        <form
          className="flex flex-wrap items-end gap-2 rounded-sm border border-line bg-raised p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!userId) return;
            run(async () => {
              await assignUserToProject({ projectId, userId, role });
              const next = candidates.find((c) => c.id !== userId);
              setUserId(next?.id ?? "");
              if (next) setRole(defaultProjectRole(next.role));
            });
          }}
        >
          <label className="min-w-[220px] flex-1">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted">
              Person hinzufügen
            </span>
            <select
              className="field"
              value={userId}
              onChange={(e) => {
                const next = candidates.find((c) => c.id === e.target.value);
                setUserId(e.target.value);
                if (next) setRole(defaultProjectRole(next.role));
              }}
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {ROLE_LABEL[c.role as Role] ?? c.role}
                  {c.organization ? ` · ${c.organization}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-[220px] flex-1">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted">
              Rolle im Projekt
            </span>
            <select
              className="field"
              value={role}
              onChange={(e) => setRole(e.target.value as ProjectRole)}
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {PROJECT_ROLE_META[r].label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-primary h-10" disabled={pending || !userId}>
            {pending ? "…" : "Zuordnen"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-muted">
          Alle passenden Personen sind bereits zugeordnet. Kundenuser können nur dem eigenen
          Unternehmen zugewiesen werden.
        </p>
      )}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
