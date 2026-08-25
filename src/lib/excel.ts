import ExcelJS from "exceljs";
import { prisma } from "./db";
import {
  CATEGORY_LABEL,
  CATEGORIES,
  PRIORITY_LABEL,
  PRIORITIES,
  STATUS_LABEL,
  STATUSES,
  VISIBILITY_LABEL,
  formatOpNumber,
  labelOf,
} from "./constants";
import { logAudit } from "./audit";

const HEADER_ROW = 6;

const COLUMNS = [
  { key: "number", header: "Nr.", width: 10 },
  { key: "capturedAt", header: "Erfasst am", width: 14 },
  { key: "source", header: "Quelle / Meeting", width: 22 },
  { key: "category", header: "Kategorie", width: 16 },
  { key: "title", header: "Offener Punkt", width: 36 },
  { key: "description", header: "Beschreibung", width: 40 },
  { key: "measure", header: "Maßnahme", width: 36 },
  { key: "ownerInternal", header: "Verantw. intern", width: 22 },
  { key: "ownerCustomer", header: "Verantw. Kunde", width: 22 },
  { key: "priority", header: "Priorität", width: 12 },
  { key: "status", header: "Status", width: 18 },
  { key: "dueDate", header: "Zieltermin", width: 14 },
  { key: "resolvedAt", header: "Erledigt am", width: 14 },
  { key: "visibility", header: "Sichtbarkeit", width: 16 },
  { key: "resolution", header: "Abschluss / Begründung", width: 32 },
] as const;

function fmtDate(d: Date | null | undefined) {
  if (!d) return "";
  return d.toLocaleDateString("de-DE");
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const s = String(value).trim();
  if (!s) return null;
  const iso = Date.parse(s);
  if (!Number.isNaN(iso)) return new Date(iso);
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (m) {
    const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return new Date(year, Number(m[2]) - 1, Number(m[1]));
  }
  return null;
}

function invert(map: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(map).map(([k, v]) => [v.toLowerCase(), k]),
  );
}

const statusByLabel = invert(STATUS_LABEL);
const priorityByLabel = invert(PRIORITY_LABEL);
const categoryByLabel = invert(CATEGORY_LABEL);
const visibilityByLabel = invert(VISIBILITY_LABEL);

function mapEnum(
  value: string,
  allowed: readonly string[],
  byLabel: Record<string, string>,
  fallback: string,
) {
  const raw = value.trim();
  if (!raw) return fallback;
  if (allowed.includes(raw)) return raw;
  return byLabel[raw.toLowerCase()] ?? fallback;
}

export async function buildOplWorkbook(projectId: string, includeInternal: boolean) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      items: {
        where: includeInternal ? undefined : { visibility: "SHARED" },
        include: { ownerInternal: true, ownerCustomer: true },
        orderBy: { number: "asc" },
      },
    },
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = "Klarpunkt";
  wb.created = new Date();
  const sheet = wb.addWorksheet("OPL", {
    views: [{ state: "frozen", ySplit: HEADER_ROW }],
  });

  sheet.mergeCells("A1:O1");
  sheet.getCell("A1").value = "Offene-Punkte-Liste (OPL)  ·  Klarpunkt digital  ·  Vorlage V5.0";
  sheet.getCell("A1").font = { name: "Calibri", size: 16, bold: true, color: { argb: "FF1A1814" } };

  sheet.getCell("A2").value = "Projekt";
  sheet.getCell("B2").value = `${project.code}  —  ${project.name}`;
  sheet.getCell("A3").value = "Kunde";
  sheet.getCell("B3").value = project.customerName;
  sheet.getCell("A4").value = "Standort / Stand";
  sheet.getCell("B4").value = `${project.site ?? "—"}  ·  ${new Date().toLocaleDateString("de-DE")}`;
  sheet.getCell("L2").value = "Version";
  sheet.getCell("M2").value = "V5.0";
  sheet.getCell("L3").value = "Punkte";
  sheet.getCell("M3").value = project.items.length;

  for (const cell of ["A2", "A3", "A4", "L2", "L3"]) {
    sheet.getCell(cell).font = { bold: true, color: { argb: "FF5C574E" } };
  }

  COLUMNS.forEach((col, i) => {
    const cell = sheet.getCell(HEADER_ROW, i + 1);
    cell.value = col.header;
    cell.font = { bold: true, color: { argb: "FFFAF7F1" }, name: "Calibri", size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A1814" } };
    cell.alignment = { vertical: "middle", wrapText: true };
    sheet.getColumn(i + 1).width = col.width;
  });
  sheet.getRow(HEADER_ROW).height = 22;

  project.items.forEach((item, idx) => {
    const row = sheet.getRow(HEADER_ROW + 1 + idx);
    const values = [
      formatOpNumber(item.number),
      fmtDate(item.capturedAt),
      item.source,
      labelOf("category", item.category),
      item.title,
      item.description,
      item.measure,
      item.ownerInternal?.name ?? "",
      item.ownerCustomer?.name ?? "",
      labelOf("priority", item.priority),
      labelOf("status", item.status),
      fmtDate(item.dueDate),
      fmtDate(item.resolvedAt),
      labelOf("visibility", item.visibility),
      item.resolution,
    ];
    values.forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value = v;
      cell.alignment = { vertical: "top", wrapText: true };
      if (idx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3EEE4" } };
      }
    });
    row.height = 36;
  });

  return { wb, filename: `${project.code}_Offene-Punkte_V5-0_${new Date().toISOString().slice(0, 10)}.xlsx` };
}

function headerIndex(headers: string[]) {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const find = (...needles: string[]) =>
    headers.findIndex((h) => needles.some((n) => norm(h).includes(norm(n))));

  return {
    number: find("nr", "nummer", "op-"),
    capturedAt: find("erfasst", "datum"),
    source: find("quelle", "meeting"),
    category: find("kategorie"),
    title: find("offener punkt", "titel", "thema"),
    description: find("beschreibung"),
    measure: find("maßnahme", "massnahme"),
    ownerInternal: find("verantw. intern", "verantwortlich intern", "intern"),
    ownerCustomer: find("verantw. kunde", "verantwortlich kunde", "kunde"),
    priority: find("priorität", "prio"),
    status: find("status"),
    dueDate: find("zieltermin", "fälligkeit", "termin"),
    resolvedAt: find("erledigt"),
    visibility: find("sichtbarkeit", "intern/kunde"),
    resolution: find("abschluss", "begründung"),
  };
}

export async function importOplWorkbook(
  projectId: string,
  userId: string,
  buffer: Buffer,
) {
  const wb = new ExcelJS.Workbook();
  // exceljs types accept ArrayBuffer / Buffer
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error("Die Datei enthält kein Arbeitsblatt.");

  let headerRow = 1;
  for (let r = 1; r <= 12; r++) {
    const vals = (sheet.getRow(r).values as unknown[])
      .slice(1)
      .map((v) => String(v ?? "").toLowerCase());
    if (vals.some((v) => v.includes("status") || v.includes("offener punkt") || v.includes("nr"))) {
      headerRow = r;
      break;
    }
  }

  const headers = (sheet.getRow(headerRow).values as unknown[])
    .slice(1)
    .map((v) => String(v ?? ""));
  const idx = headerIndex(headers);

  const users = await prisma.user.findMany();
  const findUser = (name: string) => {
    const n = name.trim().toLowerCase();
    if (!n) return null;
    return users.find((u) => u.name.toLowerCase() === n || u.email.toLowerCase() === n) ?? null;
  };

  const max = await prisma.openItem.aggregate({
    where: { projectId },
    _max: { number: true },
  });
  let nextNumber = (max._max.number ?? 0) + 1;

  let created = 0;
  for (let r = headerRow + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const cell = (i: number) => {
      if (i < 0) return "";
      const v = row.getCell(i + 1).value;
      if (v && typeof v === "object" && "text" in (v as object)) return String((v as { text: string }).text);
      if (v && typeof v === "object" && "result" in (v as object)) return String((v as { result: unknown }).result ?? "");
      return v == null ? "" : String(v);
    };

    const title = cell(idx.title) || cell(idx.description);
    if (!title.trim()) continue;

    const intern = findUser(cell(idx.ownerInternal));
    const kunde = findUser(cell(idx.ownerCustomer));
    const status = mapEnum(cell(idx.status), STATUSES, statusByLabel, "OFFEN");
    const priority = mapEnum(cell(idx.priority), PRIORITIES, priorityByLabel, "MITTEL");
    const category = mapEnum(cell(idx.category), CATEGORIES, categoryByLabel, "SONSTIGES");
    const visibility = mapEnum(cell(idx.visibility), ["SHARED", "INTERNAL"], visibilityByLabel, "SHARED");

    const item = await prisma.openItem.create({
      data: {
        projectId,
        number: nextNumber++,
        title: title.trim(),
        description: cell(idx.description),
        measure: cell(idx.measure),
        resolution: cell(idx.resolution),
        category,
        priority,
        status,
        visibility: visibility === "INTERNAL" ? "INTERNAL" : "SHARED",
        source: cell(idx.source),
        capturedAt: parseDate(row.getCell((idx.capturedAt < 0 ? 0 : idx.capturedAt) + 1).value) ?? new Date(),
        dueDate: parseDate(row.getCell((idx.dueDate < 0 ? 0 : idx.dueDate) + 1).value),
        resolvedAt: parseDate(row.getCell((idx.resolvedAt < 0 ? 0 : idx.resolvedAt) + 1).value),
        ownerInternalId: intern?.id ?? null,
        ownerCustomerId: kunde?.id ?? null,
        createdById: userId,
      },
    });

    await logAudit({
      projectId,
      itemId: item.id,
      userId,
      action: "IMPORT",
      summary: `${formatOpNumber(item.number)} aus Excel-Vorlage importiert`,
    });
    created += 1;
  }

  await logAudit({
    projectId,
    userId,
    action: "IMPORT",
    summary: `${created} offene Punkte aus Excel importiert (Vorlage V5.0)`,
  });

  return { created };
}
