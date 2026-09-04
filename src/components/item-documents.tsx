"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import {
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { deleteAttachment, uploadAttachment } from "@/app/actions/attachments";
import { ACCEPT_ATTRIBUTE, formatFileSize, MAX_UPLOAD_BYTES } from "@/lib/file-meta";
import { formatDateTime } from "@/lib/dates";
import type { ClientAttachment, ClientItem } from "@/lib/serialize";

export function ItemDocuments({
  item,
  canUpload,
  onChanged,
}: {
  item: ClientItem;
  canUpload: boolean;
  onChanged: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<ClientAttachment | null>(null);

  function ingest(fileList: FileList | File[] | null) {
    if (!fileList || !canUpload) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setError(null);
    start(async () => {
      for (const file of files) {
        if (file.size > MAX_UPLOAD_BYTES) {
          setError(`„${file.name}“ ist größer als 20 MB.`);
          return;
        }
        const fd = new FormData();
        fd.set("itemId", item.id);
        fd.set("file", file);
        const result = await uploadAttachment(fd);
        if (!result.ok) {
          setError(result.error);
          return;
        }
      }
      onChanged();
    });
  }

  function remove(file: ClientAttachment) {
    if (!canUpload) return;
    if (!window.confirm(`Dokument „${file.filename}“ wirklich entfernen?`)) return;
    setError(null);
    start(async () => {
      const result = await deleteAttachment(file.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (preview?.id === file.id) setPreview(null);
      onChanged();
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] uppercase tracking-wider text-muted">Dokumente</span>
        <span className="font-mono text-[11px] text-muted">{item.attachments.length}</span>
      </div>
      <div
        className={clsx(
          "mt-1 rounded-sm border bg-raised",
          dragOver ? "border-brand ring-2 ring-brand/20" : "border-line",
        )}
        onDragOver={(e) => {
          if (!canUpload) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (!canUpload) return;
          e.preventDefault();
          setDragOver(false);
          ingest(e.dataTransfer.files);
        }}
      >
        {item.attachments.length === 0 ? (
          <p className="px-3 py-3 text-sm text-muted">Noch keine Dokumente hinterlegt.</p>
        ) : (
          <ul className="divide-y divide-line">
            {item.attachments.map((file) => (
              <li key={file.id} className="flex items-start gap-3 px-3 py-2.5">
                <span className="mt-0.5 text-brand">
                  <FileGlyph mimeType={file.mimeType} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={file.filename}>
                    {file.filename}
                  </p>
                  <p className="text-[11px] text-muted">
                    {formatFileSize(file.size)} · {file.uploadedBy.name} · {formatDateTime(file.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted hover:bg-canvas hover:text-ink"
                    title="Vorschau"
                    onClick={() => setPreview(file)}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <a
                    href={`/api/attachments/${file.id}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted hover:bg-canvas hover:text-ink"
                    title="Herunterladen"
                    download={file.filename}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  {canUpload ? (
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted hover:bg-canvas hover:text-danger"
                      title="Entfernen"
                      disabled={pending}
                      onClick={() => remove(file)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        {canUpload ? (
          <div className="border-t border-line px-3 py-3">
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT_ATTRIBUTE}
              className="hidden"
              onChange={(e) => {
                ingest(e.target.files);
                e.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
              className="btn w-full"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {pending ? "Wird hinterlegt…" : "Dokument hinzufügen"}
            </button>
            <p className="mt-2 text-center text-[11px] text-muted">
              PDF, Bilder, Office und Text · max. 20 MB · Dateien können auch hierher gezogen werden
            </p>
          </div>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      {preview ? <DocumentPreview file={preview} onClose={() => setPreview(null)} /> : null}
    </div>
  );
}

function FileGlyph({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
  if (mimeType.includes("sheet") || mimeType.includes("excel") || mimeType === "text/csv") {
    return <FileSpreadsheet className="h-4 w-4" />;
  }
  if (mimeType === "application/pdf" || mimeType.startsWith("text/")) {
    return <FileText className="h-4 w-4" />;
  }
  return <Paperclip className="h-4 w-4" />;
}

function DocumentPreview({
  file,
  onClose,
}: {
  file: ClientAttachment;
  onClose: () => void;
}) {
  const src = `/api/attachments/${file.id}?preview=1`;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/70 p-4" onClick={onClose}>
      <div
        className="flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-sm border border-line bg-raised shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 border-b border-line px-4 py-3">
          <FileGlyph mimeType={file.mimeType} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{file.filename}</p>
            <p className="text-[11px] text-muted">
              {formatFileSize(file.size)} · {file.uploadedBy.name} · {formatDateTime(file.createdAt)}
            </p>
          </div>
          <a href={`/api/attachments/${file.id}`} download={file.filename} className="btn">
            <Download className="h-4 w-4" />
            Herunterladen
          </a>
          <button type="button" onClick={onClose} className="btn" title="Schließen">
            <X className="h-4 w-4" />
            Schließen
          </button>
        </header>
        <div className="relative min-h-0 flex-1 bg-[#d8dee8]">
          {file.preview === "image" ? (
            <div className="absolute inset-0 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={file.filename}
                className="h-full w-full object-contain"
              />
            </div>
          ) : null}
          {file.preview === "pdf" ? (
            <iframe title={file.filename} src={src} className="absolute inset-0 h-full w-full bg-white" />
          ) : null}
          {file.preview === "text" ? (
            <div className="absolute inset-0">
              <TextPreview key={file.id} src={src} />
            </div>
          ) : null}
          {file.preview === "none" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <Paperclip className="h-8 w-8 text-muted" />
              <p className="text-sm font-medium">Keine integrierte Vorschau für diesen Dateityp.</p>
              <p className="max-w-sm text-sm text-muted">
                Office-Dateien, ZIP-Archive und ähnliche Formate können heruntergeladen und lokal geöffnet werden.
              </p>
              <a href={`/api/attachments/${file.id}`} download={file.filename} className="btn-primary">
                <Download className="h-4 w-4" />
                Herunterladen
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function TextPreview({ src }: { src: string }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then(async (res) => {
        if (!res.ok) throw new Error("Vorschau konnte nicht geladen werden.");
        return res.text();
      })
      .then((body) => {
        if (!cancelled) setText(body);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Vorschau fehlgeschlagen.");
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <div className="h-full overflow-auto p-4">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {text === null && !error ? <p className="text-sm text-muted">Vorschau wird geladen…</p> : null}
      {text !== null ? (
        <pre className="whitespace-pre-wrap break-words rounded-sm border border-line bg-raised p-4 text-sm leading-relaxed">
          {text}
        </pre>
      ) : null}
    </div>
  );
}
