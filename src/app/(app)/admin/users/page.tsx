import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { Avatar } from "@/components/ui";
import { ROLE_LABEL, type Role } from "@/lib/constants";

export default async function UsersPage() {
  const user = await requireUser();
  if (!isAdmin(user)) notFound();
  const users = await prisma.user.findMany({
    include: { memberships: { include: { project: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <main className="px-8 py-10">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Administration</p>
      <h1 className="mt-2 font-display text-5xl tracking-tight">Personen</h1>
      <p className="mt-3 max-w-xl text-muted">
        Rollen steuern, was jemand grundsätzlich darf. Die Feinjustierung je Projekt liegt unter Kundenrechte.
      </p>
      <ul className="mt-10 max-w-3xl divide-y divide-line rounded-2xl border border-line bg-raised paper-shadow">
        {users.map((u) => (
          <li key={u.id} className="flex items-start gap-4 px-5 py-4">
            <Avatar person={u} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{u.name}</p>
              <p className="text-sm text-muted">
                {u.email} · {u.title}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wider text-copper">
                {ROLE_LABEL[u.role as Role]}
              </p>
              <p className="mt-2 text-sm text-muted">
                {u.memberships.map((m) => m.project.code).join(" · ") || "Keine Projekte"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
