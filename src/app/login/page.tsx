import { LoginForm } from "@/components/login-form";
import { LogoMark, Wordmark } from "@/components/logo";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-navy text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(1200px 400px at 10% 0%, rgba(40,159,245,0.35), transparent 55%), radial-gradient(800px 500px at 90% 100%, rgba(207,16,87,0.28), transparent 50%)",
          }}
        />
        <div className="relative px-14 pt-16">
          <div className="mb-10 flex items-center gap-3">
            <Wordmark className="h-8 w-auto text-white" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan">
            Klarpunkt · Offene-Punkte-Liste
          </p>
          <h1 className="mt-8 max-w-xl text-4xl font-semibold leading-tight tracking-tight">
            Wer darf was sehen — je Kunde, je Projekt, je Person.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/75">
            Die digitale OPL für Customer Project: Rollen für PureLoX und Kunden, geteilte Punkte
            für den Auftraggeber, interne Lage nur im Team.
          </p>
        </div>
        <dl className="relative grid grid-cols-3 gap-6 border-t border-white/10 px-14 py-10 text-sm">
          <div>
            <dt className="text-white/50">Kunde</dt>
            <dd className="mt-1 font-medium">Unternehmen zuordnen</dd>
          </div>
          <div>
            <dt className="text-white/50">Projekt</dt>
            <dd className="mt-1 font-medium">Personen mit Rolle</dd>
          </div>
          <div>
            <dt className="text-white/50">PureLoX</dt>
            <dd className="mt-1 font-medium">Nur zugewiesene Sicht</dd>
          </div>
        </dl>
      </section>
      <section className="flex items-center justify-center bg-raised px-6 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <LogoMark className="h-8 w-8" />
            <span className="text-lg font-semibold text-navy">PureLoX Klarpunkt</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-navy">Anmelden</h2>
          <p className="mt-2 mb-8 text-sm text-muted">
            Internes Team und Kunden nutzen dieselbe OPL — mit unterschiedlichen Rechten.
          </p>
          <LoginForm />
        </div>
      </section>
    </div>
  );
}
