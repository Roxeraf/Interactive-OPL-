import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isAdmin, isInternal } from "@/lib/permissions";

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
    <main className="px-8 py-10">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Projekte</p>
      <h1 className="mt-2 font-display text-5xl tracking-tight">OPL-Register</h1>
      <p className="mt-3 max-w-xl text-muted">
        Jedes Kundenprojekt führt eine eigene Offene-Punkte-Liste nach Vorlage V5.0 — digital, mit Lagebild statt Zeilenchaos.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {projects.map((p) => {
          const items = isInternal(user) ? p.items : p.items.filter((i) => i.visibility === "SHARED");
          const open = items.filter((i) => i.status !== "GELOEST" && i.status !== "VERWORFEN").length;
          return (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="group rounded-2xl border border-line bg-raised p-6 paper-shadow transition hover:border-copper/40"
            >
              <p className="font-mono text-xs tracking-[0.18em] text-copper">{p.code}</p>
              <h2 className="mt-2 font-display text-3xl tracking-tight group-hover:text-copper">{p.name}</h2>
              <p className="mt-1 text-sm text-muted">
                {p.customerName}
                {p.site ? ` · ${p.site}` : ""}
              </p>
              <p className="mt-4 text-sm leading-relaxed">{p.description}</p>
              <div className="mt-6 flex items-end justify-between border-t border-line pt-4">
                <div>
                  <p className="font-display text-3xl">{open}</p>
                  <p className="text-xs uppercase tracking-wider text-muted">aktive Punkte</p>
                </div>
                <p className="text-sm text-muted">{p.members.length} Beteiligte</p>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
