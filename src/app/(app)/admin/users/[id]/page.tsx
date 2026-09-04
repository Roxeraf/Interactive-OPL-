import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isAdmin, isCustomer } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { UserEditor } from "@/components/user-editor";
import { UserProjectsEditor } from "@/components/user-projects-editor";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requireUser();
  if (!isAdmin(actor)) notFound();

  const [person, orgs, projects] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: { memberships: { include: { project: true } }, org: true },
    }),
    prisma.organization.findMany({ orderBy: { name: "asc" } }),
    prisma.project.findMany({ orderBy: { code: "asc" } }),
  ]);
  if (!person) notFound();

  const assignedIds = new Set(person.memberships.map((m) => m.projectId));
  const available = projects.filter((p) => {
    if (assignedIds.has(p.id)) return false;
    if (isCustomer(person) && p.organizationId && person.organizationId !== p.organizationId) {
      return false;
    }
    return true;
  });

  return (
    <main className="px-8 py-6">
      <Link href="/admin/users" className="mb-4 inline-block text-sm font-medium text-brand hover:underline">
        ← alle Personen
      </Link>
      <PageHeader
        title={person.name}
        description={`${person.email} · ${person.org?.name ?? person.organization ?? "ohne Unternehmen"}`}
      />

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold">Stammdaten</h2>
        <UserEditor
          orgs={orgs}
          user={{
            id: person.id,
            name: person.name,
            email: person.email,
            role: person.role,
            title: person.title,
            organizationId: person.organizationId,
          }}
        />
      </section>

      <section className="max-w-4xl">
        <h2 className="mb-3 text-sm font-semibold">Projekte und Rollen</h2>
        <p className="mb-3 text-sm text-muted">
          Ohne Zuordnung sieht diese Person keine OPL. PureLoX-Personen können mehreren Kundenprojekten
          angehören, Kundenuser nur den Projekten ihres Unternehmens.
        </p>
        <UserProjectsEditor
          userId={person.id}
          userRole={person.role}
          assignments={person.memberships.map((m) => ({
            projectId: m.projectId,
            code: m.project.code,
            name: m.project.name,
            customerName: m.project.customerName,
            role: m.role,
          }))}
          available={available.map((p) => ({
            id: p.id,
            code: p.code,
            name: p.name,
            customerName: p.customerName,
          }))}
        />
      </section>
    </main>
  );
}
