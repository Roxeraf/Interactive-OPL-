import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Kein Zugriff</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Diese Ansicht ist nicht freigegeben.</h1>
      <p className="mt-3 max-w-md text-sm text-muted">
        Die Seite existiert nicht — oder Ihre Rolle darf sie in diesem Projekt nicht sehen. Interne
        Protokolle und Kundenrechte bleiben beim Lieferanten, solange sie nicht explizit geöffnet werden.
      </p>
      <Link href="/dashboard" className="btn-primary mt-8">
        Zurück zur Lage
      </Link>
    </main>
  );
}
