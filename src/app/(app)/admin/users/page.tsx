import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { Avatar, RoleBadge } from "@/components/ui";
import { ROLE_LABEL, type Role } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { PROJECT_ROLE_LABEL, type ProjectRole } from "@/lib/roles";
import { UserEditor } from "@/components/user-editor";

export default async function UsersPage() {
  const user = await requireUser();
  if (!isAdmin(user)) notFound();
  const [users, orgs] = await Promise.all([
    prisma.user.findMany({
      include: { memberships: { include: { project: true } }, org: true },
      orderBy: { name: "asc" },
    }),
    prisma.organization.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="px-8 py-6">
      <PageHeader
        title="Personen"
        count={`${users.length} Datensätze`}
        description="Zugehörigkeit (PureLoX oder Kunde) plus Projektrollen steuern, was jemand sieht und darf."
      />

      <div className="mb-10 overflow-x-auto rounded-sm border border-line bg-raised">
        <table className="w-full text-sm">
          <thead className="bg-sidebar text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Zugehörigkeit</th>
              <th className="px-4 py-3 text-left">Unternehmen</th>
              <th className="px-4 py-3 text-left">Projekte und Rollen</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, index) => (
              <tr
                key={u.id}
                className={`border-t border-line ${index % 2 === 1 ? "bg-sidebar/80" : "bg-raised"}`}
              >
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 hover:text-brand">
                    <Avatar person={u} />
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <RoleBadge
                    label={ROLE_LABEL[u.role as Role]}
                    tone={u.role === "CUSTOMER" ? "ruby" : "navy"}
                  />
                  <p className="mt-1 text-xs text-muted">{u.title}</p>
                </td>
                <td className="px-4 py-3 text-muted">{u.org?.name ?? u.organization ?? "—"}</td>
                <td className="px-4 py-3">
                  {u.memberships.length === 0 ? (
                    <span className="text-muted">Keine Projekte</span>
                  ) : (
                    <ul className="space-y-1">
                      {u.memberships.map((m) => (
                        <li key={m.id} className="text-xs">
                          <span className="font-mono text-brand">{m.project.code}</span>
                          {" · "}
                          {PROJECT_ROLE_LABEL[m.role as ProjectRole] ?? m.role}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-sm font-semibold">Neue Person</h2>
      <UserEditor orgs={orgs} />
    </main>
  );
}
