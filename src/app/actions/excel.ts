"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { buildOplWorkbook, importOplWorkbook } from "@/lib/excel";
import { getProjectAccess } from "@/lib/permissions";

export async function exportProjectXlsx(projectId: string) {
  const user = await requireUser();
  const access = await getProjectAccess(user, projectId);
  if (!access) throw new Error("Kein Zugriff.");
  const caps = access.caps;
  if (!caps.export) throw new Error("Export ist für Ihre Rolle deaktiviert.");
  const { wb, filename } = await buildOplWorkbook(projectId, caps.seeInternal);
  const buffer = await wb.xlsx.writeBuffer();
  return {
    filename,
    base64: Buffer.from(buffer).toString("base64"),
  };
}

export async function importProjectXlsx(projectId: string, formData: FormData) {
  const user = await requireUser();
  const access = await getProjectAccess(user, projectId);
  if (!access) throw new Error("Kein Zugriff.");
  if (!access.caps.manageProject) throw new Error("Import nur intern möglich.");
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Keine Datei übergeben.");
  const buf = Buffer.from(await file.arrayBuffer());
  const result = await importOplWorkbook(projectId, user.id, buf);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/audit`);
  return result;
}
