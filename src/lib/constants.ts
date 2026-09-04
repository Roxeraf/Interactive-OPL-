export const STATUSES = [
  "OFFEN",
  "IN_ARBEIT",
  "WARTE_KUNDE",
  "WARTE_INTERN",
  "GELOEST",
  "VERWORFEN",
] as const;

export const PRIORITIES = ["KRITISCH", "HOCH", "MITTEL", "NIEDRIG"] as const;

export const CATEGORIES = [
  "TECHNIK",
  "KAUFMÄNNISCH",
  "ORGANISATION",
  "DOKUMENTATION",
  "QUALITAET",
  "SICHERHEIT",
  "INBETRIEBNAHME",
  "SCHULUNG",
  "SONSTIGES",
] as const;

export const VISIBILITIES = ["SHARED", "INTERNAL"] as const;

export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Category = (typeof CATEGORIES)[number];
export type Visibility = (typeof VISIBILITIES)[number];
export type Role = "ADMIN" | "INTERNAL" | "CUSTOMER";

export const STATUS_LABEL: Record<Status, string> = {
  OFFEN: "Offen",
  IN_ARBEIT: "In Arbeit",
  WARTE_KUNDE: "Wartet auf Kunde",
  WARTE_INTERN: "Wartet intern",
  GELOEST: "Gelöst",
  VERWORFEN: "Verworfen",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  KRITISCH: "Kritisch",
  HOCH: "Hoch",
  MITTEL: "Mittel",
  NIEDRIG: "Niedrig",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  TECHNIK: "Technik",
  KAUFMÄNNISCH: "Kaufmännisch",
  ORGANISATION: "Organisation",
  DOKUMENTATION: "Dokumentation",
  QUALITAET: "Qualität",
  SICHERHEIT: "Sicherheit",
  INBETRIEBNAHME: "Inbetriebnahme",
  SCHULUNG: "Schulung",
  SONSTIGES: "Sonstiges",
};

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  SHARED: "Mit Kunde geteilt",
  INTERNAL: "Nur intern",
};

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administration (PureLoX)",
  INTERNAL: "PureLoX",
  CUSTOMER: "Kunde",
};

export const ORG_KIND_LABEL: Record<"PURELOX" | "CUSTOMER", string> = {
  PURELOX: "PureLoX",
  CUSTOMER: "Kunde",
};

export const FIELD_LABEL: Record<string, string> = {
  title: "Offener Punkt",
  description: "Beschreibung",
  measure: "Maßnahme",
  resolution: "Abschluss",
  category: "Kategorie",
  priority: "Priorität",
  status: "Status",
  visibility: "Sichtbarkeit",
  source: "Quelle",
  dueDate: "Zieltermin",
  resolvedAt: "Erledigt am",
  ownerInternalId: "Verantwortlich intern",
  ownerCustomerId: "Verantwortlich Kunde",
  attachment: "Dokument",
};

export function formatOpNumber(n: number) {
  return `OP-${String(n).padStart(3, "0")}`;
}

export function labelOf(field: string, value: string | null | undefined) {
  if (!value) return "—";
  if (field === "status") return STATUS_LABEL[value as Status] ?? value;
  if (field === "priority") return PRIORITY_LABEL[value as Priority] ?? value;
  if (field === "category") return CATEGORY_LABEL[value as Category] ?? value;
  if (field === "visibility") return VISIBILITY_LABEL[value as Visibility] ?? value;
  return value;
}
