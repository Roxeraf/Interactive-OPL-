"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import {
  getProjectAccess,
  canSeeItem,
} from "@/lib/permissions";
import { formatOpNumber } from "@/lib/constants";
import { deleteStoredFile, saveUploadBuffer } from "@/lib/files";

function revalidateProject(projectId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/audit`);
}

export async function uploadAttachment(formData: FormData) {
  const user = await requireUser();
  const itemId = String(formData.get("itemId") ?? "");
  const file = formData.get("file");
  if (!itemId) return { ok: false as const, error: "Punkt fehlt." };
  if (!(file instanceof File)) return { ok: false as const, error: "Keine Datei übergeben." };

  const item = await prisma.openItem.findUnique({
    where: { id: itemId },
    include: { project: true },
  });
  if (!item) return { ok: false as const, error: "Punkt nicht gefunden." };

  const access = await getProjectAccess(user, item.projectId);
  if (!access || !canSeeItem(item, access.caps)) {
    return { ok: false as const, error: "Kein Zugriff auf diesen Punkt." };
  }
  const caps = access.caps;
  if (!caps.edit) {
    return { ok: false as const, error: "Ihre Rolle darf keine Dokumente hinterlegen." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await saveUploadBuffer(file.name, buffer, file.type);
    const attachment = await prisma.attachment.create({
      data: {
        itemId,
        uploadedById: user.id,
        filename: stored.filename,
        storedName: stored.storedName,
        mimeType: stored.mimeType,
        size: stored.size,
      },
    });
    await prisma.openItem.update({
      where: { id: itemId },
      data: { updatedAt: new Date() },
    });
    await logAudit({
      projectId: item.projectId,
      itemId,
      userId: user.id,
      action: "UPLOAD",
      field: "attachment",
      newValue: stored.filename,
      summary: `${formatOpNumber(item.number)} · Dokument hinterlegt: ${stored.filename}`,
    });
    revalidateProject(item.projectId);
    return { ok: true as const, id: attachment.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload fehlgeschlagen.";
    return { ok: false as const, error: message };
  }
}

export async function deleteAttachment(attachmentId: string) {
  const user = await requireUser();
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: { item: { include: { project: true } } },
  });
  if (!attachment) return { ok: false as const, error: "Dokument nicht gefunden." };

  const access = await getProjectAccess(user, attachment.item.projectId);
  if (!access || !canSeeItem(attachment.item, access.caps)) {
    return { ok: false as const, error: "Kein Zugriff." };
  }
  const caps = access.caps;
  if (!caps.edit) {
    return { ok: false as const, error: "Ihre Rolle darf keine Dokumente entfernen." };
  }

  await prisma.attachment.delete({ where: { id: attachment.id } });
  await deleteStoredFile(attachment.storedName);
  await prisma.openItem.update({
    where: { id: attachment.itemId },
    data: { updatedAt: new Date() },
  });
  await logAudit({
    projectId: attachment.item.projectId,
    itemId: attachment.itemId,
    userId: user.id,
    action: "DELETE",
    field: "attachment",
    oldValue: attachment.filename,
    summary: `${formatOpNumber(attachment.item.number)} · Dokument entfernt: ${attachment.filename}`,
  });
  revalidateProject(attachment.item.projectId);
  return { ok: true as const };
}
