import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { assertProjectAccess, canSeeItem } from "@/lib/permissions";
import { contentDisposition, readStoredFile } from "@/lib/files";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: { item: true },
  });
  if (!attachment) {
    return NextResponse.json({ error: "Dokument nicht gefunden." }, { status: 404 });
  }

  const allowed = await assertProjectAccess(user, attachment.item.projectId);
  if (!allowed || !canSeeItem(user, attachment.item)) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  let body: Buffer;
  try {
    body = await readStoredFile(attachment.storedName);
  } catch {
    return NextResponse.json({ error: "Datei fehlt auf dem Server." }, { status: 404 });
  }

  const preview = new URL(request.url).searchParams.get("preview") === "1";
  return new NextResponse(new Uint8Array(body), {
    status: 200,
    headers: {
      "Content-Type": attachment.mimeType || "application/octet-stream",
      "Content-Length": String(body.length),
      "Content-Disposition": contentDisposition(
        preview ? "inline" : "attachment",
        attachment.filename,
      ),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
