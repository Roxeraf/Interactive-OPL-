"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUser, updateUser } from "@/app/actions/admin";
import { ORG_KIND_LABEL, ROLE_LABEL, type Role } from "@/lib/constants";

type Org = { id: string; name: string; kind: string };

export function UserEditor({
  orgs,
  user,
}: {
  orgs: Org[];
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    title: string | null;
    organizationId: string | null;
  };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<Role>((user?.role as Role) ?? "INTERNAL");
  const filteredOrgs = orgs.filter((o) =>
    role === "CUSTOMER" ? o.kind === "CUSTOMER" : o.kind === "PURELOX",
  );

  return (
    <form
      className="max-w-xl space-y-4 rounded-sm border border-line bg-raised p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const payload = {
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          role: String(fd.get("role") ?? ""),
          title: String(fd.get("title") ?? ""),
          organizationId: String(fd.get("organizationId") ?? "") || undefined,
          password: String(fd.get("password") ?? ""),
        };
        setError(null);
        start(async () => {
          try {
            if (user) {
              await updateUser(user.id, {
                ...payload,
                password: payload.password || undefined,
              });
            } else {
              if (!payload.password) throw new Error("Passwort ist Pflicht.");
              const created = await createUser({
                name: payload.name,
                email: payload.email,
                role: payload.role,
                title: payload.title,
                organizationId: payload.organizationId,
                password: payload.password,
              });
              router.push(`/admin/users/${created.id}`);
            }
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
        <input name="name" required defaultValue={user?.name} className="field" />
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted">
          E-Mail
        </span>
        <input name="email" type="email" required defaultValue={user?.email} className="field" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted">
            Zugehörigkeit
          </span>
          <select
            name="role"
            className="field"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted">
            Funktion
          </span>
          <input name="title" defaultValue={user?.title ?? ""} className="field" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted">
          Unternehmen
        </span>
        <select
          name="organizationId"
          className="field"
          defaultValue={user?.organizationId ?? filteredOrgs[0]?.id ?? ""}
          key={role}
        >
          {filteredOrgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} · {ORG_KIND_LABEL[o.kind as "PURELOX" | "CUSTOMER"] ?? o.kind}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted">
          {user ? "Neues Passwort (optional)" : "Passwort"}
        </span>
        <input
          name="password"
          type="password"
          minLength={user ? undefined : 8}
          className="field"
          placeholder={user ? "Unverändert lassen" : "mindestens 8 Zeichen"}
        />
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Speichern…" : user ? "Person speichern" : "Person anlegen"}
      </button>
    </form>
  );
}
