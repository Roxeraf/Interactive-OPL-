"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { logAudit, stringifyValue } from "@/lib/audit";
import {
  canSeeItem,
  getProjectAccess,
  isInternal,
} from "@/lib/permissions";
import { FIELD_LABEL, formatOpNumber, labelOf } from "@/lib/constants";

const EDITABLE = [
  "title",
  "description",
  "measure",
  "resolution",
  "category",
  "priority",
  "status",
  "visibility",
  "source",
  "dueDate",
  "ownerInternalId",
  "ownerCustomerId",
] as const;

function revalidateProject(projectId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/audit`);
  revalidatePath(`/projects/${projectId}/settings`);
}

async function loadProject(projectId: string) {
  const user = await requireUser();
  const access = await getProjectAccess(user, projectId);
  if (!access) throw new Error("Kein Zugriff auf dieses Projekt.");
  return { user, project: access.project, caps: access.caps };
}

export async function createItem(projectId: string, input: Record<string, string>) {
  const { user, caps } = await loadProject(projectId);
  if (!caps.create) throw new Error("Keine Berechtigung, Punkte anzulegen.");

  const max = await prisma.openItem.aggregate({
    where: { projectId },
    _max: { number: true },
  });

  const visibility = isInternal(user) ? (input.visibility || "SHARED") : "SHARED";
  const dueDate = input.dueDate
    ? new Date(`${input.dueDate.slice(0, 10)}T12:00:00.000Z`)
    : null;

  const item = await prisma.openItem.create({
    data: {
      projectId,
      number: (max._max.number ?? 0) + 1,
      title: input.title?.trim() || "Neuer offener Punkt",
      description: input.description ?? "",
      measure: input.measure ?? "",
      category: input.category || "SONSTIGES",
      priority: input.priority || "MITTEL",
      status: input.status || "OFFEN",
      visibility,
      source: input.source ?? "",
      dueDate,
      ownerInternalId: input.ownerInternalId || null,
      ownerCustomerId: input.ownerCustomerId || null,
      createdById: user.id,
    },
  });

  await logAudit({
    projectId,
    itemId: item.id,
    userId: user.id,
    action: "CREATE",
    summary: `${formatOpNumber(item.number)} „${item.title}“ angelegt`,
  });

  revalidateProject(projectId);
  return { id: item.id };
}

export async function updateItem(
  itemId: string,
  patch: Record<string, string | null>,
) {
  const user = await requireUser();
  const existing = await prisma.openItem.findUniqueOrThrow({
    where: { id: itemId },
  });
  const access = await getProjectAccess(user, existing.projectId);
  if (!access || !canSeeItem(existing, access.caps)) {
    throw new Error("Kein Zugriff auf diesen Punkt.");
  }
  const caps = access.caps;

  const data: Record<string, unknown> = {};
  const changes: { field: string; oldValue: string | null; newValue: string | null }[] = [];

  for (const field of EDITABLE) {
    if (!(field in patch)) continue;
    if (field === "status" && !caps.changeStatus && !caps.edit) continue;
    if (field !== "status" && !caps.edit) continue;
    if (field === "visibility" && !isInternal(user)) continue;
    if (field === "ownerInternalId" && !isInternal(user)) continue;

    let next: unknown = patch[field];
    const prev = existing[field as keyof typeof existing];

    if (field === "dueDate") {
      next = patch[field]
        ? new Date(`${String(patch[field]).slice(0, 10)}T12:00:00.000Z`)
        : null;
    }
    if (field === "ownerInternalId" || field === "ownerCustomerId") {
      next = patch[field] ? patch[field] : null;
    }

    const prevS = stringifyValue(prev);
    const nextS = stringifyValue(next);
    if (prevS === nextS) continue;
    data[field] = next;
    changes.push({ field, oldValue: prevS, newValue: nextS });
  }

  if (data.status && (data.status === "GELOEST" || data.status === "VERWORFEN")) {
    if (!existing.resolvedAt) data.resolvedAt = new Date();
  }
  if (data.status && data.status !== "GELOEST" && data.status !== "VERWORFEN") {
    data.resolvedAt = null;
  }

  if (Object.keys(data).length === 0) return { ok: true };

  await prisma.openItem.update({ where: { id: itemId }, data });

  for (const change of changes) {
    const oldL = labelOf(change.field, change.oldValue);
    const newL = labelOf(change.field, change.newValue);
    await logAudit({
      projectId: existing.projectId,
      itemId,
      userId: user.id,
      action: change.field === "status" ? "STATUS" : "UPDATE",
      field: change.field,
      oldValue: change.oldValue,
      newValue: change.newValue,
      summary: `${formatOpNumber(existing.number)} · ${FIELD_LABEL[change.field] ?? change.field}: ${oldL} → ${newL}`,
    });
  }

  revalidateProject(existing.projectId);
  return { ok: true };
}

export async function addComment(
  itemId: string,
  body: string,
  isInternal: boolean,
) {
  const user = await requireUser();
  const item = await prisma.openItem.findUniqueOrThrow({
    where: { id: itemId },
    include: { project: true },
  });
  const access = await getProjectAccess(user, item.projectId);
  if (!access || !canSeeItem(item, access.caps)) throw new Error("Kein Zugriff.");
  const caps = access.caps;
  if (!caps.comment) throw new Error("Kommentare sind für Ihre Rolle deaktiviert.");
  const internal = isInternal && caps.internalComment;
  const text = body.trim();
  if (!text) throw new Error("Kommentar darf nicht leer sein.");

  await prisma.comment.create({
    data: { itemId, userId: user.id, body: text, isInternal: internal },
  });
  await logAudit({
    projectId: item.projectId,
    itemId,
    userId: user.id,
    action: "COMMENT",
    summary: `${formatOpNumber(item.number)} · ${internal ? "Interner Kommentar" : "Kommentar"} von ${user.name}`,
  });
  revalidateProject(item.projectId);
  return { ok: true };
}

export async function updateProjectPermissions(
  projectId: string,
  flags: {
    customerCanCreate: boolean;
    customerCanEdit: boolean;
    customerCanComment: boolean;
    customerCanChangeStatus: boolean;
    customerCanSeeAudit: boolean;
    customerCanExport: boolean;
    customerCanSeeInternalOwners: boolean;
  },
) {
  const { user, caps } = await loadProject(projectId);
  if (!caps.manageProject) throw new Error("Keine Berechtigung.");

  await prisma.project.update({ where: { id: projectId }, data: flags });

  const summary = [
    flags.customerCanCreate ? "anlegen" : null,
    flags.customerCanEdit ? "bearbeiten" : null,
    flags.customerCanComment ? "kommentieren" : null,
    flags.customerCanChangeStatus ? "Status" : null,
    flags.customerCanSeeAudit ? "Protokoll" : null,
    flags.customerCanExport ? "Export" : null,
    flags.customerCanSeeInternalOwners ? "interne Namen" : null,
  ]
    .filter(Boolean)
    .join(", ");

  await logAudit({
    projectId,
    userId: user.id,
    action: "PERMISSION",
    summary: `Kundenrechte aktualisiert: ${summary || "keine Freigaben"}`,
  });
  revalidateProject(projectId);
}
