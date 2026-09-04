import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { buildPlainPdf, resetUploadRoot, saveUploadBuffer } from "../src/lib/files";

const prisma = new PrismaClient();
const PASSWORD = "Klarpunkt2026";

async function main() {
  await prisma.auditEvent.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.openItem.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await resetUploadRoot();

  const hash = await bcrypt.hash(PASSWORD, 10);

  const lena = await prisma.user.create({
    data: {
      email: "admin@klarpunkt.local",
      name: "Lena Hofmann",
      passwordHash: hash,
      role: "ADMIN",
      title: "Projektleiterin",
      organization: "PLX Customer Project",
      initials: "LH",
      accent: "#0066CC",
    },
  });

  const jonas = await prisma.user.create({
    data: {
      email: "intern@klarpunkt.local",
      name: "Jonas Weber",
      passwordHash: hash,
      role: "INTERNAL",
      title: "Inbetriebnahme / Engineering",
      organization: "PLX Customer Project",
      initials: "JW",
      accent: "#38A169",
    },
  });

  const miriam = await prisma.user.create({
    data: {
      email: "doku@klarpunkt.local",
      name: "Miriam Cole",
      passwordHash: hash,
      role: "INTERNAL",
      title: "Dokumentation & QS",
      organization: "PLX Customer Project",
      initials: "MC",
      accent: "#2B6CB0",
    },
  });

  const anna = await prisma.user.create({
    data: {
      email: "kunde@klarpunkt.local",
      name: "Dr. Anna Richter",
      passwordHash: hash,
      role: "CUSTOMER",
      title: "Projektleiterin Kunde",
      organization: "Nordwerk AG",
      initials: "AR",
      accent: "#DD6B20",
    },
  });

  const thomas = await prisma.user.create({
    data: {
      email: "betrieb@klarpunkt.local",
      name: "Thomas Krüger",
      passwordHash: hash,
      role: "CUSTOMER",
      title: "Betriebsleiter",
      organization: "Nordwerk AG",
      initials: "TK",
      accent: "#319795",
    },
  });

  const nordwerk = await prisma.project.create({
    data: {
      code: "NW-2026-014",
      name: "Verpackungslinie VL-400",
      customerName: "Nordwerk AG",
      site: "Werk Leipzig",
      description:
        "Lieferung, Montage und Inbetriebnahme der Verpackungslinie VL-400 inkl. Schnittstelle zum vorhandenen SAP-MES.",
      status: "AKTIV",
      customerCanCreate: false,
      customerCanEdit: false,
      customerCanComment: true,
      customerCanChangeStatus: false,
      customerCanSeeAudit: false,
      customerCanExport: false,
      customerCanSeeInternalOwners: true,
    },
  });

  const hoelzer = await prisma.project.create({
    data: {
      code: "HL-2025-008",
      name: "Hallenkran Retrofit HK-12",
      customerName: "Hölzer Logistik GmbH",
      site: "Halle 3, Magdeburg",
      description: "Steuerungstausch und Sicherheitsnachrüstung am Hallenkran HK-12.",
      status: "AKTIV",
      customerCanCreate: true,
      customerCanEdit: true,
      customerCanComment: true,
      customerCanChangeStatus: true,
      customerCanSeeAudit: true,
      customerCanExport: true,
      customerCanSeeInternalOwners: true,
    },
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: nordwerk.id, userId: lena.id },
      { projectId: nordwerk.id, userId: jonas.id },
      { projectId: nordwerk.id, userId: miriam.id },
      { projectId: nordwerk.id, userId: anna.id },
      { projectId: nordwerk.id, userId: thomas.id },
      { projectId: hoelzer.id, userId: lena.id },
      { projectId: hoelzer.id, userId: jonas.id },
    ],
  });

  const d = (iso: string) => new Date(iso);

  type SeedItem = {
    number: number;
    title: string;
    description: string;
    measure: string;
    resolution?: string;
    category: string;
    priority: string;
    status: string;
    visibility: string;
    source: string;
    capturedAt: string;
    dueDate?: string;
    resolvedAt?: string;
    ownerInternalId?: string;
    ownerCustomerId?: string;
    createdById: string;
    comments?: { userId: string; body: string; isInternal?: boolean; at: string }[];
    history?: { userId: string; action: string; field?: string; oldValue?: string; newValue?: string; summary: string; at: string }[];
  };

  const items: SeedItem[] = [
    {
      number: 1,
      title: "Freigabe Aufstellplan Halle 4 ausstehend",
      description:
        "Der aktuelle Aufstellplan VL-400 Rev. C berücksichtigt die neue Hallenstütze nicht. Kunde muss die Kollisionsprüfung intern abschließen.",
      measure: "Nordwerk prüft Rev. C gegen Hallenaufmaß und gibt schriftlich frei.",
      category: "ORGANISATION",
      priority: "HOCH",
      status: "WARTE_KUNDE",
      visibility: "SHARED",
      source: "Kick-off 12.06.2026",
      capturedAt: "2026-06-12T09:30:00.000Z",
      dueDate: "2026-08-29T00:00:00.000Z",
      ownerInternalId: lena.id,
      ownerCustomerId: anna.id,
      createdById: lena.id,
      comments: [
        {
          userId: lena.id,
          body: "Rev. C liegt seit 18.08. im Kundenportal. Bitte Freigabe bis Freitag, sonst verschiebt sich die Anlieferung der Portalachsen.",
          at: "2026-08-18T14:10:00.000Z",
        },
        {
          userId: anna.id,
          body: "Wir haben die Prüfung an die Werksplanung gegeben. Rückmeldung voraussichtlich Mittwoch.",
          at: "2026-08-19T08:42:00.000Z",
        },
      ],
      history: [
        {
          userId: lena.id,
          action: "CREATE",
          summary: "OP-001 angelegt",
          at: "2026-06-12T09:30:00.000Z",
        },
        {
          userId: lena.id,
          action: "UPDATE",
          field: "status",
          oldValue: "OFFEN",
          newValue: "WARTE_KUNDE",
          summary: "Status: Offen → Wartet auf Kunde",
          at: "2026-08-18T14:12:00.000Z",
        },
      ],
    },
    {
      number: 2,
      title: "Schnittstelle SAP-MES: Telegramm 14 unklar",
      description:
        "Im Lastenheft fehlt die Belegung von Byte 7–9 im Telegramm 14 (Palettenwechsel). Ohne Klärung kann die SPS-Software nicht finalisiert werden.",
      measure: "Gemeinsamer Workshop IT Nordwerk + PLX Automation, Protokoll als verbindliche Spezifikation.",
      category: "TECHNIK",
      priority: "KRITISCH",
      status: "IN_ARBEIT",
      visibility: "SHARED",
      source: "Abstimmung Software 03.07.2026",
      capturedAt: "2026-07-03T10:00:00.000Z",
      dueDate: "2026-08-26T00:00:00.000Z",
      ownerInternalId: jonas.id,
      ownerCustomerId: thomas.id,
      createdById: jonas.id,
      comments: [
        {
          userId: jonas.id,
          body: "Vorschlag Byte-Belegung als PDF an Thomas gesendet. Bitte Gegenlesen bis Dienstag.",
          at: "2026-08-20T16:05:00.000Z",
        },
      ],
      history: [
        {
          userId: jonas.id,
          action: "CREATE",
          summary: "OP-002 angelegt",
          at: "2026-07-03T10:00:00.000Z",
        },
        {
          userId: jonas.id,
          action: "UPDATE",
          field: "priority",
          oldValue: "HOCH",
          newValue: "KRITISCH",
          summary: "Priorität: Hoch → Kritisch",
          at: "2026-08-15T11:20:00.000Z",
        },
      ],
    },
    {
      number: 3,
      title: "CE-Konformitätserklärung Linie – Restpunkte Sicherheitszaun",
      description:
        "Zwei Schutztüren an der Folienstation haben noch keine überwachte Zuhaltung. Für die Gesamtkonformität der Linie zwingend.",
      measure: "Zuhaltungen Typ 4 nachrüsten, Validierung nach EN ISO 13849-1, Doku aktualisieren.",
      category: "SICHERHEIT",
      priority: "KRITISCH",
      status: "IN_ARBEIT",
      visibility: "SHARED",
      source: "Risikobeurteilung 22.07.2026",
      capturedAt: "2026-07-22T13:00:00.000Z",
      dueDate: "2026-09-04T00:00:00.000Z",
      ownerInternalId: jonas.id,
      createdById: lena.id,
      comments: [
        {
          userId: miriam.id,
          body: "Lieferzeit Zuhaltungen 10 AT. Bestellung ist draußen.",
          isInternal: true,
          at: "2026-08-12T09:00:00.000Z",
        },
      ],
      history: [
        {
          userId: lena.id,
          action: "CREATE",
          summary: "OP-003 angelegt",
          at: "2026-07-22T13:00:00.000Z",
        },
      ],
    },
    {
      number: 4,
      title: "Ersatzteilliste Inbetriebnahme fehlt in deutscher Fassung",
      description:
        "Aktuell nur englische OEM-Liste. Nordwerk benötigt die deutsche Fassung für den Einkauf und die Lageranlage.",
      measure: "Übersetzung durch Doku, Abgleich mit Stückliste Rev. B, Übergabe als xlsx + PDF.",
      category: "DOKUMENTATION",
      priority: "MITTEL",
      status: "OFFEN",
      visibility: "SHARED",
      source: "Jour fixe 05.08.2026",
      capturedAt: "2026-08-05T08:00:00.000Z",
      dueDate: "2026-09-11T00:00:00.000Z",
      ownerInternalId: miriam.id,
      ownerCustomerId: anna.id,
      createdById: miriam.id,
      history: [
        {
          userId: miriam.id,
          action: "CREATE",
          summary: "OP-004 angelegt",
          at: "2026-08-05T08:00:00.000Z",
        },
      ],
    },
    {
      number: 5,
      title: "Medienbereitstellung Druckluft 8 bar am Aufstellort",
      description:
        "Laut Schnittstellenliste muss Nordwerk 8 bar ±0,5, gefiltert, am Übergabepunkt bereitstellen. Messung vor Ort noch nicht erfolgt.",
      measure: "Kunde führt Messung durch und bestätigt Übergabepunkt inkl. Kugelhahn DN25.",
      category: "INBETRIEBNAHME",
      priority: "HOCH",
      status: "WARTE_KUNDE",
      visibility: "SHARED",
      source: "Schnittstellengespräch 28.07.2026",
      capturedAt: "2026-07-28T11:15:00.000Z",
      dueDate: "2026-08-21T00:00:00.000Z",
      ownerInternalId: jonas.id,
      ownerCustomerId: thomas.id,
      createdById: jonas.id,
      comments: [
        {
          userId: thomas.id,
          body: "Kompressor-Wartung diese Woche. Messung folgt Montag.",
          at: "2026-08-22T07:55:00.000Z",
        },
      ],
      history: [
        {
          userId: jonas.id,
          action: "CREATE",
          summary: "OP-005 angelegt",
          at: "2026-07-28T11:15:00.000Z",
        },
      ],
    },
    {
      number: 6,
      title: "Interne Kalkulation Mehrleistung Folienwechsel",
      description:
        "Zusätzlicher automatischer Folienwechsel war nicht im Angebot. Vor Abstimmung mit dem Kunden interne Bewertung der Mehrkosten.",
      measure: "Kalkulation durch PM, danach Entscheidung über Nachtrag NA-03.",
      category: "KAUFMÄNNISCH",
      priority: "HOCH",
      status: "IN_ARBEIT",
      visibility: "INTERNAL",
      source: "Internes PM 08.08.2026",
      capturedAt: "2026-08-08T15:00:00.000Z",
      dueDate: "2026-08-28T00:00:00.000Z",
      ownerInternalId: lena.id,
      createdById: lena.id,
      comments: [
        {
          userId: lena.id,
          body: "Einkauf hat 18,4 T€ Material genannt. Montage intern ca. 6 AT. Bitte noch nicht gegenüber Nordwerk kommunizieren.",
          isInternal: true,
          at: "2026-08-14T10:22:00.000Z",
        },
      ],
      history: [
        {
          userId: lena.id,
          action: "CREATE",
          summary: "OP-006 angelegt (nur intern)",
          at: "2026-08-08T15:00:00.000Z",
        },
        {
          userId: lena.id,
          action: "UPDATE",
          field: "visibility",
          oldValue: "SHARED",
          newValue: "INTERNAL",
          summary: "Sichtbarkeit: Mit Kunde geteilt → Nur intern",
          at: "2026-08-08T15:04:00.000Z",
        },
      ],
    },
    {
      number: 7,
      title: "Schulung Bediener Schicht A/B terminiert",
      description: "Zwei Schulungstage vor SAT. Teilnehmerliste und Schulungsraum durch Nordwerk.",
      measure: "Termine 16.–17.09., max. 8 Personen je Schicht, Schulungsunterlagen 7 Tage vorher.",
      resolution:
        "Termine bestätigt. Teilnehmerliste liegt vor. Schulungsraum Halle 4, Besprechungsraum 2.",
      category: "SCHULUNG",
      priority: "MITTEL",
      status: "GELOEST",
      visibility: "SHARED",
      source: "Jour fixe 05.08.2026",
      capturedAt: "2026-08-05T09:20:00.000Z",
      dueDate: "2026-08-20T00:00:00.000Z",
      resolvedAt: "2026-08-19T16:00:00.000Z",
      ownerInternalId: miriam.id,
      ownerCustomerId: anna.id,
      createdById: lena.id,
      history: [
        {
          userId: lena.id,
          action: "CREATE",
          summary: "OP-007 angelegt",
          at: "2026-08-05T09:20:00.000Z",
        },
        {
          userId: miriam.id,
          action: "UPDATE",
          field: "status",
          oldValue: "WARTE_KUNDE",
          newValue: "GELOEST",
          summary: "Status: Wartet auf Kunde → Gelöst",
          at: "2026-08-19T16:00:00.000Z",
        },
      ],
    },
    {
      number: 8,
      title: "FAT-Protokoll Position 12 – Geräuschmessung nachreichen",
      description:
        "Beim FAT konnte die Geräuschmessung an der Traversiereinheit nicht durchgeführt werden (Halle zu laut). Nachholung im Werk Leipzig.",
      measure: "Messung nach DIN EN 415-10 während SAT, Protokoll an QS Nordwerk.",
      category: "QUALITAET",
      priority: "MITTEL",
      status: "OFFEN",
      visibility: "SHARED",
      source: "FAT 01.08.2026",
      capturedAt: "2026-08-01T16:40:00.000Z",
      dueDate: "2026-09-18T00:00:00.000Z",
      ownerInternalId: jonas.id,
      ownerCustomerId: thomas.id,
      createdById: jonas.id,
      history: [
        {
          userId: jonas.id,
          action: "CREATE",
          summary: "OP-008 angelegt",
          at: "2026-08-01T16:40:00.000Z",
        },
      ],
    },
    {
      number: 9,
      title: "Zugang Werksausweis für Montagecrew KW 36",
      description: "Sechs Monteure benötigen Werksausweise und Hallenzugang inkl. Staplerberechtigung.",
      measure: "Namen, Geburtsdaten, Führerscheinkopien an Werkschutz Nordwerk.",
      category: "ORGANISATION",
      priority: "HOCH",
      status: "WARTE_INTERN",
      visibility: "SHARED",
      source: "Montageplanung 11.08.2026",
      capturedAt: "2026-08-11T12:00:00.000Z",
      dueDate: "2026-08-27T00:00:00.000Z",
      ownerInternalId: lena.id,
      ownerCustomerId: anna.id,
      createdById: lena.id,
      comments: [
        {
          userId: lena.id,
          body: "Zwei Personalbögen fehlen noch aus dem Partnerunternehmen. Intern nachhaken.",
          isInternal: true,
          at: "2026-08-21T09:18:00.000Z",
        },
      ],
      history: [
        {
          userId: lena.id,
          action: "CREATE",
          summary: "OP-009 angelegt",
          at: "2026-08-11T12:00:00.000Z",
        },
      ],
    },
    {
      number: 10,
      title: "Lackierung RAL 5010 abweichend vom Corporate Design",
      description:
        "Nordwerk wünscht RAL 7021 statt 5010 an den Verkleidungen. Bereits gefertigte Türen wären nachzuarbeiten.",
      measure: "Nachtrag prüfen, Kosten und Terminverschiebung transparent machen.",
      category: "TECHNIK",
      priority: "NIEDRIG",
      status: "VERWORFEN",
      visibility: "SHARED",
      source: "Design-Review 15.07.2026",
      capturedAt: "2026-07-15T10:00:00.000Z",
      dueDate: "2026-08-01T00:00:00.000Z",
      resolvedAt: "2026-07-29T00:00:00.000Z",
      resolution: "Kunde verzichtet auf Farbänderung. Original RAL 5010 bleibt. Mail Richter 29.07.",
      ownerInternalId: lena.id,
      ownerCustomerId: anna.id,
      createdById: lena.id,
      history: [
        {
          userId: lena.id,
          action: "CREATE",
          summary: "OP-010 angelegt",
          at: "2026-07-15T10:00:00.000Z",
        },
        {
          userId: lena.id,
          action: "UPDATE",
          field: "status",
          oldValue: "OFFEN",
          newValue: "VERWORFEN",
          summary: "Status: Offen → Verworfen",
          at: "2026-07-29T09:10:00.000Z",
        },
      ],
    },
    {
      number: 11,
      title: "Reserve-I/O für spätere Waagenanbindung vorsehen",
      description:
        "Werksplanung möchte 8 digitale Eingänge und 4 Analogeingänge als Reserve auf der ET200SP.",
      measure: "Baugruppe erweitern, E-Plan aktualisieren, keine Auswirkung auf Termin wenn bis KW 35 bestellt.",
      category: "TECHNIK",
      priority: "NIEDRIG",
      status: "OFFEN",
      visibility: "SHARED",
      source: "Jour fixe 19.08.2026",
      capturedAt: "2026-08-19T10:00:00.000Z",
      dueDate: "2026-09-08T00:00:00.000Z",
      ownerInternalId: jonas.id,
      ownerCustomerId: thomas.id,
      createdById: jonas.id,
      history: [
        {
          userId: jonas.id,
          action: "CREATE",
          summary: "OP-011 angelegt",
          at: "2026-08-19T10:00:00.000Z",
        },
      ],
    },
    {
      number: 12,
      title: "Interne Lessons-Learned FAT-Checkliste",
      description:
        "Beim FAT sind drei Messpunkte erst vor Ort improvisiert worden. Checkliste für das nächste Projekt schärfen.",
      measure: "Checkliste V2 durch QS, Review im Team-Meeting KW 35.",
      category: "QUALITAET",
      priority: "NIEDRIG",
      status: "IN_ARBEIT",
      visibility: "INTERNAL",
      source: "Internes Review 04.08.2026",
      capturedAt: "2026-08-04T17:00:00.000Z",
      dueDate: "2026-09-01T00:00:00.000Z",
      ownerInternalId: miriam.id,
      createdById: miriam.id,
      history: [
        {
          userId: miriam.id,
          action: "CREATE",
          summary: "OP-012 angelegt (nur intern)",
          at: "2026-08-04T17:00:00.000Z",
        },
      ],
    },
  ];

  for (const item of items) {
    const created = await prisma.openItem.create({
      data: {
        projectId: nordwerk.id,
        number: item.number,
        title: item.title,
        description: item.description,
        measure: item.measure,
        resolution: item.resolution ?? "",
        category: item.category,
        priority: item.priority,
        status: item.status,
        visibility: item.visibility,
        source: item.source,
        capturedAt: d(item.capturedAt),
        dueDate: item.dueDate ? d(item.dueDate) : null,
        resolvedAt: item.resolvedAt ? d(item.resolvedAt) : null,
        ownerInternalId: item.ownerInternalId ?? null,
        ownerCustomerId: item.ownerCustomerId ?? null,
        createdById: item.createdById,
      },
    });

    for (const c of item.comments ?? []) {
      await prisma.comment.create({
        data: {
          itemId: created.id,
          userId: c.userId,
          body: c.body,
          isInternal: Boolean(c.isInternal),
          createdAt: d(c.at),
        },
      });
    }

    for (const h of item.history ?? []) {
      await prisma.auditEvent.create({
        data: {
          projectId: nordwerk.id,
          itemId: created.id,
          userId: h.userId,
          action: h.action,
          field: h.field ?? null,
          oldValue: h.oldValue ?? null,
          newValue: h.newValue ?? null,
          summary: h.summary,
          createdAt: d(h.at),
        },
      });
    }

    if (item.number === 2) {
      const pdf = buildPlainPdf("OP-002 Telegramm 14", [
        "Vorschlag Byte-Belegung Palettenwechsel",
        "Byte 7: Status Palettenhub  0 = unten  1 = oben",
        "Byte 8: Sequenznummer Wechsel",
        "Byte 9: Reserve / Quittung MES",
        "Stand: 20.08.2026  -  Jonas Weber",
      ]);
      const storedPdf = await saveUploadBuffer(
        "Telegramm-14-Bytebelegung.pdf",
        pdf,
        "application/pdf",
      );
      await prisma.attachment.create({
        data: {
          itemId: created.id,
          uploadedById: jonas.id,
          filename: storedPdf.filename,
          storedName: storedPdf.storedName,
          mimeType: storedPdf.mimeType,
          size: storedPdf.size,
          createdAt: d("2026-08-20T16:00:00.000Z"),
        },
      });
      const notes = Buffer.from(
        [
          "OP-002 / Telegramm 14",
          "",
          "Offene Fragen an Nordwerk IT:",
          "- Quittung auf Byte 9: Puls oder Pegel?",
          "- Timeout Palettenwechsel?",
          "",
          "Jonas Weber, 20.08.2026",
          "",
        ].join("\n"),
        "utf8",
      );
      const storedTxt = await saveUploadBuffer("Rueckfragen-MES.txt", notes, "text/plain");
      await prisma.attachment.create({
        data: {
          itemId: created.id,
          uploadedById: jonas.id,
          filename: storedTxt.filename,
          storedName: storedTxt.storedName,
          mimeType: storedTxt.mimeType,
          size: storedTxt.size,
          createdAt: d("2026-08-20T16:02:00.000Z"),
        },
      });
      await prisma.auditEvent.create({
        data: {
          projectId: nordwerk.id,
          itemId: created.id,
          userId: jonas.id,
          action: "UPLOAD",
          field: "attachment",
          newValue: storedPdf.filename,
          summary: "OP-002 · Dokument hinterlegt: Telegramm-14-Bytebelegung.pdf",
          createdAt: d("2026-08-20T16:00:00.000Z"),
        },
      });
    }
  }

  const crane = await prisma.openItem.create({
    data: {
      projectId: hoelzer.id,
      number: 1,
      title: "Not-Halt-Kreis Brücke vs. Katze – Verdrahtung prüfen",
      description: "Bestandsplan 2012 weicht von der Vor-Ort-Aufnahme ab.",
      measure: "Aufmaß durch Weber, Abgleich mit Schaltplan, Foto-Dokumentation.",
      category: "SICHERHEIT",
      priority: "KRITISCH",
      status: "IN_ARBEIT",
      visibility: "SHARED",
      source: "Begehung 02.08.2026",
      capturedAt: d("2026-08-02T09:00:00.000Z"),
      dueDate: d("2026-08-28T00:00:00.000Z"),
      ownerInternalId: jonas.id,
      createdById: lena.id,
    },
  });

  await prisma.auditEvent.create({
    data: {
      projectId: hoelzer.id,
      itemId: crane.id,
      userId: lena.id,
      action: "CREATE",
      summary: "OP-001 angelegt",
      createdAt: d("2026-08-02T09:00:00.000Z"),
    },
  });

  await prisma.auditEvent.create({
    data: {
      projectId: nordwerk.id,
      userId: lena.id,
      action: "PERMISSION",
      summary: "Kundenrechte gesetzt: Kommentieren ja, Anlegen/Bearbeiten nein, Protokoll nein",
      createdAt: d("2026-06-12T08:00:00.000Z"),
    },
  });

  console.log("Klarpunkt Seed fertig.");
  console.log("  admin@klarpunkt.local / Klarpunkt2026  (Lena Hofmann, Admin)");
  console.log("  intern@klarpunkt.local / Klarpunkt2026  (Jonas Weber, Intern)");
  console.log("  kunde@klarpunkt.local / Klarpunkt2026  (Dr. Anna Richter, Kunde)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
