import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { RoleBadge } from "@/components/ui";
import { ORG_KIND_LABEL } from "@/lib/constants";
import { OrganizationEditor } from "@/components/organization-editor";

export default async function CustomersPage() {
  const user = await requireUser();
  if (!isAdmin(user)) notFound();
  const orgs = await prisma.organization.findMany({
    include: {
      users: { select: { id: true } },
      projects: { select: { id: true, code: true, name: true } },
    },
    orderBy: [{ kind: "asc" }, { name: "asc" }],
  });

  return (
    <main className="px-8 py-6">
      <PageHeader
        title="Kunden und Unternehmen"
        count={`${orgs.length} Datensätze`}
        description="Hier legen Sie fest, welches Unternehmen ein Kunde ist und welches PureLoX. Projekte und Kundenuser hängen daran."
      />

      <div className="mb-10 overflow-x-auto rounded-sm border border-line bg-raised">
        <table className="w-full text-sm">
          <thead className="bg-sidebar text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            <tr>
              <th className="px-4 py-3 text-left">Unternehmen</th>
              <th className="px-4 py-3 text-left">Typ</th>
              <th className="px-4 py-3 text-right">Personen</th>
              <th className="px-4 py-3 text-left">Projekte</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((o, index) => (
              <tr
                key={o.id}
                className={`border-t border-line ${index % 2 === 1 ? "bg-sidebar/80" : "bg-raised"}`}
              >
                <td className="px-4 py-3 font-medium">{o.name}</td>
                <td className="px-4 py-3">
                  <RoleBadge
                    label={ORG_KIND_LABEL[o.kind as "PURELOX" | "CUSTOMER"] ?? o.kind}
                    tone={o.kind === "CUSTOMER" ? "ruby" : "navy"}
                  />
                </td>
                <td className="px-4 py-3 text-right">{o.users.length}</td>
                <td className="px-4 py-3 text-muted">
                  {o.projects.length === 0
                    ? "—"
                    : o.projects.map((p) => (
                        <Link
                          key={p.id}
                          href={`/projects/${p.id}/settings`}
                          className="mr-2 font-mono text-xs text-brand hover:underline"
                        >
                          {p.code}
                        </Link>
                      ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-sm font-semibold">Unternehmen anlegen</h2>
      <OrganizationEditor />
    </main>
  );
}
