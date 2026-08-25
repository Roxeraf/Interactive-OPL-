import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isAdmin, isInternal } from "@/lib/permissions";
import { formatDateTime, isOverdue } from "@/lib/dates";
import { formatOpNumber } from "@/lib/constants";
import { StatusBadge } from "@/components/ui";
import { PageHeader } from "@/components/page-header";

export default async function DashboardPage() {
  const user = await requireUser();
  const memberFilter = isAdmin(user)
    ? {}
    : { members: { some: { userId: user.id } } };

  const projects = await prisma.project.findMany({
    where: memberFilter,
    include: {
      items: {
        include: { ownerInternal: true, ownerCustomer: true },
        orderBy: { updatedAt: "desc" },
      },
    },
    orderBy: { code: "asc" },
  });

  const visible = projects.map((p) => ({
    ...p,
    items: isInternal(user) ? p.items : p.items.filter((i) => i.visibility === "SHARED"),
  }));

  const allItems = visible.flatMap((p) => p.items.map((i) => ({ ...i, project: p })));
  const open = allItems.filter((i) => i.status !== "GELOEST" && i.status !== "VERWORFEN");
  const overdue = open.filter((i) => isOverdue(i.dueDate?.toISOString() ?? null, i.status));
  const mine = open.filter((i) => i.ownerInternalId === user.id || i.ownerCustomerId === user.id);
  const waiting = open.filter((i) =>
    user.role === "CUSTOMER" ? i.status === "WARTE_KUNDE" : i.status === "WARTE_INTERN",
  );

  const audits = await prisma.auditEvent.findMany({
    where: isInternal(user)
      ? { projectId: { in: visible.map((p) => p.id) } }
      : {
          projectId: {
            in: visible.filter((p) => p.customerCanSeeAudit).map((p) => p.id),
          },
          OR: [{ itemId: null }, { item: { visibility: "SHARED" } }],
        },
    include: { user: true, item: true, project: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const greeting =
    new Date().getHours() < 12 ? "Guten Morgen" : new Date().getHours() < 18 ? "Guten Tag" : "Guten Abend";

  return (
    <main className="px-8 py-6">
      <PageHeader
        title="Lage"
        count={`${open.length} aktive Punkte`}
        description={`${greeting}, ${user.name.split(" ")[0]}. ${
          user.role === "CUSTOMER"
            ? "Sie sehen die mit Ihnen geteilten offenen Punkte. Interne Notizen und verdeckte Punkte bleiben beim Lieferanten."
            : "Die OPL ersetzt das Excel: ein Register, ein Protokoll, klare Kundenrechte."
        }`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashKpi n={open.length} l="Offen in der Lage" />
        <DashKpi n={overdue.length} l="Überfällig" hot={overdue.length > 0} />
        <DashKpi n={mine.length} l="In Ihrer Verantwortung" />
        <DashKpi n={waiting.length} l={user.role === "CUSTOMER" ? "Warten auf Sie" : "Warten intern"} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-sm border border-line bg-raised">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="text-sm font-semibold">Meine Punkte</h2>
            <Link href="/projects" className="text-sm font-medium text-brand hover:underline">
              Alle Projekte
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {mine.slice(0, 7).map((item) => (
              <li key={item.id}>
                <Link
                  href={`/projects/${item.project.id}?item=${item.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-canvas"
                >
                  <span className="w-16 font-mono text-xs font-medium text-brand">
                    {formatOpNumber(item.number)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
                  <StatusBadge status={item.status} />
                </Link>
              </li>
            ))}
            {mine.length === 0 ? (
              <li className="px-5 py-8 text-sm text-muted">Aktuell keine Punkte in Ihrer Verantwortung.</li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-sm border border-line bg-raised">
          <div className="border-b border-line px-5 py-3">
            <h2 className="text-sm font-semibold">Letzte Änderungen</h2>
          </div>
          <ol className="divide-y divide-line">
            {audits.map((a) => (
              <li key={a.id} className="px-5 py-3 text-sm">
                <p className="font-medium">{a.summary}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {a.user.name} · {a.project.code} · {formatDateTime(a.createdAt.toISOString())}
                </p>
              </li>
            ))}
            {audits.length === 0 ? <li className="px-5 py-8 text-sm text-muted">Noch kein Protokoll.</li> : null}
          </ol>
        </section>
      </div>
    </main>
  );
}

function DashKpi({ n, l, hot }: { n: number; l: string; hot?: boolean }) {
  return (
    <div className="rounded-sm border border-line bg-raised px-5 py-4">
      <p className={`text-3xl font-semibold tracking-tight ${hot ? "text-danger" : "text-navy"}`}>{n}</p>
      <p className="mt-1 text-sm text-muted">{l}</p>
    </div>
  );
}
