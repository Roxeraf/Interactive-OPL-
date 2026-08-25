# Klarpunkt — Digitale Offene-Punkte-Liste

Klarpunkt ersetzt die Excel-Vorlage `XXXX_Offene-Punkte_V5-0_2020-11-13.xlsx` durch eine interaktive OPL für Customer-Project-Teams und Kunden.

Die Originaldatei liegt typischerweise unter:

`Departments / 1. Customer Project & Customer Care / 1.1 Customer Project / Projektmanagementvorlagen / Vorlagen`

Sie war in diesem Repository nicht enthalten. Die App bildet die **genormte V5.0-Feldstruktur** ab und kann im selben Spaltenlayout nach Excel exportieren und wieder importieren.

## Was die App kann

- **Lagebild statt Tabelle:** Tafel (Status-Spalten) und Register (dichte Liste), Karten statt Zeilen.
- **Vollständiges Protokoll:** Jede Feldänderung speichert Person, Zeitpunkt, alten und neuen Wert.
- **Kundenrechte je Projekt:** Anlegen, Bearbeiten, Kommentieren, Status, Protokoll, Excel-Export, interne Namen — einzeln schaltbar.
- **Sichtbarkeit:** Punkte können *mit Kunde geteilt* oder *nur intern* sein. Interne Kommentare bleiben intern.
- **Excel V5.0:** Export als `{Projekt}_Offene-Punkte_V5-0_{Datum}.xlsx`, Import bestehender Vorlagen.

## Felder (Vorlage V5.0)

Nr. · Erfasst am · Quelle / Meeting · Kategorie · Offener Punkt · Beschreibung · Maßnahme · Verantwortlich intern · Verantwortlich Kunde · Priorität · Status · Zieltermin · Erledigt am · Sichtbarkeit · Abschluss / Begründung

Status: Offen, In Arbeit, Wartet auf Kunde, Wartet intern, Gelöst, Verworfen.

## Start

```bash
cp .env.example .env
npm install
npm run setup
npm run dev
```

Öffnen: [http://localhost:3000](http://localhost:3000)

| Person | Rolle | E-Mail | Passwort |
| --- | --- | --- | --- |
| Lena Hofmann | Administration / PM | `admin@klarpunkt.local` | `Klarpunkt2026` |
| Jonas Weber | Engineering intern | `intern@klarpunkt.local` | `Klarpunkt2026` |
| Dr. Anna Richter | Kunde Nordwerk AG | `kunde@klarpunkt.local` | `Klarpunkt2026` |

Im Demo-Projekt **NW-2026-014 Verpackungslinie VL-400** darf der Kunde kommentieren, aber nicht anlegen, bearbeiten oder das Protokoll sehen. Interne Punkte (Nachtrag, Lessons Learned) sind für den Kunden unsichtbar.

## Technik

Next.js 16 · React 19 · Prisma 6 / SQLite · JWT-Session · ExcelJS
