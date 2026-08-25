import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
      <p className="font-mono text-xs tracking-[0.22em] text-copper">Kein Zugriff</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">Diese Ansicht ist nicht freigegeben.</h1>
      <p className="mt-3 max-w-md text-muted">
        Die Seite existiert nicht — oder Ihre Rolle darf sie in diesem Projekt nicht sehen.
        Interne Protokolle und Kundenrechte bleiben beim Lieferanten, solange sie nicht explizit geöffnet werden.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-copper"
      >
        Zurück zur Lage
      </Link>
    </main>
  );
}
