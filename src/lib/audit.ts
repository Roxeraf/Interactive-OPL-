import { prisma } from "./db";

export async function logAudit(input: {
  projectId: string;
  itemId?: string | null;
  userId: string;
  action: string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  summary: string;
}) {
  return prisma.auditEvent.create({
    data: {
      projectId: input.projectId,
      itemId: input.itemId ?? null,
      userId: input.userId,
      action: input.action,
      field: input.field ?? null,
      oldValue: input.oldValue ?? null,
      newValue: input.newValue ?? null,
      summary: input.summary,
    },
  });
}

export function stringifyValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}
