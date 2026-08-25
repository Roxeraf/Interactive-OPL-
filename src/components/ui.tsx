import clsx from "clsx";
import type { Person } from "@/lib/serialize";
import { PRIORITY_LABEL, STATUS_LABEL, type Priority, type Status } from "@/lib/constants";

export function Avatar({
  person,
  size = "md",
}: {
  person: Pick<Person, "initials" | "accent" | "name"> | null;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "h-6 w-6 text-[9px]" : size === "lg" ? "h-10 w-10 text-sm" : "h-8 w-8 text-[11px]";
  if (!person) {
    return (
      <span
        className={clsx(
          "inline-flex items-center justify-center rounded-full border border-dashed border-line text-muted",
          dim,
        )}
      >
        —
      </span>
    );
  }
  return (
    <span
      title={person.name}
      className={clsx(
        "inline-flex items-center justify-center rounded-full font-semibold text-white",
        dim,
      )}
      style={{ background: person.accent }}
    >
      {person.initials}
    </span>
  );
}

const STATUS_STYLE: Record<Status, string> = {
  OFFEN: "bg-[#edf2f7] text-[#4a5568]",
  IN_ARBEIT: "bg-[#e6f1fb] text-[#0066cc]",
  WARTE_KUNDE: "bg-[#fef3c7] text-[#92400e]",
  WARTE_INTERN: "bg-[#eef2ff] text-[#3730a3]",
  GELOEST: "bg-[#e6f6ed] text-[#276749]",
  VERWORFEN: "bg-[#f7fafc] text-[#718096]",
};

export function StatusBadge({ status }: { status: string }) {
  const s = status as Status;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold",
        STATUS_STYLE[s] ?? "bg-line text-ink",
      )}
    >
      {STATUS_LABEL[s] ?? status}
    </span>
  );
}

const PRIORITY_STYLE: Record<Priority, string> = {
  KRITISCH: "bg-danger",
  HOCH: "bg-brand",
  MITTEL: "bg-amber",
  NIEDRIG: "bg-muted",
};

export function PriorityMark({ priority }: { priority: string }) {
  const p = priority as Priority;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
      <span className={clsx("h-2 w-2 rounded-full", PRIORITY_STYLE[p] ?? "bg-muted")} />
      {PRIORITY_LABEL[p] ?? priority}
    </span>
  );
}
