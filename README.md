# Klarpunkt — Digitale Offene-Punkte-Liste

Klarpunkt ersetzt die Excel-Vorlage `XXXX_Offene-Punkte_V5-0_2020-11-13.xlsx` durch eine interaktive OPL für Customer-Project-Teams und Kunden.

Die Originaldatei liegt typischerweise unter:

`Departments / 1. Customer Project & Customer Care / 1.1 Customer Project / Projektmanagementvorlagen / Vorlagen`

Sie war in diesem Repository nicht enthalten. Die App bildet die **genormte V5.0-Feldstruktur** ab und kann im selben Spaltenlayout nach Excel exportieren und wieder importieren.

## Was die App kann

- **Lagebild statt Tabelle:** Tafel (Status-Spalten) und Register (dichte Liste), Karten statt Zeilen.
- **Dokumente je Punkt:** Upload, Download und Vorschau (PDF, Bilder, Text) direkt in der OPL.
- **Vollständiges Protokoll:** Jede Feldänderung speichert Person, Zeitpunkt, alten und neuen Wert.
- **Kundenrechte je Projekt:** Anlegen, Bearbeiten, Kommentieren, Status, Protokoll, Excel-Export, interne Namen — einzeln schaltbar.
- **Sichtbarkeit:** Punkte können *mit Kunde geteilt* oder *nur intern* sein. Interne Kommentare bleiben intern.
- **Excel V5.0:** Export als `{Projekt}_Offene-Punkte_V5-0_{Datum}.xlsx`, Import bestehender Vorlagen.

## Felder (Vorlage V5.0)

Nr. · Erfasst am · Quelle / Meeting · Kategorie · Offener Punkt · Beschreibung · Maßnahme · Verantwortlich intern · Verantwortlich Kunde · Priorität · Status · Zieltermin · Erledigt am · Sichtbarkeit · Abschluss / Begründung

Status: Offen, In Arbeit, Wartet auf Kunde, Wartet intern, Gelöst, Verworfen.

## Start mit Docker (empfohlen)

Die App läuft in einem Container mit **Node.js 22**. Lokal muss keine Node-Version installiert oder passend gemacht werden — [Docker Desktop](https://www.docker.com/products/docker-desktop/) reicht.

**Erster Start** (lädt das Node-Image, installiert Pakete, baut die App — oft 1–3 Minuten):

```bash
docker compose up --build
```

Öffnen: [http://localhost:3000](http://localhost:3000)

Danach reicht ein Start **ohne** `--build` (sekundenschnell, Image ist schon da):

```bash
docker compose up
```

`--build` nur erneut, wenn sich `package.json`, das Dockerfile oder der Quellcode geändert haben (z. B. nach `git pull`).

Beim ersten Start legt der Container die SQLite-Datenbank an, spielt die Demo-Daten ein und startet die App. Die Datenbank liegt im Docker-Volume `klarpunkt-data` und überlebt Neustarts.

Stoppen: `Ctrl+C`, danach optional `docker compose down`. Datenbank zurücksetzen: `docker compose down -v` (Volume wird gelöscht) und erneut `docker compose up --build`.

Unter **Docker Desktop für Windows** ist der erste Build spürbar langsamer (Image ziehen, `npm ci`, Production-Build). Ein rekursives `chown` über `node_modules` gibt es bewusst nicht mehr — das war der Schritt, der dort oft minutenlang „eingefroren“ wirkte. Danach das Image `klarpunkt:local` wiederverwenden und nicht jedes Mal `--build` anhängen.

### Entwicklung im Container (Hot Reload, ohne lokale Node-Installation)

```bash
docker compose -f docker-compose.dev.yml up --build
```

Quellcode wird ins Container-Dateisystem gespiegelt. `node_modules` bleibt im Container (Volume `app_node_modules`), damit die Linux-Binaries von Next.js und Prisma nicht mit einer lokalen Windows-/macOS-Installation kollidieren.

| Person | Rolle | E-Mail | Passwort |
| --- | --- | --- | --- |
| Lena Hofmann | Administration / PM | `admin@klarpunkt.local` | `Klarpunkt2026` |
| Jonas Weber | Engineering intern | `intern@klarpunkt.local` | `Klarpunkt2026` |
| Dr. Anna Richter | Kunde Nordwerk AG | `kunde@klarpunkt.local` | `Klarpunkt2026` |

Im Demo-Projekt **NW-2026-014 Verpackungslinie VL-400** darf der Kunde kommentieren, aber nicht anlegen, bearbeiten oder das Protokoll sehen. Interne Punkte (Nachtrag, Lessons Learned) sind für den Kunden unsichtbar.

Optional kannst du `AUTH_SECRET` in einer `.env` im Projektroot setzen. Ohne Datei verwendet Compose einen lokalen Standardwert.

## Start ohne Docker

Nur nötig, wenn du nicht mit Docker arbeitest. Next.js 16 braucht **Node.js 20.9 oder neuer** (empfohlen: 22, siehe `.nvmrc`).

```bash
cp .env.example .env
npm install
npm run setup
npm run dev
```

Öffnen: [http://localhost:3000](http://localhost:3000)

## Technik

Next.js 16 · React 19 · Prisma 6 / SQLite · JWT-Session · ExcelJS · Docker (Node 22)
