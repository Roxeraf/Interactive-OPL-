import { format, isBefore, startOfDay } from "date-fns";
import { de } from "date-fns/locale";

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return format(new Date(iso), "dd. MMM yyyy", { locale: de });
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return format(new Date(iso), "dd. MMM yyyy, HH:mm", { locale: de });
}

export function formatDay(iso: string | null | undefined) {
  if (!iso) return "—";
  return format(new Date(iso), "dd.MM.yyyy", { locale: de });
}

export function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate) return false;
  if (status === "GELOEST" || status === "VERWORFEN") return false;
  return isBefore(new Date(dueDate), startOfDay(new Date()));
}
