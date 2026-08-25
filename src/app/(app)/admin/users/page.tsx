import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { Avatar } from "@/components/ui";
import { ROLE_LABEL, type Role } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";

export default async function UsersPage() {
  const user = await requireUser();
  if (!isAdmin(user)) notFound();
  const users = await prisma.user.findMany({
    include: { memberships: { include: { project: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <main className="px-8 py-6">
      <PageHeader
        title="Personen"
        count={`${users.length} Datensätze`}
        description="Rollen steuern, was jemand grundsätzlich darf. Die Feinjustierung je Projekt liegt unter Kundenrechte."
      />
      <div className="overflow-x-auto rounded-sm border border-line bg-raised">
        <table className="w-full text-sm">
          <thead className="bg-sidebar text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Rolle</th>
              <th className="px-4 py-3 text-left">Organisation</th>
              <th className="px-4 py-3 text-left">Projekte</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, index) => (
              <tr
                key={u.id}
                className={`border-t border-line ${index % 2 === 1 ? "bg-sidebar/80" : "bg-raised"}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar person={u} />
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p>{ROLE_LABEL[u.role as Role]}</p>
                  <p className="text-xs text-muted">{u.title}</p>
                </td>
                <td className="px-4 py-3 text-muted">{u.organization}</td>
                <td className="px-4 py-3 text-muted">
                  {u.memberships.map((m) => m.project.code).join(" · ") || "Keine Projekte"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
