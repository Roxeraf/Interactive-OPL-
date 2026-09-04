import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getProjectAccess, canSeeItem } from "@/lib/permissions";
import { formatDateTime } from "@/lib/dates";
import { FIELD_LABEL, formatOpNumber, labelOf } from "@/lib/constants";
import { Avatar } from "@/components/ui";
import { PageHeader } from "@/components/page-header";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const access = await getProjectAccess(user, id);
  if (!access) notFound();

  const project = access.project;
  const caps = access.caps;
  if (!caps.seeAudit) notFound();

  const events = await prisma.auditEvent.findMany({
    where: { projectId: id },
    include: { user: true, item: true },
    orderBy: { createdAt: "desc" },
  });

  const visible = events.filter((e) => !e.item || canSeeItem(e.item, caps));

  return (
    <main className="px-8 py-6">
      <Link href={`/projects/${id}`} className="mb-4 inline-block text-sm font-medium text-brand hover:underline">
        ← zurück zur OPL
      </Link>
      <PageHeader
        title="Protokoll"
        count={`${visible.length} Einträge`}
        description={`${project.code} · ${project.name}. Vollständige Änderungshistorie: wer hat welches Feld wann von welchem Wert auf welchen Wert gesetzt.`}
      />

      <ol className="relative max-w-3xl border-l border-line pl-8">
        {visible.map((e) => (
          <li key={e.id} className="relative mb-6">
            <span className="absolute -left-[37px] top-1.5 h-3 w-3 rounded-full bg-brand" />
            <div className="flex items-start gap-3 rounded-sm border border-line bg-raised px-4 py-3">
              <Avatar person={e.user} size="sm" />
              <div>
                <p className="text-sm font-medium">{e.summary}</p>
                <p className="text-xs text-muted">
                  {e.user.name} · {e.user.organization} · {formatDateTime(e.createdAt.toISOString())}
                  {e.item ? ` · ${formatOpNumber(e.item.number)}` : ""}
                </p>
                {e.field ? (
                  <p className="mt-2 rounded-sm bg-canvas px-3 py-2 font-mono text-xs">
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
