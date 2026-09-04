import { mkdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  extensionOf,
  mimeFor,
  sanitizeOriginalName,
  validateUpload,
} from "./file-meta";

export {
  ACCEPT_ATTRIBUTE,
  ALLOWED_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  contentDisposition,
  extensionOf,
  formatFileSize,
  mimeFor,
  previewKind,
  sanitizeOriginalName,
  validateUpload,
} from "./file-meta";
export type { PreviewKind } from "./file-meta";

export function uploadRoot() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

export async function ensureUploadRoot() {
  const root = uploadRoot();
  await mkdir(root, { recursive: true });
  return root;
}

export async function resetUploadRoot() {
  const root = uploadRoot();
  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });
  return root;
}

export async function saveUploadBuffer(originalName: string, buffer: Buffer, reportedType?: string | null) {
  const filename = sanitizeOriginalName(originalName);
  const error = validateUpload(filename, buffer.length);
  if (error) throw new Error(error);
  const ext = extensionOf(filename);
  const storedName = `${randomUUID()}${ext ? `.${ext}` : ""}`;
  const root = await ensureUploadRoot();
  await writeFile(path.join(root, storedName), buffer);
  return {
    filename,
    storedName,
    mimeType: mimeFor(filename, reportedType),
    size: buffer.length,
  };
}

export function storedFilePath(storedName: string) {
  const safe = path.basename(storedName);
  if (safe !== storedName || storedName.includes("..")) {
    throw new Error("Ungültiger Dateiname.");
  }
  return path.join(uploadRoot(), safe);
}

export async function readStoredFile(storedName: string) {
  return readFile(storedFilePath(storedName));
}

export async function deleteStoredFile(storedName: string) {
  try {
    await unlink(storedFilePath(storedName));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
  }
}

export function buildPlainPdf(title: string, lines: string[]) {
  const escape = (value: string) => value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const ops = ["BT", "/F1 16 Tf", `1 0 0 1 50 760 Tm`, `(${escape(title)}) Tj`, "/F1 11 Tf"];
  let offset = -28;
  for (const line of lines) {
    ops.push(`0 ${offset} Td (${escape(line)}) Tj`);
    offset = -16;
  }
  ops.push("ET");
  const stream = ops.join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];
  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(body));
    body += `${object}\n`;
  }
  const xrefStart = Buffer.byteLength(body);
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(body + xref + trailer);
}
