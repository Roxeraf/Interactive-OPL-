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
  OFFEN: "bg-[#efe4c8] text-[#6b4f12]",
  IN_ARBEIT: "bg-[#d7ece6] text-[#0e5c57]",
  WARTE_KUNDE: "bg-[#f3ddd2] text-[#9a3412]",
  WARTE_INTERN: "bg-[#e4e0f5] text-[#4338ca]",
  GELOEST: "bg-[#dcecdc] text-[#157a4b]",
  VERWORFEN: "bg-[#ece8e1] text-[#5c574e]",
};

export function StatusBadge({ status }: { status: string }) {
  const s = status as Status;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        STATUS_STYLE[s] ?? "bg-line text-ink",
      )}
    >
      {STATUS_LABEL[s] ?? status}
    </span>
  );
}

const PRIORITY_STYLE: Record<Priority, string> = {
  KRITISCH: "bg-danger",
  HOCH: "bg-copper",
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
