"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  PRIORITIES,
  STATUSES,
  STATUS_LABEL,
  VISIBILITIES,
  VISIBILITY_LABEL,
  formatOpNumber,
} from "@/lib/constants";
import { formatDate, formatDateTime, isOverdue } from "@/lib/dates";
import type { ClientItem, Person, WorkspacePayload } from "@/lib/serialize";
import { addComment, createItem, updateItem } from "@/app/actions/items";
import { exportProjectXlsx, importProjectXlsx } from "@/app/actions/excel";
import { Filter, Plus, RefreshCw, Search } from "lucide-react";
import { Avatar, PriorityMark, StatusBadge } from "./ui";

export function OplWorkspace({ payload }: { payload: WorkspacePayload }) {
  const { project, items, members, caps, user } = payload;
  const router = useRouter();
  const [view, setView] = useState<"board" | "list">("board");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [mine, setMine] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (status !== "ALL" && item.status !== status) return false;
      if (priority !== "ALL" && item.priority !== priority) return false;
      if (overdueOnly && !isOverdue(item.dueDate, item.status)) return false;
      if (mine && item.ownerInternal?.id !== user.id && item.ownerCustomer?.id !== user.id) {
        return false;
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = `${formatOpNumber(item.number)} ${item.title} ${item.description} ${item.source}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, status, priority, overdueOnly, mine, query, user.id]);

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const openCount = items.filter((i) => i.status !== "GELOEST" && i.status !== "VERWORFEN").length;
  const overdueCount = items.filter((i) => isOverdue(i.dueDate, i.status)).length;
  const waitCustomer = items.filter((i) => i.status === "WARTE_KUNDE").length;
  const waitIntern = items.filter((i) => i.status === "WARTE_INTERN").length;

  async function onExport() {
    const { filename, base64 } = await exportProjectXlsx(project.id);
    const a = document.createElement("a");
    a.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    a.download = filename;
    a.click();
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <header className="border-b border-line bg-raised px-8 py-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[22px] font-semibold tracking-tight text-ink">{project.name}</h1>
              <span className="text-sm text-muted">{filtered.length} Datensätze</span>
            </div>
            <p className="mt-1 text-sm text-muted">
              <span className="font-mono text-brand">{project.code}</span>
              {" · "}
              {project.customerName}
              {project.site ? ` · ${project.site}` : ""} · Vorlage V5.0
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.refresh()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-muted hover:bg-canvas"
              title="Aktualisieren"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <span className="inline-flex h-9 w-9 items-center justify-center text-muted" title="Filter">
              <Filter className="h-4 w-4" />
            </span>
            <span className="inline-flex h-9 w-9 items-center justify-center text-muted" title="Suche">
              <Search className="h-4 w-4" />
            </span>
            {caps.seeAudit ? (
              <Link href={`/projects/${project.id}/audit`} className="btn">
                Protokoll
              </Link>
            ) : null}
            {caps.manageProject ? (
              <Link href={`/projects/${project.id}/settings`} className="btn">
                Kundenrechte
              </Link>
            ) : null}
            {caps.export ? (
              <button type="button" onClick={onExport} className="btn">
                Excel V5.0
              </button>
            ) : null}
            {caps.create ? (
              <button type="button" onClick={() => setCreating(true)} className="fab" title="Neuer Punkt">
                <Plus className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi label="Aktiv" value={openCount} hint="nicht abgeschlossen" />
          <Kpi label="Überfällig" value={overdueCount} hint="Termin gerissen" accent={overdueCount > 0} />
          <Kpi label="Beim Kunden" value={waitCustomer} hint="Wartet auf Freigabe" />
          <Kpi label="Intern blockiert" value={waitIntern} hint="Wartet auf uns" />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-raised px-8 py-2.5">
        <div className="flex rounded-sm border border-line bg-sidebar p-0.5">
          {(["board", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={clsx(
                "rounded-sm px-3 py-1 text-sm",
                view === v ? "bg-raised font-medium text-navy shadow-sm" : "text-muted",
              )}
            >
              {v === "board" ? "Tafel" : "Register"}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suchen in Punkten, Quelle, Nummer…"
          className="field min-w-[220px] flex-1 py-1.5"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="field w-auto py-1.5"
        >
          <option value="ALL">Alle Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="field w-auto py-1.5"
        >
          <option value="ALL">Alle Prioritäten</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-muted">
          <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} />
          Meine
        </label>
        <label className="flex items-center gap-1.5 text-sm text-muted">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
          />
          Überfällig
        </label>
      </div>

      <div className="flex-1 px-6 py-5">
        {view === "board" ? (
          <BoardView
            items={filtered}
            canDrag={caps.changeStatus}
            onSelect={setSelectedId}
            onStatus={async (id, next) => {
              await updateItem(id, { status: next });
              router.refresh();
            }}
          />
        ) : (
          <ListView items={filtered} onSelect={setSelectedId} />
        )}
      </div>

      {selected ? (
        <ItemDrawer
          key={`${selected.id}-${selected.updatedAt}-${selected.comments.length}`}
          item={selected}
          members={members}
          caps={caps}
          onClose={() => setSelectedId(null)}
          onSaved={() => router.refresh()}
        />
      ) : null}

      {creating ? (
        <CreateDialog
          members={members}
          caps={caps}
          onClose={() => setCreating(false)}
          onCreate={async (data) => {
            const created = await createItem(project.id, data);
            setCreating(false);
            router.refresh();
            setSelectedId(created.id);
          }}
        />
      ) : null}

      {caps.manageProject ? <HiddenImporter projectId={project.id} /> : null}
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-sm border border-line bg-raised px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className={clsx("text-2xl font-semibold tracking-tight text-navy", accent && "text-danger")}>{value}</p>
      <p className="text-xs text-muted">{hint}</p>
    </div>
  );
}

function BoardView({
  items,
  canDrag,
  onSelect,
  onStatus,
}: {
  items: ClientItem[];
  canDrag: boolean;
  onSelect: (id: string) => void;
  onStatus: (id: string, status: string) => Promise<void>;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [, start] = useTransition();

  function handleDragEnd(event: DragEndEvent) {
    const over = event.over?.id ? String(event.over.id) : null;
    const active = String(event.active.id);
    if (!over || !STATUSES.includes(over as (typeof STATUSES)[number])) return;
    const item = items.find((i) => i.id === active);
    if (!item || item.status === over) return;
    start(() => {
      void onStatus(active, over);
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={canDrag ? handleDragEnd : undefined}>
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
        {STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            items={items.filter((i) => i.status === status)}
            canDrag={canDrag}
            onSelect={onSelect}
          />
        ))}
      </div>
    </DndContext>
  );
}

function BoardColumn({
  status,
  items,
  canDrag,
  onSelect,
}: {
  status: string;
  items: ClientItem[];
  canDrag: boolean;
  onSelect: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      className={clsx(
        "flex w-[280px] shrink-0 flex-col rounded-sm border border-line bg-sidebar p-2",
        isOver && "ring-2 ring-brand/40",
      )}
    >
      <header className="mb-2 flex items-center justify-between px-2 py-1">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          {STATUS_LABEL[status as keyof typeof STATUS_LABEL]}
        </h2>
        <span className="font-mono text-xs text-muted">{items.length}</span>
      </header>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <BoardCard key={item.id} item={item} canDrag={canDrag} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

function BoardCard({
  item,
  canDrag,
  onSelect,
}: {
  item: ClientItem;
  canDrag: boolean;
  onSelect: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled: !canDrag,
  });
  const overdue = isOverdue(item.dueDate, item.status);
  return (
    <button
      type="button"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onSelect(item.id)}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={clsx(
        "rounded-sm border border-line bg-raised p-3 text-left",
        isDragging && "opacity-70",
        item.visibility === "INTERNAL" && "border-dashed",
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-medium text-brand">{formatOpNumber(item.number)}</span>
        <PriorityMark priority={item.priority} />
      </div>
      <p className="text-sm font-medium leading-snug">{item.title}</p>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex -space-x-1.5">
          <Avatar person={item.ownerInternal} size="sm" />
          <Avatar person={item.ownerCustomer} size="sm" />
        </div>
        <span className={clsx("text-[11px]", overdue ? "font-semibold text-danger" : "text-muted")}>
          {formatDate(item.dueDate)}
        </span>
      </div>
    </button>
  );
}

function ListView({ items, onSelect }: { items: ClientItem[]; onSelect: (id: string) => void }) {
  return (
    <div className="overflow-x-auto rounded-sm border border-line bg-raised">
      <table className="w-full text-sm">
        <thead className="bg-sidebar text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          <tr>
            <th className="px-4 py-3 text-left">Nr.</th>
            <th className="px-4 py-3 text-left">Offener Punkt</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Prio</th>
            <th className="px-4 py-3 text-left">Verantwortlich</th>
            <th className="px-4 py-3 text-left">Termin</th>
            <th className="px-4 py-3 text-left">Quelle</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const overdue = isOverdue(item.dueDate, item.status);
            return (
              <tr
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={clsx(
                  "cursor-pointer border-t border-line hover:bg-active",
                  index % 2 === 1 ? "bg-sidebar/80" : "bg-raised",
                )}
              >
                <td className="px-4 py-3 font-mono text-xs font-medium text-brand">{formatOpNumber(item.number)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{item.title}</p>
                  {item.visibility === "INTERNAL" ? (
                    <p className="text-[11px] uppercase tracking-wider text-muted">Nur intern</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3">
                  <PriorityMark priority={item.priority} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar person={item.ownerInternal} size="sm" />
                    <span className="max-w-[100px] truncate text-xs">
                      {item.ownerInternal?.name ?? "—"}
                    </span>
                    <Avatar person={item.ownerCustomer} size="sm" />
                  </div>
                </td>
                <td className={clsx("px-4 py-3", overdue && "font-semibold text-danger")}>
                  {formatDate(item.dueDate)}
                </td>
                <td className="px-4 py-3 text-muted">{item.source || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {items.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-muted">Keine Punkte für diesen Filter.</p>
      ) : null}
    </div>
  );
}

function ItemDrawer({
  item,
  members,
  caps,
  onClose,
  onSaved,
}: {
  item: ClientItem;
  members: Person[];
  caps: WorkspacePayload["caps"];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState(item);
  const [comment, setComment] = useState("");
  const [internal, setInternal] = useState(false);
  const [pending, start] = useTransition();

  const intern = members.filter((m) => m.role !== "CUSTOMER");
  const kunden = members.filter((m) => m.role === "CUSTOMER");
  const canEdit = caps.edit;
  const canStatus = caps.changeStatus;

  function set<K extends keyof ClientItem>(key: K, value: ClientItem[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function save() {
    start(async () => {
      await updateItem(item.id, {
        title: draft.title,
        description: draft.description,
        measure: draft.measure,
        resolution: draft.resolution,
        category: draft.category,
        priority: draft.priority,
        status: draft.status,
        visibility: draft.visibility,
        source: draft.source,
        dueDate: draft.dueDate ? draft.dueDate.slice(0, 10) : null,
        ownerInternalId: draft.ownerInternal?.id ?? "",
        ownerCustomerId: draft.ownerCustomer?.id ?? "",
      });
      onSaved();
    });
  }

  function sendComment() {
    start(async () => {
      await addComment(item.id, comment, internal);
      setComment("");
      onSaved();
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-navy/40" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-raised shadow-xl scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-line px-6 py-5">
          <div>
            <p className="font-mono text-xs font-medium tracking-[0.12em] text-brand">{formatOpNumber(item.number)}</p>
            {canEdit ? (
              <input
                value={draft.title}
                onChange={(e) => set("title", e.target.value)}
                className="mt-1 w-full bg-transparent text-xl font-semibold outline-none"
              />
            ) : (
              <h2 className="mt-1 text-xl font-semibold">{item.title}</h2>
            )}
            {!canEdit ? (
              <p className="mt-2 text-xs text-muted">
                Ihre Rolle darf Felder nicht ändern.
                {caps.comment ? " Kommentare im Verlauf sind erlaubt." : ""}
              </p>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="text-sm text-muted hover:text-ink">
            Schließen
          </button>
        </header>

        <div className="grid grid-cols-2 gap-3 border-b border-line px-6 py-4 text-sm">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted">Status</span>
            <select
              disabled={!canStatus}
              value={draft.status}
              onChange={(e) => set("status", e.target.value)}
              className="field mt-1 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted">Priorität</span>
            <select
              disabled={!canEdit}
              value={draft.priority}
              onChange={(e) => set("priority", e.target.value)}
              className="field mt-1 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted">Kategorie</span>
            <select
              disabled={!canEdit}
              value={draft.category}
              onChange={(e) => set("category", e.target.value)}
              className="field mt-1 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          {caps.seeInternal ? (
            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-muted">Sichtbarkeit</span>
              <select
                disabled={!canEdit}
                value={draft.visibility}
                onChange={(e) => set("visibility", e.target.value)}
                className="field mt-1 py-1.5"
              >
                {VISIBILITIES.map((v) => (
                  <option key={v} value={v}>
                    {VISIBILITY_LABEL[v]}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div>
              <span className="text-[11px] uppercase tracking-wider text-muted">Erfasst am</span>
              <p className="mt-1">{formatDate(item.capturedAt)}</p>
            </div>
          )}
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted">Zieltermin</span>
            <input
              type="date"
              disabled={!canEdit}
              value={draft.dueDate ? draft.dueDate.slice(0, 10) : ""}
              onChange={(e) => set("dueDate", e.target.value ? new Date(e.target.value).toISOString() : null)}
              className="field mt-1 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted">Quelle / Meeting</span>
            <input
              disabled={!canEdit}
              value={draft.source}
              onChange={(e) => set("source", e.target.value)}
              className="field mt-1 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted">Verantw. intern</span>
            <select
              disabled={!canEdit || !caps.seeInternalOwners}
              value={draft.ownerInternal?.id ?? ""}
              onChange={(e) =>
                set("ownerInternal", intern.find((m) => m.id === e.target.value) ?? null)
              }
              className="field mt-1 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">—</option>
              {intern.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted">Verantw. Kunde</span>
            <select
              disabled={!canEdit}
              value={draft.ownerCustomer?.id ?? ""}
              onChange={(e) =>
                set("ownerCustomer", kunden.find((m) => m.id === e.target.value) ?? null)
              }
              className="field mt-1 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">—</option>
              {kunden.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-4 px-6 py-4">
          <Field label="Beschreibung" value={draft.description} disabled={!canEdit} onChange={(v) => set("description", v)} />
          <Field label="Maßnahme" value={draft.measure} disabled={!canEdit} onChange={(v) => set("measure", v)} />
          <Field
            label="Abschluss / Begründung"
            value={draft.resolution}
            disabled={!canEdit}
            onChange={(v) => set("resolution", v)}
          />
          {canEdit || canStatus ? (
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="btn-primary"
            >
              {pending ? "Speichern…" : "Änderungen speichern"}
            </button>
          ) : null}
        </div>

        <div className="border-t border-line px-6 py-4">
          <h3 className="mb-3 text-sm font-semibold">Verlauf</h3>
          <div className="space-y-3">
            {item.comments.map((c) => (
              <div key={c.id} className="rounded-sm border border-line bg-canvas p-3">
                <div className="mb-1 flex items-center gap-2">
                  <Avatar person={c.user} size="sm" />
                  <span className="text-sm font-medium">{c.user.name}</span>
                  {c.isInternal ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand">Intern</span>
                  ) : null}
                  <span className="ml-auto text-[11px] text-muted">{formatDateTime(c.createdAt)}</span>
                </div>
                <p className="text-sm leading-relaxed">{c.body}</p>
              </div>
            ))}
            {item.comments.length === 0 ? (
              <p className="text-sm text-muted">Noch kein Kommentar.</p>
            ) : null}
          </div>
          {caps.comment ? (
            <div className="mt-4">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Kommentar zum Punkt…"
                className="field"
              />
              <div className="mt-2 flex items-center justify-between">
                {caps.internalComment ? (
                  <label className="text-xs text-muted">
                    <input
                      type="checkbox"
                      className="mr-1.5"
                      checked={internal}
                      onChange={(e) => setInternal(e.target.checked)}
                    />
                    Nur intern sichtbar
                  </label>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={sendComment}
                  disabled={!comment.trim() || pending}
                  className="btn-primary"
                >
                  Senden
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted">{label}</span>
      <textarea
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="field mt-1 leading-relaxed disabled:opacity-70"
      />
    </label>
  );
}

function CreateDialog({
  members,
  caps,
  onClose,
  onCreate,
}: {
  members: Person[];
  caps: WorkspacePayload["caps"];
  onClose: () => void;
  onCreate: (data: Record<string, string>) => Promise<void>;
}) {
  const intern = members.filter((m) => m.role !== "CUSTOMER");
  const kunden = members.filter((m) => m.role === "CUSTOMER");
  const [pending, start] = useTransition();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4" onClick={onClose}>
      <form
        className="w-full max-w-lg rounded-sm border border-line bg-raised p-6"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const data = Object.fromEntries(fd.entries()) as Record<string, string>;
          start(() => {
            void onCreate(data);
          });
        }}
      >
        <h2 className="text-lg font-semibold">Neuer offener Punkt</h2>
        <p className="mb-4 text-sm text-muted">Felder gemäß OPL-Vorlage V5.0</p>
        <div className="grid gap-3">
          <input
            required
            name="title"
            placeholder="Offener Punkt"
            className="field"
          />
          <textarea
            name="description"
            placeholder="Beschreibung"
            rows={3}
            className="field"
          />
          <textarea
            name="measure"
            placeholder="Vereinbarte Maßnahme"
            rows={2}
            className="field"
          />
          <div className="grid grid-cols-2 gap-2">
            <select name="category" className="field">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
            <select name="priority" defaultValue="MITTEL" className="field">
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <input
              name="source"
              placeholder="Quelle / Meeting"
              className="field"
            />
            <input type="date" name="dueDate" className="field" />
            <select name="ownerInternalId" className="field">
              <option value="">Verantw. intern</option>
              {intern.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <select name="ownerCustomerId" className="field">
              <option value="">Verantw. Kunde</option>
              {kunden.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {caps.seeInternal ? (
              <select name="visibility" className="field col-span-2">
                {VISIBILITIES.map((v) => (
                  <option key={v} value={v}>
                    {VISIBILITY_LABEL[v]}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn">
            Abbrechen
          </button>
          <button type="submit" disabled={pending} className="btn-primary">
            Anlegen
          </button>
        </div>
      </form>
    </div>
  );
}

function HiddenImporter({ projectId }: { projectId: string }) {
  const router = useRouter();
  return (
    <form
      className="fixed bottom-4 right-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await importProjectXlsx(projectId, fd);
        router.refresh();
      }}
    >
      <label className="btn cursor-pointer text-xs text-muted">
        Excel importieren
        <input type="file" name="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.currentTarget.form?.requestSubmit()} />
      </label>
    </form>
  );
}
