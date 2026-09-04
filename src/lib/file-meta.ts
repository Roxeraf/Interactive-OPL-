export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "txt",
  "csv",
  "xlsx",
  "xls",
  "docx",
  "doc",
  "pptx",
  "ppt",
  "zip",
  "msg",
  "eml",
]);

export const ACCEPT_ATTRIBUTE = [...ALLOWED_EXTENSIONS].map((ext) => `.${ext}`).join(",");

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  txt: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ppt: "application/vnd.ms-powerpoint",
  zip: "application/zip",
  msg: "application/vnd.ms-outlook",
  eml: "message/rfc822",
};

export type PreviewKind = "image" | "pdf" | "text" | "none";

export function extensionOf(filename: string) {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) return "";
  return base.slice(dot + 1).toLowerCase();
}

export function sanitizeOriginalName(name: string) {
  const base = (name.split(/[/\\]/).pop() ?? name).replace(/[\u0000-\u001f]/g, "").trim();
  return (base || "dokument").slice(0, 180);
}

export function mimeFor(filename: string, reported?: string | null) {
  const ext = extensionOf(filename);
  const mapped = MIME_BY_EXT[ext];
  const reportedType = reported?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (mapped) return mapped;
  if (reportedType && reportedType !== "application/octet-stream") return reportedType;
  return "application/octet-stream";
}

export function previewKind(mimeType: string, filename: string): PreviewKind {
  const mime = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  const ext = extensionOf(filename);
  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
    return "image";
  }
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (mime.startsWith("text/") || ext === "txt" || ext === "csv") return "text";
  return "none";
}

export function validateUpload(filename: string, size: number) {
  const ext = extensionOf(filename);
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return "Dieser Dateityp ist nicht erlaubt. Erlaubt sind PDF, Bilder, Office, Text und ZIP.";
  }
  if (size <= 0) return "Die Datei ist leer.";
  if (size > MAX_UPLOAD_BYTES) return "Die Datei ist größer als 20 MB.";
  return null;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toLocaleString("de-DE", { maximumFractionDigits: 1 })} kB`;
  }
  return `${(bytes / (1024 * 1024)).toLocaleString("de-DE", { maximumFractionDigits: 1 })} MB`;
}

export function contentDisposition(type: "inline" | "attachment", filename: string) {
  const fallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
  const encoded = encodeURIComponent(filename);
  return `${type}; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
