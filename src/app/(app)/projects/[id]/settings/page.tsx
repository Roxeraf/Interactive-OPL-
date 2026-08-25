import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { assertProjectAccess, capabilitiesFor } from "@/lib/permissions";
import { serializeProject } from "@/lib/serialize";
import { PermissionForm } from "@/components/permission-form";
import { Avatar } from "@/components/ui";
import { ROLE_LABEL, type Role } from "@/lib/constants";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const allowed = await assertProjectAccess(user, id);
  if (!allowed) notFound();
  const project = await prisma.project.findUnique({
    where: { id },
    include: { members: { include: { user: true } } },
  });
  if (!project) notFound();
  const caps = capabilitiesFor(user, project);
  if (!caps.manageProject) notFound();

  return (
    <main className="px-8 py-10">
      <Link href={`/projects/${id}`} className="text-sm text-copper">
        ← zurück zur OPL
      </Link>
      <p className="mt-6 font-mono text-xs tracking-[0.2em] text-copper">{project.code}</p>
      <h1 className="font-display text-5xl tracking-tight">Kundenrechte</h1>
      <p className="mt-3 max-w-xl text-muted">
        Interne Punkte bleiben unsichtbar. Geteilte Punkte folgen den Schaltern unten. Jede Änderung wird im Protokoll festgehalten.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Beteiligte</h2>
        <ul className="mt-4 max-w-xl divide-y divide-line rounded-2xl border border-line bg-raised">
          {project.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar person={m.user} />
              <div>
                <p className="text-sm font-medium">{m.user.name}</p>
                <p className="text-xs text-muted">
                  {ROLE_LABEL[m.user.role as Role] ?? m.user.role} · {m.user.organization}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <PermissionForm project={serializeProject(project)} />
    </main>
  );
}
