import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { assertProjectAccess, capabilitiesFor, canSeeItem } from "@/lib/permissions";
import { formatDateTime } from "@/lib/dates";
import { FIELD_LABEL, formatOpNumber, labelOf } from "@/lib/constants";
import { Avatar } from "@/components/ui";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const allowed = await assertProjectAccess(user, id);
  if (!allowed) notFound();

  const project = await prisma.project.findUniqueOrThrow({ where: { id } });
  const caps = capabilitiesFor(user, project);
  if (!caps.seeAudit) notFound();

  const events = await prisma.auditEvent.findMany({
    where: { projectId: id },
    include: { user: true, item: true },
    orderBy: { createdAt: "desc" },
  });

  const visible = events.filter((e) => !e.item || canSeeItem(user, e.item));

  return (
    <main className="px-8 py-10">
      <Link href={`/projects/${id}`} className="text-sm text-copper">
        ← zurück zur OPL
      </Link>
      <p className="mt-6 font-mono text-xs tracking-[0.2em] text-copper">{project.code}</p>
      <h1 className="font-display text-5xl tracking-tight">Protokoll</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Vollständige Änderungshistorie: wer hat welches Feld wann von welchem Wert auf welchen Wert gesetzt.
        Das ist der Ersatz für „letzte Speicherung“ in Excel.
      </p>

      <ol className="relative mt-10 max-w-3xl border-l border-line pl-8">
        {visible.map((e) => (
          <li key={e.id} className="relative mb-8">
            <span className="absolute -left-[37px] top-1 h-3 w-3 rounded-full bg-copper" />
            <div className="flex items-start gap-3">
              <Avatar person={e.user} size="sm" />
              <div>
                <p className="text-sm font-medium">{e.summary}</p>
                <p className="text-xs text-muted">
                  {e.user.name} · {e.user.organization} · {formatDateTime(e.createdAt.toISOString())}
                  {e.item ? ` · ${formatOpNumber(e.item.number)}` : ""}
                </p>
                {e.field ? (
                  <p className="mt-2 rounded-lg bg-paper px-3 py-2 font-mono text-xs">
                    {FIELD_LABEL[e.field] ?? e.field}: {labelOf(e.field, e.oldValue)} → {labelOf(e.field, e.newValue)}
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
