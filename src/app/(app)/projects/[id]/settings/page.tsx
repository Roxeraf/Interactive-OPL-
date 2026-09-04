import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getProjectAccess, isAdmin } from "@/lib/permissions";
import { serializeProject } from "@/lib/serialize";
import { PermissionForm } from "@/components/permission-form";
import { MemberManager } from "@/components/member-manager";
import { ProjectCustomerForm } from "@/components/project-customer-form";
import { PageHeader } from "@/components/page-header";
import { PROJECT_ROLE_META } from "@/lib/roles";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const access = await getProjectAccess(user, id);
  if (!access) notFound();
  if (!access.caps.manageProject && !isAdmin(user)) notFound();

  const project = await prisma.project.findUnique({
    where: { id },
    include: { members: { include: { user: true } }, organization: true },
  });
  if (!project) notFound();

  const [users, customers] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.organization.findMany({ where: { kind: "CUSTOMER" }, orderBy: { name: "asc" } }),
  ]);

  const memberIds = new Set(project.members.map((m) => m.userId));
  const candidates = users.filter((u) => {
    if (memberIds.has(u.id)) return false;
    if (u.role === "CUSTOMER") {
      return Boolean(project.organizationId && u.organizationId === project.organizationId);
    }
    return true;
  });

  return (
    <main className="px-8 py-6">
      <Link href={`/projects/${id}`} className="mb-4 inline-block text-sm font-medium text-brand hover:underline">
        ← zurück zur OPL
      </Link>
      <PageHeader
        title="Zugang und Rollen"
        description={`${project.code} · ${project.name}. Wer darf dieses Projekt sehen, und mit welcher Rolle? Interne Punkte bleiben für Kunden unsichtbar.`}
      />

      <section className="mb-10 max-w-3xl">
        <h2 className="mb-2 text-sm font-semibold">Kunde des Projekts</h2>
        <p className="mb-3 text-sm text-muted">
          Das Kundenunternehmen bestimmt, welche Kundenuser hier zugeordnet werden dürfen.
        </p>
        {isAdmin(user) ? (
          <ProjectCustomerForm
            projectId={project.id}
            organizationId={project.organizationId}
            customers={customers}
          />
        ) : (
          <p className="rounded-sm border border-line bg-raised px-4 py-3 text-sm">
            {project.customerName}
          </p>
        )}
      </section>

      <section className="mb-10 max-w-3xl">
        <h2 className="mb-2 text-sm font-semibold">Beteiligte und Projektrollen</h2>
        <p className="mb-3 text-sm text-muted">
          PureLoX-Rollen steuern, was interne Personen sehen und tun. Kundenrollen gelten nur für
          geteilte Punkte und werden zusätzlich durch die Höchstgrenzen unten begrenzt.
        </p>
        <MemberManager
          projectId={project.id}
          members={project.members.map((m) => ({
            userId: m.userId,
            name: m.user.name,
            email: m.user.email,
            initials: m.user.initials,
            accent: m.user.accent,
            userRole: m.user.role,
            organization: m.user.organization,
            projectRole: m.role,
          }))}
          candidates={candidates.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            organization: u.organization,
          }))}
        />
        <dl className="mt-4 grid gap-2 text-xs text-muted sm:grid-cols-2">
          {Object.values(PROJECT_ROLE_META).map((meta) => (
            <div key={meta.label} className="rounded-sm border border-line bg-raised px-3 py-2">
              <dt className="font-semibold text-ink">{meta.label}</dt>
              <dd className="mt-0.5">{meta.help}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="max-w-2xl">
        <h2 className="mb-2 text-sm font-semibold">Kunden-Höchstgrenzen</h2>
        <p className="mb-3 text-sm text-muted">
          Selbst eine Kunden-Projektleitung kann hier nicht mehr tun, als Sie für diesen Kunden
          freigeben. Interne Punkte und interne Kommentare bleiben immer beim PureLoX-Team.
        </p>
        <PermissionForm project={serializeProject(project)} />
      </section>
    </main>
  );
}
