import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isAdmin, isInternal } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await prisma.project.findMany({
    where: isAdmin(user) ? undefined : { members: { some: { userId: user.id } } },
    include: {
      items: { select: { status: true, visibility: true, dueDate: true } },
      members: { include: { user: true } },
    },
    orderBy: { code: "asc" },
  });

  return (
    <main className="px-8 py-6">
      <PageHeader
        title="Projekte"
        count={`${projects.length} Datensätze`}
        description="Jedes Kundenprojekt führt eine eigene Offene-Punkte-Liste nach Vorlage V5.0 — digital, mit Lagebild statt Zeilenchaos."
      />
      <div className="overflow-x-auto rounded-sm border border-line bg-raised">
        <table className="w-full text-sm">
          <thead className="bg-sidebar text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Projekt</th>
              <th className="px-4 py-3 text-left">Kunde</th>
              <th className="px-4 py-3 text-left">Standort</th>
              <th className="px-4 py-3 text-right">Aktive Punkte</th>
              <th className="px-4 py-3 text-right">Beteiligte</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p, index) => {
              const items = isInternal(user) ? p.items : p.items.filter((i) => i.visibility === "SHARED");
              const open = items.filter((i) => i.status !== "GELOEST" && i.status !== "VERWORFEN").length;
              return (
                <tr
                  key={p.id}
                  className={`border-t border-line ${index % 2 === 1 ? "bg-sidebar/80" : "bg-raised"}`}
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium text-brand">{p.code}</td>
                  <td className="px-4 py-3">
                    <Link href={`/projects/${p.id}`} className="font-medium text-ink hover:text-brand hover:underline">
                      {p.name}
                    </Link>
                    <p className="mt-0.5 max-w-md text-xs text-muted">{p.description}</p>
                  </td>
                  <td className="px-4 py-3">{p.customerName}</td>
                  <td className="px-4 py-3 text-muted">{p.site || "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-navy">{open}</td>
                  <td className="px-4 py-3 text-right text-muted">{p.members.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
