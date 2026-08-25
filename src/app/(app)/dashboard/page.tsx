import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isAdmin, isInternal } from "@/lib/permissions";
import { formatDateTime, isOverdue } from "@/lib/dates";
import { formatOpNumber } from "@/lib/constants";
import { StatusBadge } from "@/components/ui";

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
    <main className="draft-grid min-h-screen px-8 py-10">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Lagebild</p>
      <h1 className="mt-2 font-display text-5xl tracking-tight">
        {greeting}, {user.name.split(" ")[0]}.
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        {user.role === "CUSTOMER"
          ? "Sie sehen die mit Ihnen geteilten offenen Punkte. Interne Notizen und verdeckte Punkte bleiben beim Lieferanten."
          : "Die OPL ersetzt das Excel: ein Register, ein Protokoll, klare Kundenrechte."}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashKpi n={open.length} l="Offen in der Lage" />
        <DashKpi n={overdue.length} l="Überfällig" hot={overdue.length > 0} />
        <DashKpi n={mine.length} l="In Ihrer Verantwortung" />
        <DashKpi n={waiting.length} l={user.role === "CUSTOMER" ? "Warten auf Sie" : "Warten intern"} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-line bg-raised p-5 paper-shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl">Meine Punkte</h2>
            <Link href="/projects" className="text-sm text-copper">
              Alle Projekte
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {mine.slice(0, 7).map((item) => (
              <li key={item.id}>
                <Link
                  href={`/projects/${item.project.id}?item=${item.id}`}
                  className="flex items-center gap-3 py-3 hover:bg-paper/80"
                >
                  <span className="w-16 font-mono text-xs text-copper">{formatOpNumber(item.number)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</span>
                  <StatusBadge status={item.status} />
                </Link>
              </li>
            ))}
            {mine.length === 0 ? (
              <li className="py-8 text-sm text-muted">Aktuell keine Punkte in Ihrer Verantwortung.</li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-2xl border border-line bg-raised p-5 paper-shadow">
          <h2 className="mb-4 font-display text-2xl">Letzte Änderungen</h2>
          <ol className="space-y-4">
            {audits.map((a) => (
              <li key={a.id} className="text-sm">
                <p className="font-medium">{a.summary}</p>
                <p className="text-xs text-muted">
                  {a.user.name} · {a.project.code} · {formatDateTime(a.createdAt.toISOString())}
                </p>
              </li>
            ))}
            {audits.length === 0 ? <li className="text-sm text-muted">Noch kein Protokoll.</li> : null}
          </ol>
        </section>
      </div>
    </main>
  );
}

function DashKpi({ n, l, hot }: { n: number; l: string; hot?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-raised px-5 py-4 paper-shadow">
      <p className={`font-display text-4xl ${hot ? "text-copper" : ""}`}>{n}</p>
      <p className="mt-1 text-sm text-muted">{l}</p>
    </div>
  );
}
