# Übergabeprotokoll: Klarpunkt nachbauen

Dieses Dokument ist die Bauanleitung für eine KI. Es beschreibt die App **Klarpunkt** so, dass sie ohne den ursprünglichen Quelltext neu entstehen kann. Baue das hier beschriebene Verhalten. Erfinde keine weiteren Fachfunktionen. Wo eine Lücke ausdrücklich als solche markiert ist, bleibt sie eine Lücke.

Sprache der Oberfläche, Fehlermeldungen, Protokolleinträge und Seed-Daten: **Deutsch**.

---

## 1. Produkt

Klarpunkt ist die digitale **Offene-Punkte-Liste (OPL)** von PureLoX. Sie ersetzt die Excel-Vorlage `XXXX_Offene-Punkte_V5-0_2020-11-13.xlsx` für Customer-Project-Teams und deren Kunden. Die Originaldatei liegt nicht im Repository. Die App bildet die genormte **Feldstruktur V5.0** ab und kann in diesem Spaltenlayout exportieren und importieren.

Ein offener Punkt ist eine Karte, kein Tabellenrest. Es gibt zwei Ansichten: **Tafel** (eine Spalte je Status, Karten per Drag-and-Drop verschiebbar) und **Register** (dichte Liste). Zu jedem Punkt gehören Dokumente, Kommentare und ein vollständiges Änderungsprotokoll.

Zwei Welten teilen sich dieselbe OPL:

- **PureLoX** (Lieferant) sieht zugeordnete Projekte inklusive interner Punkte und interner Kommentare.
- **Kunde** sieht nur Punkte mit Sichtbarkeit *Mit Kunde geteilt*. Interne Punkte und interne Kommentare bleiben unsichtbar. Was der Kunde höchstens darf, begrenzt das Projekt zusätzlich zu seiner persönlichen Rolle.

Die Administration sieht alle Projekte, auch ohne Mitgliedschaft.

---

## 2. Technik

| Baustein | Version / Wahl |
| --- | --- |
| Laufzeit | Node.js ≥ 20.9, empfohlen 22 (`.nvmrc`: `22`) |
| Framework | Next.js **16.3.3**, App Router, React **19.2.8** |
| Sprache | TypeScript, `strict` |
| Styling | Tailwind CSS 4 über `@tailwindcss/postcss`, keine separate `tailwind.config` |
| Daten | Prisma 6, SQLite |
| Session | JWT (HS256, Bibliothek `jose`), Cookie `klarpunkt_session` |
| Passwörter | `bcryptjs`, Kostenfaktor 10 |
| Excel | `exceljs` |
| Drag-and-drop | `@dnd-kit/core` und `@dnd-kit/utilities` |
| Icons | `lucide-react` |
| Datum | `date-fns` mit Locale `de` |
| Klassen | `clsx` |

`zod` und `@dnd-kit/sortable` werden nicht gebraucht. Server Actions und der Route Handler laufen auf Node, nicht auf Edge: Prisma, Dateisystem und bcrypt brauchen das.

Pfadalias: `@/*` → `./src/*`.

Next.js 16 weicht von älteren Versionen ab. Lies vor dem ersten Code die Hinweise in `node_modules/next/dist/docs/`. Zwei Punkte aus dieser Codebasis:

- Request-Schutz liegt in `src/proxy.ts` und exportiert die Funktion `proxy` plus `config`. Das ist der Nachfolger von `middleware.ts`.
- Dynamische Route-Parameter sind ein `Promise` (`params: Promise<{ id: string }>`).
- Das Root-Layout typisiert `children` mit `LayoutProps<"/">`.

`next.config.ts`:

- `serverExternalPackages`: `@prisma/client`, `prisma`, `exceljs`, `bcryptjs`
- `experimental.serverActions.bodySizeLimit`: `25mb`
- `experimental.proxyClientMaxBodySize`: `25mb`

Skripte:

| Skript | Wirkung |
| --- | --- |
| `dev` | `next dev --hostname 0.0.0.0 --port 3000` |
| `build` | `prisma generate && next build` |
| `start` | `next start --hostname 0.0.0.0 --port 3000` |
| `lint` | `eslint` (eslint-config-next 16, Core Web Vitals + TypeScript) |
| `setup` / `postinstall` | `prisma generate`, danach `db push` und Seed nur bei `setup` |
| `db:seed` | `tsx prisma/seed.ts` |
| `db:reset` | `db push` und Seed |

Prisma-Seed-Eintrag in `package.json`: `"prisma": { "seed": "tsx prisma/seed.ts" }`.

Umgebungsvariablen (`.env.example`):

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="bitte-durch-einen-langen-zufaelligen-wert-ersetzen"
UPLOAD_DIR="./uploads"
```

Ohne `AUTH_SECRET` gilt der feste Entwicklungsfallback `klarpunkt-dev-secret-change-in-production-2026`. Docker setzt `DATABASE_URL=file:/data/klarpunkt.db`, `UPLOAD_DIR=/data/uploads` und einen eigenen Secret-Fallback.

`.gitignore` schließt `.env`, `node_modules`, `.next`, `prisma/dev.db*` und `uploads/` aus.

---

## 3. Datenmodell

SQLite über Prisma. IDs sind `cuid()`. Enums sind **Strings**, keine Prisma-Enums, damit SQLite sie trägt.

### Organization

Unternehmen. `kind` ist `PURELOX` oder `CUSTOMER`. Felder: `name`, `kind`, `createdAt`. Relationen: `users`, `projects`.

### User

| Feld | Bedeutung |
| --- | --- |
| `email` | eindeutig, immer kleingeschrieben gespeichert |
| `name`, `title`, `organization` | Anzeigename, Funktion, Firmenname als Text |
| `organizationId` | optionaler Bezug zur Organization; `organization` hält denselben Namen redundant |
| `passwordHash` | bcrypt |
| `role` | globale Zugehörigkeit: `ADMIN`, `INTERNAL`, `CUSTOMER` |
| `initials` | zwei Großbuchstaben |
| `accent` | Hex-Farbe des Avatars |

Initialen: erster Buchstabe des ersten Worts plus erster Buchstabe des zweiten Worts; fehlt das zweite Wort, der zweite Buchstabe des ersten. Akzentfarbe zyklisch aus `#005acb`, `#cf1057`, `#002f69`, `#289ff5`, `#00a9ce`, `#014dad`, Index = Summe der Char-Codes des Namens modulo 6.

### Project

| Feld | Bedeutung |
| --- | --- |
| `code` | eindeutig, z. B. `NW-2026-014` |
| `name`, `customerName`, `description`, `site` | Stammdaten |
| `organizationId` | Kundenunternehmen |
| `status` | Default `AKTIV`; die Oberfläche filtert danach nicht |
| Kunden-Flags | siehe Abschnitt 4, alle Boolean |

Es gibt **keine** Oberfläche zum Anlegen oder Löschen von Projekten. Projekte kommen aus dem Seed. Die Administration kann nur das Kundenunternehmen eines bestehenden Projekts wechseln; dabei wird `customerName` auf den Organisationsnamen gesetzt.

### ProjectMember

`projectId`, `userId`, `role` (Projektrolle, Default `PLX_MEMBER`). Eindeutig je Paar. Cascade beim Löschen von Projekt oder User.

### OpenItem

Ein Punkt gehört zu genau einem Projekt. `@@unique([projectId, number])`, Index auf `(projectId, status)`.

| Feld | Bedeutung |
| --- | --- |
| `number` | fortlaufend je Projekt, Anzeige `OP-001` |
| `title` | Pflicht in der Oberfläche; serverseitig Fallback „Neuer offener Punkt“ |
| `description`, `measure`, `resolution` | Text, Default leer |
| `category`, `priority`, `status`, `visibility` | Werte aus Abschnitt 5 |
| `source` | Quelle / Meeting |
| `capturedAt` | Erfassungszeitpunkt, Default jetzt |
| `dueDate`, `resolvedAt` | optional |
| `ownerInternalId`, `ownerCustomerId` | optional, User |
| `createdById` | Pflicht |
| `updatedAt` | `@updatedAt` |

### Comment

`body`, `isInternal` (Default false), `userId`, `itemId`, `createdAt`. Cascade.

### Attachment

Metadaten in der Datenbank, Bytes auf der Platte.

| Feld | Bedeutung |
| --- | --- |
| `filename` | bereinigter Originalname, max. 180 Zeichen |
| `storedName` | eindeutig, `{uuid}.{ext}` |
| `mimeType`, `size` | size in Bytes |
| `uploadedById` | Restrict beim User-Löschen |

### AuditEvent

Jede fachliche Änderung. `projectId` Pflicht, `itemId` optional (`onDelete: SetNull`). `action`, optionales `field`, `oldValue`, `newValue`, `summary`, `userId`, `createdAt`. Indizes auf `(projectId, createdAt)` und `itemId`.

Aktionen, die der Code schreibt: `CREATE`, `UPDATE`, `STATUS`, `COMMENT`, `PERMISSION`, `IMPORT`, `UPLOAD`, `DELETE`.

---

## 4. Rechte

Es gibt zwei Ebenen. Die **globale Rolle** sagt, zu welcher Seite eine Person gehört. Die **Projektrolle** sagt, was sie in einem konkreten Projekt darf. Die **Kunden-Höchstgrenzen** des Projekts schneiden Kundenrollen zusätzlich ab.

### Globale Rollen

| Rolle | Bedeutung |
| --- | --- |
| `ADMIN` | Administration PureLoX. Sieht jedes Projekt, auch ohne Mitgliedschaft, und erhält dort die Fähigkeiten von `PLX_LEAD` plus `manageUsers`. |
| `INTERNAL` | PureLoX-Mitarbeiter. Sieht nur Projekte mit Mitgliedschaft. |
| `CUSTOMER` | Kundenkonto. Sieht nur Projekte mit Mitgliedschaft. Das Konto muss zu einem Kundenunternehmen gehören. |

Navigation **Personen** und **Kunden** gibt es nur für `ADMIN`.

### Projektrollen und Fähigkeiten

Fähigkeiten: `create`, `edit`, `comment`, `changeStatus`, `seeAudit`, `export`, `seeInternal`, `seeInternalOwners`, `manageProject`, `internalComment`. `manageUsers` ist keine Rolleigenschaft, sondern immer genau dann wahr, wenn die globale Rolle `ADMIN` ist.

| Rolle | Gruppe | create | edit | comment | status | audit | export | intern sehen | interne Namen | Projekt steuern | interne Kommentare |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `PLX_LEAD` Leitung | plx | ja | ja | ja | ja | ja | ja | ja | ja | ja | ja |
| `PLX_MEMBER` Team | plx | ja | ja | ja | ja | ja | ja | ja | ja | nein | ja |
| `PLX_VIEWER` Einsicht | plx | nein | nein | nein | nein | ja | ja | ja | ja | nein | nein |
| `CUSTOMER_LEAD` Kunden-Leitung | customer | ja | ja | ja | ja | ja | ja | nein | ja | nein | nein |
| `CUSTOMER_EDITOR` Bearbeiten | customer | ja | ja | ja | ja | nein | nein | nein | ja | nein | nein |
| `CUSTOMER_COMMENTER` Kommentieren | customer | nein | nein | ja | nein | nein | nein | nein | ja | nein | nein |
| `CUSTOMER_VIEWER` Lesen | customer | nein | nein | nein | nein | nein | nein | nein | ja | nein | nein |

Hilfetexte, die die Zugang-Seite anzeigt:

- Leitung PureLoX: Voller Zugriff inkl. interner Punkte, Protokoll und Mitgliederverwaltung.
- Team: Arbeitet in der OPL inkl. interner Notizen, ohne Mitglieder zu steuern.
- Einsicht: Sieht das Projekt inkl. interner Punkte, darf aber nichts ändern.
- Kunden-Projektleitung: Maximale Kundenrechte in diesem Projekt, begrenzt durch die Kunden-Höchstgrenzen.
- Kunde bearbeiten: Darf geteilte Punkte anlegen und bearbeiten, sofern das Projekt das zulässt.
- Kunde kommentieren: Sieht geteilte Punkte und darf den Verlauf ergänzen.
- Kunde lesen: Nur Einsicht in geteilte Punkte, ohne Kommentare oder Änderungen.

`PLX_VIEWER` sieht interne **Punkte**, aber keine internen **Kommentare**, weil `internalComment` falsch ist. Interne Kommentare filtert die Serialisierung: ein Kommentar mit `isInternal` erscheint nur, wenn `internalComment` wahr ist.

### Auflösung

1. Hat die Mitgliedschaft eine gültige Projektrolle, gilt diese.
2. Sonst, und die Person ist `ADMIN`: `PLX_LEAD`.
3. Sonst ohne Mitgliedschaft: kein Zugriff.
4. Sonst Default: `ADMIN` → `PLX_LEAD`, `CUSTOMER` → `CUSTOMER_COMMENTER`, sonst `PLX_MEMBER`.
5. Eine PureLoX-Projektrolle auf einem Kundenkonto ergibt **keine** Fähigkeiten. Eine Kunden-Projektrolle auf einem PureLoX-Konto ebenfalls.

Für Kundenrollen werden die Rollen-Flags mit den Projekt-Flags **und**-verknüpft:

| Fähigkeit | Projekt-Flag |
| --- | --- |
| create | `customerCanCreate` (Default false) |
| edit | `customerCanEdit` (Default false) |
| comment | `customerCanComment` (Default true) |
| changeStatus | `customerCanChangeStatus` (Default false) |
| seeAudit | `customerCanSeeAudit` (Default false) |
| export | `customerCanExport` (Default false) |
| seeInternalOwners | `customerCanSeeInternalOwners` (Default true) |

Zusätzlich erzwungen für jede Kundenrolle: `seeInternal = false`, `manageProject = false`, `internalComment = false`, `manageUsers = false`.

`seeInternalOwners = false` ersetzt den Namen des internen Verantwortlichen durch **„Internes Team“**, leert E-Mail und Funktion. Initialen und Akzentfarbe bleiben die der echten Person. Ist kein interner Verantwortlicher gesetzt, ist das Feld leer.

### Sichtbarkeit von Punkten

`canSeeItem`: wer `seeInternal` hat, sieht alles. Alle anderen sehen nur `visibility = SHARED`.

Kunden können Sichtbarkeit und internen Verantwortlichen serverseitig nicht setzen. Neue Punkte von Kunden sind immer `SHARED`.

### Wer wen zuordnen darf

- `assign` / Rolle ändern / entfernen: `ADMIN` oder Projektrolle mit `manageProject` (also `PLX_LEAD`).
- Ein Kundenuser darf nur Projekten seines eigenen `organizationId` zugeordnet werden, sobald das Projekt ein Kundenunternehmen hat.
- Die Projektrolle muss zur globalen Rolle passen: Kunden nur `CUSTOMER_*`, PureLoX nur `PLX_*`.
- Wechselt die globale Rolle und die gespeicherte Projektrolle passt nicht mehr, fällt sie auf den Default der neuen Rolle zurück.
- Kandidaten in der Zugang-Seite: PureLoX-User immer; Kundenuser nur, wenn `organizationId` des Users gleich dem des Projekts ist. Schon zugeordnete Personen fehlen in der Auswahlliste.

### Kundenunternehmen eines Projekts wechseln

Nur `ADMIN`. Die Organisation muss `kind = CUSTOMER` sein. Protokoll: `Kunde des Projekts: {Name}`.

---

## 5. Fachwerte

### Status

`OFFEN` Offen · `IN_ARBEIT` In Arbeit · `WARTE_KUNDE` Wartet auf Kunde · `WARTE_INTERN` Wartet intern · `GELOEST` Gelöst · `VERWORFEN` Verworfen.

Reihenfolge ist die Spaltenreihenfolge der Tafel.

### Priorität

`KRITISCH` Kritisch · `HOCH` Hoch · `MITTEL` Mittel · `NIEDRIG` Niedrig.

### Kategorie

`TECHNIK` Technik · `KAUFMÄNNISCH` Kaufmännisch · `ORGANISATION` Organisation · `DOKUMENTATION` Dokumentation · `QUALITAET` Qualität · `SICHERHEIT` Sicherheit · `INBETRIEBNAHME` Inbetriebnahme · `SCHULUNG` Schulung · `SONSTIGES` Sonstiges.

### Sichtbarkeit

`SHARED` Mit Kunde geteilt · `INTERNAL` Nur intern.

### Nummern und Termine

`formatOpNumber(n)` → `OP-` plus dreistellig mit führenden Nullen.

Anzeige: `dd. MMM yyyy` und `dd. MMM yyyy, HH:mm` auf Deutsch. Überfällig: Zieldatum liegt vor dem heutigen Tagesbeginn und der Status ist weder `GELOEST` noch `VERWORFEN`.

Datumseingaben werden als `YYYY-MM-DDT12:00:00.000Z` gespeichert, damit die Kalendertagesanzeige nicht durch Zeitzonen verrutscht.

Wechselt der Status auf `GELOEST` oder `VERWORFEN` und `resolvedAt` ist leer, setzt der Server `resolvedAt` auf jetzt. Wechselt er auf einen anderen Status, wird `resolvedAt` geleert. `resolvedAt` ist kein direkt editierbares Feld. Diese Nebenwirkung erzeugt **keinen** eigenen Protokolleintrag; protokolliert wird der Statuswechsel.

---

## 6. Authentifizierung und Zugriffsschutz

Login vergleicht E-Mail (getrimmt, kleingeschrieben) und Passwort. Fehlertext: „E-Mail oder Passwort ist ungültig.“ Erfolg setzt das Cookie und leitet nach `/dashboard`.

JWT-Claims: `sub` (User-Id), `email`, `role`, `name`. Ablauf 14 Tage. Cookie: `httpOnly`, `sameSite: lax`, `path: /`, `maxAge` 14 Tage. Name: `klarpunkt_session`.

Jede geschützte Seite lädt den User **neu aus der Datenbank** anhand `sub`. Ein gelöschter User oder ein ungültiges Token gilt als ausgeloggt und führt zu `/login`. Logout löscht das Cookie und leitet zu `/login`.

`src/proxy.ts` prüft nur die **Anwesenheit** des Cookies, nicht die Signatur:

- Öffentliche Pfade (`/_next`, `favicon.ico`, `logo.svg`, Dateien auf `.png` / `.svg`) passieren.
- Ohne Cookie und nicht auf `/login`: Redirect nach `/login`.
- Mit Cookie auf `/login` oder `/`: Redirect nach `/dashboard`.
- Matcher: alles außer `_next/static`, `_next/image`, `favicon.ico`.

`/` selbst macht zusätzlich `redirect("/dashboard")`.

Fehlender Projektzugriff und fehlende Admin-Rechte liefern die projektinterne Not-Found-Seite, keine 403-API. Text: Überschrift „Diese Ansicht ist nicht freigegeben.“, Erklärung dass die Seite fehlt oder die Rolle sie nicht sehen darf, Button „Zurück zur Lage“.

---

## 7. Oberflächen

Visuelles System: helle Arbeitsfläche, Navy-Kopf, schmale Sidebar, dichte Tabellen, kleine Radien (`rounded-sm`), kaum Schatten. Schrift **Inter** über `next/font/google`, CSS-Variable `--font-inter`. `lang="de"`.

### Farben

| Token | Hex | Verwendung |
| --- | --- | --- |
| navy | `#00164d` | Kopfzeile, große Zahlen |
| navy-mid | `#002f69` | |
| brand | `#005acb` | Links, primäre Buttons, aktive Icons |
| brand-hover | `#014dad` | |
| ruby | `#cf1057` | aktive Nav-Marke, Kunden-Badges |
| cyan | `#289ff5` | Login-Kicker |
| canvas | `#eff5ff` | Seitenhintergrund |
| sidebar | `#f8f9fa` | Navigation, Tabellenkopf, gerade Zeilen |
| raised | `#ffffff` | Karten, Formulare |
| ink | `#212529` | Text |
| muted | `#6c757d` | Nebeninfo |
| line | `#dee2e6` | Rahmen |
| active | `#e2ecfd` | aktive Navigation, Zeilen-Hover |
| teal | `#00a9ce` | |
| danger | `#e3000f` | überfällig, Fehler |
| amber | `#d69e2e` | Priorität Mittel |
| ok | `#28a745` | Speicherbestätigung |

Status-Badges: Offen grau, In Arbeit blau, Wartet auf Kunde amber, Wartet intern indigo, Gelöst grün, Verworfen blass. Priorität ist ein farbiger Punkt plus Label: Kritisch danger, Hoch brand, Mittel amber, Niedrig muted.

Buttons: `.btn` weiß mit Rahmen, `.btn-primary` brand-blau weiß, `.fab` runder Plus-Button, `.field` volle Breite, Fokusring brand mit 15 % Deckkraft.

### Shell

Oben eine sticky Navy-Leiste, 48px, dreispaltig. Links der Menü-Button nur unter `lg`. Mitte das PureLoX-Wortmarken-Logo, Link nach `/dashboard`. Rechts eine dekorative Glocke ohne Funktion, Avatar und ab `md` der Name.

Darunter Sidebar 220px, ab `lg` sticky, darunter als Schublade mit Abdunklung. Oben die Navigation, unten Avatar, Name und bei Kunden die Organisation, sonst die Funktion, plus Abmelden.

Navigation, Gruppe „Management“:

- Lage → `/dashboard`
- Projekte → `/projects`
- nur Admin: Personen → `/admin/users`, Kunden → `/admin/customers`

Aktiv: Hintergrund `active`, Navy-Text, 3px rubinroter Strich links. Lage ist nur auf exakt `/dashboard` aktiv; die anderen Einträge auch auf Unterpfaden.

Seiteninhalt sitzt in `main` mit `px-8 py-6`, außer die Projekt-OPL, die den Bereich selbst füllt. Seitentitel sind 22px, semibold, daneben optional eine graue Anzahl.

### Login `/login`

Zweiteilig ab `lg`. Links Navy mit Wortmarke, Kicker „Klarpunkt · Offene-Punkte-Liste“, Überschrift „Wer darf was sehen — je Kunde, je Projekt, je Person.“, kurzer Absatz zur digitalen OPL, unten drei Stichworte: Kunde / Unternehmen zuordnen, Projekt / Personen mit Rolle, PureLoX / Nur zugewiesene Sicht. Rechts weißes Formular „Anmelden“. Auf kleinen Screens nur das Formular plus kompaktes Logo „PureLoX Klarpunkt“.

Felder E-Mail und Passwort, Button „Anmelden“ / „Anmelden…“. Darunter vier Demo-Karten, die die Felder füllen (Passwort überall `Klarpunkt2026`):

| Name | E-Mail | Beschriftung |
| --- | --- | --- |
| Lena Hofmann | admin@klarpunkt.local | PureLoX Administration |
| Jonas Weber | intern@klarpunkt.local | PureLoX Projektteam |
| Stefan Vogt | sicht@klarpunkt.local | PureLoX Einsicht |
| Dr. Anna Richter | kunde@klarpunkt.local | Kunde Nordwerk AG |

Vorbelegung des Formulars: Lena, Passwort `Klarpunkt2026`.

### Lage `/dashboard`

Begrüßung nach Stunde: vor 12 „Guten Morgen“, vor 18 „Guten Tag“, sonst „Guten Abend“, plus Vorname. Admin und Internal lesen den Satz über Register, Protokoll und Rollen. Kunden lesen, dass sie geteilte Punkte sehen und interne Notizen beim Lieferanten bleiben.

Kennzahlen über alle sichtbaren Projekte: offene Punkte (Status nicht gelöst/verworfen), davon überfällig, davon in eigener Verantwortung (interner oder Kunden-Owner ist der User), sowie wartend (`WARTE_KUNDE` für Kunden, `WARTE_INTERN` für alle anderen). Überfällig färbt die Zahl rot, sobald sie > 0 ist.

Links „Meine Punkte“, maximal 7, Link auf `/projects/{id}?item={itemId}`, Nummer, Titel, Statusbadge. Leer: „Aktuell keine Punkte in Ihrer Verantwortung.“

Rechts „Letzte Änderungen“, maximal 8 Audit-Events aus Projekten mit `seeAudit`, neueste zuerst, Events zu unsichtbaren Punkten herausgefiltert. Zeile: Summary, darunter Name, Projektcode, Zeitpunkt. Leer: „Noch kein Protokoll.“

**Ist-Zustand:** der Query-Parameter `item` wird von der Projektseite ignoriert, die Schublade öffnet sich nicht von allein. Baue das so. Die Links dürfen den Parameter trotzdem setzen.

### Projekte `/projects`

Tabelle: Code, Projekt (Name verlinkt auf die OPL, Beschreibung darunter), Kunde, Standort, rechts die Zahl aktiver sichtbarer Punkte, rechts die Zahl der Beteiligten. Zeilen wechseln den Hintergrund. Leerzustände für Standort: Gedankenstrich.

### OPL `/projects/[id]`

Kopf: Projektname, Anzahl der **gefilterten** Datensätze, zweite Zeile `Code · Kunde · Standort · Vorlage V5.0`. Aktionen: Aktualisieren (`router.refresh()`), zwei dekorative Icons Filter und Suche ohne eigene Aktion, Link Protokoll wenn `seeAudit`, Link Zugang wenn `manageProject`, Button „Excel V5.0“ wenn `export`, runder Plus-Button wenn `create`.

Vier Kennzahlen der ungefilterten sichtbaren Menge: Aktiv, Überfällig (rot wenn > 0, Hinweis „Termin gerissen“), Beim Kunden, Intern blockiert.

Filterleiste: Umschalter Tafel/Register (Default Tafel), Suche über Nummer, Titel, Beschreibung, Quelle, Status-Select, Priorität-Select (Optionen sind die Rohwerte `KRITISCH` usw., nicht die deutschen Labels), Checkbox „Meine“, Checkbox „Überfällig“.

**Tafel:** horizontale Spalten, 280px, eine je Status in der festen Reihenfolge. Kopf: Label in Kapitälchen und Anzahl. Karten sind Buttons. Drag nur wenn `changeStatus`. Pointer-Sensor mit 8px Aktivierungsstrecke, damit ein Klick die Schublade öffnet und kein Ziehen auslöst. Drop auf eine Status-Spalte ruft `updateItem` nur mit `{ status }` auf und refresht. Karte: Nummer, Priorität, Titel, Avatare intern und Kunde übereinander versetzt, Büroklammer plus Anzahl wenn Anhänge, Termin (rot und fett wenn überfällig). Interne Karten haben einen gestrichelten Rahmen. Leere Spalten bleiben sichtbar.

**Register:** Tabelle Nr., Offener Punkt, Status, Prio, Verantwortlich, Termin, Quelle. Interne Punkte zeigen unter dem Titel „Nur intern“. Klick auf die Zeile öffnet die Schublade. Leer: „Keine Punkte für diesen Filter.“

**Schublade** von rechts, max Breite `xl`, Abdunklung schließt. Kopf: Nummer, Titel als Input wenn `edit`, sonst Überschrift. Ohne Edit-Recht ein Hinweis, dass die Rolle Felder nicht ändern darf, plus der Zusatz zu Kommentaren wenn `comment`.

Raster: Status (aktiv wenn `changeStatus`), Priorität, Kategorie, Sichtbarkeit nur wenn `seeInternal` (sonst statisch „Erfasst am“), Zieltermin, Quelle, Verantwortlich intern (disabled ohne `edit` oder ohne `seeInternalOwners`; Optionen sind Projektmitglieder mit globaler Rolle ungleich `CUSTOMER`), Verantwortlich Kunde (Mitglieder mit `CUSTOMER`). Darunter Textareas Beschreibung, Maßnahme, der Dokumentenblock, Abschluss. Button „Änderungen speichern“ wenn `edit` oder `changeStatus`. Speichern schickt alle Felder als Patch; der Server ignoriert unveränderte Werte und unzulässige Felder.

Verlauf: Kommentare chronologisch aufsteigend, Avatar, Name, Kennzeichnung „Intern“, Zeitpunkt, Text. Leer: „Noch kein Kommentar.“ Eingabe wenn `comment`. Checkbox „Nur intern sichtbar“ nur bei `internalComment`. Leerer Text wird serverseitig abgelehnt.

**Anlegen-Dialog** wenn `create`: Titel Pflicht, Beschreibung, Maßnahme, Kategorie, Priorität Default `MITTEL`, Quelle, Termin, beide Verantwortliche, Sichtbarkeit nur wenn `seeInternal`. Submit legt an, schließt, refresht und öffnet die neue Schublade.

**Excel-Import** nur bei `manageProject`: kleine Beschriftung „Excel importieren“ fix unten rechts. Dateiauswahl `.xlsx,.xls` sendet das Formular sofort.

### Zugang `/projects/[id]/settings`

Sichtbar für `manageProject` oder `ADMIN`. Zurück-Link zur OPL.

1. Kunde des Projekts. Admin: Select der Kundenorganisationen plus „Kunde setzen“. Andere mit Zugang sehen nur den Namen.
2. Beteiligte: Liste mit Avatar, globaler Rolle, Organisation, Kurzbadge der Projektrolle, Select der erlaubten Projektrollen (speichert sofort), Button „Entfernen“. Darunter Formular Person + Rolle + „Zuordnen“. Sind keine Kandidaten da: Hinweis, dass Kundenuser nur dem eigenen Unternehmen zugewiesen werden. Darunter die sieben Rollen-Hilfetexte als Kacheln.
3. Kunden-Höchstgrenzen: sieben Checkboxen mit den Texten aus Abschnitt 4, Button „Kundenrechte speichern“, danach „Gespeichert und protokolliert.“

### Protokoll `/projects/[id]/audit`

Nur bei `seeAudit`. Zeitleiste, neueste zuerst. Events ohne Item oder mit sichtbarem Item. Karte: Avatar, Summary, Name, Organisation, Zeitpunkt, optional Punktnummer. Hat das Event ein Feld, eine Monozeile `{Feldlabel}: {alter Wert} → {neuer Wert}` mit deutschen Labels. Leere Werte werden zu „—“. Status, Priorität, Kategorie und Sichtbarkeit werden über ihre Labels angezeigt, andere Werte roh.

### Personen `/admin/users`

Nur Admin. Tabelle Name (Avatar, Link auf die Detailseite, E-Mail), Zugehörigkeit als Badge (Kunde rubin, sonst navy) plus Funktion, Unternehmen, Liste der Projekte als `Code · Projektrollenlabel`. Darunter Formular „Neue Person“: Name, E-Mail, Zugehörigkeit, Funktion, Unternehmen (gefiltert: Kunde sieht nur `CUSTOMER`-Orgs, sonst nur `PURELOX`; der Select setzt sich beim Rollenwechsel zurück), Passwort min. 8 Zeichen. Erfolg leitet auf die Detailseite.

### Person `/admin/users/[id]`

Nur Admin. Stammdaten wie oben, Passwort optional („Unverändert lassen“). Darunter Projekte: Tabelle mit Rollen-Select und Entfernen, plus Zuordnung aus den noch freien Projekten. Ein Kundenuser sieht in „verfügbar“ keine Projekte anderer Unternehmen.

### Kunden `/admin/customers`

Nur Admin. Tabelle Unternehmen, Typ-Badge, Anzahl Personen, Projektcodes als Links auf die jeweilige Zugang-Seite. Darunter Formular Name + Typ (`CUSTOMER` Default, oder `PURELOX`). Anlegen leert das Formular. Umbenennen schreibt `organization` aller User und `customerName` aller Projekte dieser Organisation mit.

### Dokumente am Punkt

Erlaubt: pdf, png, jpg, jpeg, gif, webp, svg, txt, csv, xlsx, xls, docx, doc, pptx, ppt, zip, msg, eml. Maximal 20 MB, keine leeren Dateien. Fehlertexte: „Dieser Dateityp ist nicht erlaubt. Erlaubt sind PDF, Bilder, Office, Text und ZIP.“ / „Die Datei ist leer.“ / „Die Datei ist größer als 20 MB.“

Der Originalname verliert Pfad, Steuerzeichen und wird auf 180 Zeichen gekürzt, Fallback `dokument`. MIME kommt aus der Endung, nicht aus dem Browser, außer die Endung ist unbekannt und der gemeldete Typ ist nicht `application/octet-stream`.

Upload und Löschen brauchen `edit` und Sicht auf den Punkt. Mehrere Dateien nacheinander. Drag-and-drop auf die Liste. Löschen fragt `window.confirm`. Jeder Upload und jedes Löschen schreibt Audit `UPLOAD` bzw. `DELETE` und setzt `updatedAt` des Punkts.

Vorschau: Bilder, PDF (iframe), Text/CSV (fetch und `<pre>`). Alles andere: Hinweis, lokal zu öffnen, plus Download. Escape und Klick auf die Abdunklung schließen. Download-URL `/api/attachments/{id}`, Vorschau dieselbe URL mit `?preview=1`.

Der GET-Handler verlangt eine gültige Session (401), findet den Anhang (404), prüft Projektzugriff und Punktsicht (403), liest die Datei (404 „Datei fehlt auf dem Server.“). Header: Content-Type aus der DB, Content-Length, Content-Disposition `inline` bei preview sonst `attachment` mit ASCII-Fallback und `filename*=UTF-8''`, `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`. Pfadprüfung: `storedName` darf kein `..` enthalten und muss `basename` von sich selbst sein.

Dateien liegen unter `UPLOAD_DIR` oder `./uploads`. Der Dateiname auf der Platte ist die UUID, nie der Originalname.

---

## 8. Serverregeln der Punkte

Alle Mutationen sind Server Actions und rufen danach `revalidatePath` für Dashboard, Projektliste, OPL, Protokoll und Zugang auf.

### Anlegen

`caps.create`. Nächste Nummer = max(number) + 1. Defaults: Kategorie `SONSTIGES`, Priorität `MITTEL`, Status `OFFEN`, Sichtbarkeit `SHARED` (Internal/Admin dürfen `input.visibility` setzen). Audit `CREATE`: `OP-00n „Titel“ angelegt`.

### Ändern

Nur Felder aus dieser Liste, und nur wenn sie im Patch vorkommen: title, description, measure, resolution, category, priority, status, visibility, source, dueDate, ownerInternalId, ownerCustomerId.

- Status: erlaubt bei `changeStatus` **oder** `edit`.
- Jedes andere Feld: nur bei `edit`.
- visibility und ownerInternalId: nur Internal/Admin.
- Leere Owner-Ids werden `null`.
- Identische Werte (über `stringifyValue`, Daten als ISO) erzeugen keinen Eintrag.
- Statuswechsel protokolliert `action: STATUS`, alles andere `UPDATE`.
- Summary: `{OP} · {Feldlabel}: {alt} → {neu}`.

Feldlabels: Offener Punkt, Beschreibung, Maßnahme, Abschluss, Kategorie, Priorität, Status, Sichtbarkeit, Quelle, Zieltermin, Erledigt am, Verantwortlich intern, Verantwortlich Kunde, Dokument.

### Kommentar

`caps.comment`, nicht leer nach `trim`. `isInternal` wird nur wahr, wenn der Client es will **und** `internalComment` gilt. Audit `COMMENT`: `{OP} · Interner Kommentar von {Name}` oder `{OP} · Kommentar von {Name}`.

### Kunden-Flags

Nur `manageProject`. Audit `PERMISSION` mit der kommaseparierten Liste der aktiven Freigaben: anlegen, bearbeiten, kommentieren, Status, Protokoll, Export, interne Namen. Sind alle aus: „keine Freigaben“.

### Mitglieder

Audit `PERMISSION`:

- Zuordnung: `{Name} zugeordnet als {Rollenlabel}`
- Rollenwechsel: `Rolle von {Name}: {Rollenlabel}`
- Entfernen: `{Name} aus dem Projekt entfernt`

### Validierung User

Name und E-Mail Pflicht. Passwort mindestens 8 Zeichen, beim Anlegen Pflicht, beim Ändern nur wenn gesetzt. `CUSTOMER` braucht eine Organisation vom Typ `CUSTOMER`. `ADMIN` und `INTERNAL` dürfen nicht an einer Kundenorganisation hängen. Ohne Organisation wird der Firmenname für PureLoX-Konten `PureLoX SOLUTIONS`, für Kunden leer. Fehlertexte deutsch und konkret, z. B. „Kundenkonten gehören zu einem Kundenunternehmen.“, „Nur die Administration darf Benutzer und Kunden steuern.“, „Nur Projektleitung oder Administration darf Beteiligte steuern.“

---

## 9. Excel V5.0

Export nur bei `caps.export`. Dateiname `{code}_Offene-Punkte_V5-0_{YYYY-MM-DD}.xlsx`. Die Action liefert `{ filename, base64 }`; der Browser baut einen Download-Link mit dem MIME-Typ von xlsx. Kunden ohne `seeInternal` exportieren nur `SHARED`.

Blattname `OPL`, Kopfzeile in Zeile 6 eingefroren.

Zeile 1, A1:O1 verbunden: `Offene-Punkte-Liste (OPL)  ·  Klarpunkt digital  ·  Vorlage V5.0`, Calibri 16 fett, Farbe `#1A1814`.

Metadaten: A2 „Projekt“ / B2 `{code}  —  {name}`; A3 „Kunde“ / B3 Kundenname; A4 „Standort / Stand“ / B4 `{site oder —}  ·  {heutiges deutsches Datum}`; L2 „Version“ / M2 „V5.0“; L3 „Punkte“ / M3 Anzahl.

Spalten ab Zeile 6, Schrift Calibri 10, fett, cremefarben `#FAF7F1` auf `#1A1814`:

| Spalte | Kopf | Breite | Inhalt |
| --- | --- | --- | --- |
| A | Nr. | 10 | `OP-00n` |
| B | Erfasst am | 14 | `de-DE`-Datum |
| C | Quelle / Meeting | 22 | source |
| D | Kategorie | 16 | deutsches Label |
| E | Offener Punkt | 36 | title |
| F | Beschreibung | 40 | |
| G | Maßnahme | 36 | |
| H | Verantw. intern | 22 | Name oder leer |
| I | Verantw. Kunde | 22 | Name oder leer |
| J | Priorität | 12 | deutsches Label |
| K | Status | 18 | deutsches Label |
| L | Zieltermin | 14 | |
| M | Erledigt am | 14 | |
| N | Sichtbarkeit | 16 | deutsches Label |
| O | Abschluss / Begründung | 32 | |

Datenzeilen umbrechen, Höhe 36, jede zweite Zeile Füllung `#F3EEE4`. Sortierung nach Nummer aufsteigend.

### Import

Nur `manageProject` (die Fehlermeldung sagt „Import nur intern möglich.“). Erstes Arbeitsblatt. Die Kopfzeile ist die erste Zeile in 1…12, deren Zellen kleingeschrieben `status`, `offener punkt` oder `nr` enthalten. Spalten werden per Teilstring gefunden, Reihenfolge der Suche:

- Nummer: nr, nummer, op-
- Erfasst: erfasst, datum
- Quelle: quelle, meeting
- Kategorie: kategorie
- Titel: offener punkt, titel, thema
- Beschreibung: beschreibung
- Maßnahme: maßnahme, massnahme
- Intern: verantw. intern, verantwortlich intern, intern
- Kunde: verantw. kunde, verantwortlich kunde, kunde
- Priorität: priorität, prio
- Status: status
- Zieltermin: zieltermin, fälligkeit, termin
- Erledigt: erledigt
- Sichtbarkeit: sichtbarkeit, intern/kunde
- Abschluss: abschluss, begründung

Leere Titelzeilen werden übersprungen; fehlt der Titel, dient die Beschreibung als Titel. Enums akzeptieren den Rohwert oder das deutsche Label, sonst Fallback `OFFEN` / `MITTEL` / `SONSTIGES` / `SHARED`. Alles außer exakt `INTERNAL` wird `SHARED`. Verantwortliche werden über exakten Namen oder exakte E-Mail, kleingeschrieben, auf **alle** User aufgelöst; kein Treffer bleibt leer. Datum: Date-Objekt, `Date.parse`, oder `d.m.yy(yy)`.

Importierte Punkte bekommen **neue** Nummern ab dem bisherigen Maximum, die Excel-Nummer wird ignoriert. `createdById` ist der importierende User. Je Punkt ein Audit `IMPORT` „`OP-00n` aus Excel-Vorlage importiert“, danach ein projektweites Audit „`{n}` offene Punkte aus Excel importiert (Vorlage V5.0)“.

---

## 10. Demo-Daten

Seed löscht vorher Audits, Kommentare, Anhänge, Punkte, Mitgliedschaften, Projekte, User und Organisationen und leert das Upload-Verzeichnis. Passwort aller Personen: `Klarpunkt2026`.

Organisationen: PureLoX SOLUTIONS (`PURELOX`), Nordwerk AG (`CUSTOMER`), Hölzer Logistik GmbH (`CUSTOMER`).

| Person | E-Mail | Rolle | Funktion | Organisation | Kürzel | Farbe |
| --- | --- | --- | --- | --- | --- | --- |
| Lena Hofmann | admin@klarpunkt.local | ADMIN | Projektleiterin | PureLoX | LH | `#005acb` |
| Jonas Weber | intern@klarpunkt.local | INTERNAL | Inbetriebnahme / Engineering | PureLoX | JW | `#00a9ce` |
| Miriam Cole | doku@klarpunkt.local | INTERNAL | Dokumentation & QS | PureLoX | MC | `#002f69` |
| Stefan Vogt | sicht@klarpunkt.local | INTERNAL | Controlling | PureLoX | SV | `#014dad` |
| Dr. Anna Richter | kunde@klarpunkt.local | CUSTOMER | Projektleiterin Kunde | Nordwerk | AR | `#cf1057` |
| Thomas Krüger | betrieb@klarpunkt.local | CUSTOMER | Betriebsleiter | Nordwerk | TK | `#289ff5` |
| Petra Hölzer | hoelzer@klarpunkt.local | CUSTOMER | Technische Leitung | Hölzer | PH | `#cf1057` |

Projekt **NW-2026-014** „Verpackungslinie VL-400“, Nordwerk AG, Werk Leipzig. Beschreibung: Lieferung, Montage und Inbetriebnahme der Verpackungslinie VL-400 inkl. Schnittstelle zum vorhandenen SAP-MES. Kunden-Flags: nur `customerCanComment` und `customerCanSeeInternalOwners` an, der Rest aus.

Mitgliedschaften Nordwerk: Lena `PLX_LEAD`, Jonas `PLX_MEMBER`, Miriam `PLX_MEMBER`, Stefan `PLX_VIEWER`, Anna `CUSTOMER_COMMENTER`, Thomas `CUSTOMER_VIEWER`.

Projekt **HL-2025-008** „Hallenkran Retrofit HK-12“, Hölzer Logistik GmbH, Halle 3 Magdeburg. Beschreibung: Steuerungstausch und Sicherheitsnachrüstung am Hallenkran HK-12. Alle Kunden-Flags an. Mitgliedschaften: Lena `PLX_LEAD`, Jonas `PLX_MEMBER`, Petra `CUSTOMER_EDITOR`. Stefan, Anna, Thomas, Miriam sind nicht dabei.

### Punkte Nordwerk

Lege zu jedem Punkt die beschriebenen Kommentare und Historien-Events mit den genannten Zeitpunkten an. Historie-Felder `field`/`oldValue`/`newValue` nur wo genannt.

| Nr | Titel | Kat. | Prio | Status | Sicht | Owner intern / Kunde | Termin | Besonderes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Freigabe Aufstellplan Halle 4 ausstehend | ORGANISATION | HOCH | WARTE_KUNDE | SHARED | Lena / Anna | 2026-08-29 | Quelle Kick-off 12.06.2026, erfasst 12.06. 09:30. Kommentare Lena 18.08. 14:10 (Rev. C im Kundenportal, Freigabe bis Freitag) und Anna 19.08. 08:42 (Prüfung in der Werksplanung, Rückmeldung Mittwoch). Historie CREATE 12.06. „OP-001 angelegt“; UPDATE status OFFEN→WARTE_KUNDE am 18.08. 14:12, Summary „Status: Offen → Wartet auf Kunde“. Maßnahme: Nordwerk prüft Rev. C gegen Hallenaufmaß. |
| 2 | Schnittstelle SAP-MES: Telegramm 14 unklar | TECHNIK | KRITISCH | IN_ARBEIT | SHARED | Jonas / Thomas | 2026-08-26 | Quelle Abstimmung Software 03.07.2026. Kommentar Jonas 20.08. 16:05 (Byte-Belegung als PDF an Thomas). Historie CREATE 03.07.; UPDATE priority HOCH→KRITISCH am 15.08. 11:20. Zwei Anhänge von Jonas, siehe unten. |
| 3 | CE-Konformitätserklärung Linie – Restpunkte Sicherheitszaun | SICHERHEIT | KRITISCH | IN_ARBEIT | SHARED | Jonas / — | 2026-09-04 | Quelle Risikobeurteilung 22.07.2026, angelegt von Lena. Interner Kommentar Miriam 12.08. 09:00: Lieferzeit Zuhaltungen 10 AT, Bestellung ist draußen. |
| 4 | Ersatzteilliste Inbetriebnahme fehlt in deutscher Fassung | DOKUMENTATION | MITTEL | OFFEN | SHARED | Miriam / Anna | 2026-09-11 | Quelle Jour fixe 05.08.2026, angelegt von Miriam. |
| 5 | Medienbereitstellung Druckluft 8 bar am Aufstellort | INBETRIEBNAHME | HOCH | WARTE_KUNDE | SHARED | Jonas / Thomas | 2026-08-21 | Quelle Schnittstellengespräch 28.07.2026. Kommentar Thomas 22.08. 07:55: Kompressor-Wartung diese Woche, Messung folgt Montag. Termin liegt in der Demo vor „heute“ im Oktober 2026, der Punkt ist überfällig. |
| 6 | Interne Kalkulation Mehrleistung Folienwechsel | KAUFMÄNNISCH | HOCH | IN_ARBEIT | INTERNAL | Lena / — | 2026-08-28 | Quelle Internes PM 08.08.2026. Interner Kommentar Lena 14.08. 10:22: Einkauf 18,4 T€ Material, Montage ca. 6 AT, nicht gegenüber Nordwerk kommunizieren. Historie CREATE „OP-006 angelegt (nur intern)“; UPDATE visibility SHARED→INTERNAL um 15:04. |
| 7 | Schulung Bediener Schicht A/B terminiert | SCHULUNG | MITTEL | GELOEST | SHARED | Miriam / Anna | 2026-08-20, erledigt 19.08. 16:00 | Abschluss: Termine bestätigt, Teilnehmerliste liegt vor, Schulungsraum Halle 4 Besprechungsraum 2. Historie CREATE durch Lena; UPDATE status WARTE_KUNDE→GELOEST durch Miriam. |
| 8 | FAT-Protokoll Position 12 – Geräuschmessung nachreichen | QUALITAET | MITTEL | OFFEN | SHARED | Jonas / Thomas | 2026-09-18 | Quelle FAT 01.08.2026. |
| 9 | Zugang Werksausweis für Montagecrew KW 36 | ORGANISATION | HOCH | WARTE_INTERN | SHARED | Lena / Anna | 2026-08-27 | Quelle Montageplanung 11.08.2026. Interner Kommentar Lena 21.08. 09:18: zwei Personalbögen fehlen noch. |
| 10 | Lackierung RAL 5010 abweichend vom Corporate Design | TECHNIK | NIEDRIG | VERWORFEN | SHARED | Lena / Anna | 2026-08-01, erledigt 29.07. | Abschluss: Kunde verzichtet, RAL 5010 bleibt, Mail Richter 29.07. Historie status OFFEN→VERWORFEN. |
| 11 | Reserve-I/O für spätere Waagenanbindung vorsehen | TECHNIK | NIEDRIG | OFFEN | SHARED | Jonas / Thomas | 2026-09-08 | Quelle Jour fixe 19.08.2026. |
| 12 | Interne Lessons-Learned FAT-Checkliste | QUALITAET | NIEDRIG | IN_ARBEIT | INTERNAL | Miriam / — | 2026-09-01 | Quelle Internes Review 04.08.2026. Historie CREATE „OP-012 angelegt (nur intern)“. |

Beschreibungen und Maßnahmen dürfen sinngemäß den Seed-Text aus Abschnitt 1 der Produktidee treffen; für eine treue Demo übernimm die Formulierungen aus `prisma/seed.ts`, falls die Datei vorliegt. Inhaltlich müssen die Fakten oben stimmen, damit die Abnahme greift.

Anhänge an OP-002, hochgeladen von Jonas am 20.08.2026:

- `Telegramm-14-Bytebelegung.pdf` um 16:00, ein minimales einseitiges PDF (Helvetica, Titel und vier Zeilen: Byte 7 Status Palettenhub, Byte 8 Sequenznummer, Byte 9 Reserve/Quittung, Stand 20.08.2026 Jonas Weber). Der Seed baut dieses PDF selbst, ohne Bibliothek.
- `Rueckfragen-MES.txt` um 16:02, UTF-8, offene Fragen an Nordwerk IT zu Quittung auf Byte 9 und Timeout.
- Audit UPLOAD nur für das PDF: „OP-002 · Dokument hinterlegt: Telegramm-14-Bytebelegung.pdf“.

Punkt Hölzer Nr. 1: „Not-Halt-Kreis Brücke vs. Katze – Verdrahtung prüfen“, SICHERHEIT, KRITISCH, IN_ARBEIT, SHARED, Owner Jonas, angelegt von Lena am 02.08.2026 09:00, Termin 28.08.2026, Quelle Begehung 02.08.2026, Beschreibung „Bestandsplan 2012 weicht von der Vor-Ort-Aufnahme ab.“, Maßnahme „Aufmaß durch Weber, Abgleich mit Schaltplan, Foto-Dokumentation.“ Audit CREATE.

Zusätzliches Projekt-Audit Nordwerk, Lena, 12.06.2026 08:00, ohne Item: „Kundenrechte gesetzt: Kommentieren ja, Anlegen/Bearbeiten nein, Protokoll nein“.

Erwartetes Verhalten der Demo:

- Anna sieht Nordwerk, kommentiert, legt nicht an, sieht OP-006 und OP-012 nicht, sieht den internen Kommentar an OP-003 nicht, sieht kein Protokoll, kein Excel, keinen Zugang. Hölzer sieht sie nicht.
- Thomas sieht Nordwerk nur lesend.
- Stefan sieht Nordwerk inklusive interner Punkte, ändert nichts, sieht interne Kommentare nicht, sieht Hölzer nicht.
- Jonas arbeitet in beiden Projekten, steuert keine Mitglieder.
- Lena sieht beide Projekte, Zugang, Import, Personen und Kunden.
- Petra bearbeitet Hölzer, weil dort die Höchstgrenzen offen sind und ihre Rolle `CUSTOMER_EDITOR` ist.

---

## 11. Betrieb

### Docker, empfohlen

`Dockerfile` basiert auf `node:22.14.0-bookworm-slim`, installiert `openssl` und `ca-certificates`. Mehrstufig: `deps` (`npm ci` mit `package.json`, Lockfile, `prisma/`), `builder` (`prisma generate` und `next build` mit `DATABASE_URL=file:./dev.db`), `development` (Quelltext, Entrypoint, `npm run dev`), `runner` (Production).

Der Runner kopiert `node_modules`, `.next`, `public`, `prisma`, Package-Dateien, `next.config.ts`, `src/lib/files.ts` und `src/lib/file-meta.ts` (der Seed importiert sie, der Next-Build enthält sie nicht) und `docker/entrypoint.sh`. Er bleibt **root**. Ein rekursives `chown` über `node_modules` ist absichtlich nicht drin, weil das unter Docker Desktop für Windows minutenlang wirkt. Volume `/data`.

`docker-compose.yml`: Image `klarpunkt:local`, Container `klarpunkt`, Port 3000, Volume `klarpunkt-data:/data`, Restart unless-stopped, Healthcheck per `fetch('http://127.0.0.1:3000/login')`. `AUTH_SECRET` aus der Umgebung oder Fallback `klarpunkt-docker-local-secret-bitte-ersetzen`.

`docker-compose.dev.yml`: Target `development`, Image `klarpunkt:dev`, Container `klarpunkt-dev`, Bind-Mount des Repos nach `/app`, separates Volume für `/app/node_modules`, Volume für `/data`, `WATCHPACK_POLLING` und `CHOKIDAR_USEPOLLING` auf `true`.

Entrypoint:

1. `/data` und `/data/uploads` anlegen.
2. `npm ci`, falls `next` oder `@prisma/client` fehlen.
3. `prisma generate`, falls der Client fehlt.
4. `prisma db push --skip-generate --accept-data-loss=false`.
5. User zählen. Bei 0 den Seed laufen lassen, sonst überspringen.
6. `exec` des CMD.

Lokal ohne Docker: `.env` aus dem Example, `npm install`, `npm run setup`, `npm run dev`, http://localhost:3000.

Prisma-Client als Singleton an `globalThis` hängen, solange `NODE_ENV` nicht `production` ist, damit der Dev-Server keine Verbindungsflut öffnet. Logs: in Development `error` und `warn`, sonst nur `error`. Generator `binaryTargets`: `native` und `debian-openssl-3.0.x`.

### Marke

Header-Logo ist die PureLoX-Wortmarke in Weiß, SVG, viewBox `0 0 387 115.21`, `fill="currentColor"`. Das Zeichen daneben (Login, mobil) ist ein zweiteiliges rubinrotes Signet, viewBox `0 0 48 48`, Füllung `#cf1057`. Übernimm `src/components/logo.tsx` und die Dateien in `public/` (`purelox-wordmark.svg`, `purelox-wordmark-navy.svg`, `purelox-mark.png`, `favicon.png`), wenn der Quellbaum vorliegt. Favicon der App: `/favicon.png`. Metadata-Titel: „Klarpunkt — PureLoX Offene-Punkte-Liste“.

---

## 12. Dateien, die entstehen sollen

```
prisma/schema.prisma
prisma/seed.ts
src/proxy.ts
src/lib/db.ts
src/lib/auth.ts
src/lib/session-cookie.ts
src/lib/constants.ts
src/lib/roles.ts
src/lib/permissions.ts
src/lib/audit.ts
src/lib/dates.ts
src/lib/serialize.ts
src/lib/excel.ts
src/lib/files.ts
src/lib/file-meta.ts
src/app/layout.tsx
src/app/page.tsx
src/app/globals.css
src/app/login/page.tsx
src/app/api/attachments/[id]/route.ts
src/app/actions/auth.ts
src/app/actions/items.ts
src/app/actions/admin.ts
src/app/actions/attachments.ts
src/app/actions/excel.ts
src/app/(app)/layout.tsx
src/app/(app)/not-found.tsx
src/app/(app)/dashboard/page.tsx
src/app/(app)/projects/page.tsx
src/app/(app)/projects/[id]/page.tsx
src/app/(app)/projects/[id]/settings/page.tsx
src/app/(app)/projects/[id]/audit/page.tsx
src/app/(app)/admin/users/page.tsx
src/app/(app)/admin/users/[id]/page.tsx
src/app/(app)/admin/customers/page.tsx
src/components/shell.tsx
src/components/app-nav.tsx
src/components/logo.tsx
src/components/ui.tsx
src/components/page-header.tsx
src/components/login-form.tsx
src/components/opl-workspace.tsx
src/components/item-documents.tsx
src/components/permission-form.tsx
src/components/member-manager.tsx
src/components/user-editor.tsx
src/components/user-projects-editor.tsx
src/components/organization-editor.tsx
src/components/project-customer-form.tsx
Dockerfile
docker/entrypoint.sh
docker-compose.yml
docker-compose.dev.yml
.env.example
README.md
```

Die OPL-Arbeitsfläche ist eine Client-Komponente und bekommt ein serialisiertes Payload: User, Projekt, sichtbare Punkte inkl. Kommentare und Anhänge, Mitglieder als Personen, Fähigkeiten. Serverkomponenten laden und serialisieren. Datumsfelder gehen als ISO-Strings über die Grenze, nie als `Date`.

Personen-Typ für den Client: id, name, initials, accent, role, title, organization, email.

---

## 13. Abnahme

Prüfe nach dem Seed mit den vier Login-Karten. Die App gilt als nachgebaut, wenn Folgendes stimmt:

1. Lena sieht Lage mit beiden Projekten, Personen und Kunden. Sie legt auf Nordwerk einen Punkt an, zieht ihn auf der Tafel, speichert ein Feld und sieht je Änderung eine Zeile im Protokoll mit altem und neuem Wert.
2. Anna sieht nur Nordwerk, nicht OP-006 und nicht OP-012, nicht den internen Kommentar an OP-003, keinen Button zum Anlegen, kein Protokoll, keinen Excel-Export. Ein Kommentar von ihr erscheint im Verlauf und im Protokoll von Lena.
3. Stefan sieht die internen Punkte, kann sie nicht ändern, sieht die internen Kommentare nicht und sieht Hölzer nicht.
4. Thomas kann Nordwerk nur lesen. Petra kann auf Hölzer einen Punkt anlegen und Felder ändern.
5. Ein interner Punkt bleibt nach dem Export von Anna aus der Datei; in Lenas Export ist er drin. Der Dateiname folgt dem Muster oben, die Kopfzeile sitzt in Zeile 6, Labels sind deutsch.
6. Ein Reimport durch Lena legt neue Nummern an und protokolliert `IMPORT`.
7. An OP-002 lassen sich PDF-Vorschau, Textvorschau und Download öffnen. Eine `.exe` und eine Datei über 20 MB werden abgelehnt. Ohne Session liefert der Anhang 401, Annas Session auf ein internes Dokument 403.
8. Kunden-Höchstgrenze „Kommentieren“ aus: Anna kann nicht mehr kommentieren, auch mit Rolle `CUSTOMER_COMMENTER`. Rolle auf `CUSTOMER_EDITOR` heben, ohne die Flags zu öffnen: sie kann trotzdem nicht anlegen.
9. Ein Kundenuser von Hölzer lässt sich Nordwerk nicht zuordnen. Ein PureLoX-User lässt sich keiner Kunden-Projektrolle zuordnen.
10. Docker-Entrypoint seedet nur eine leere Datenbank. Ein zweiter Start behält Punkte und Uploads unter `/data`.

---

## 14. Bewusst nicht vorhanden

Baue das nicht dazu:

- Anlegen, Archivieren oder Löschen von Projekten in der Oberfläche
- Löschen von Personen oder Organisationen
- Echte Benachrichtigungen hinter dem Glocken-Icon
- Eine Wirkung der beiden Icons Filter und Suche im OPL-Kopf; Filtern passiert in der Leiste darunter
- Automatisches Öffnen der Schublade über `?item=`
- Passwort-Reset, E-Mail-Versand, Mehrfaktor, Registrierung
- Feingranulare Feldrechte innerhalb eines Punkts über `edit` und `changeStatus` hinaus
- Volltextsuche über Dokumentinhalte
- Tests, CI-Workflows oder ein zweites Datenbank-System

Die Glocke und die beiden Kopf-Icons bleiben sichtbar und ohne Aktion, weil die Leiste sonst leer wirkt.
