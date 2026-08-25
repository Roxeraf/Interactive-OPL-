import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-navy text-white lg:flex lg:flex-col lg:justify-between">
        <div className="relative px-14 pt-16">
          <div className="mb-10 flex items-center gap-3">
            <Logo className="h-9 w-9" />
            <span className="text-sm font-semibold tracking-wide">Klarpunkt</span>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
            Customer Project · OPL V5.0
          </p>
          <h1 className="mt-8 max-w-xl text-4xl font-semibold leading-tight tracking-tight">
            Offene Punkte verdienen ein Protokoll, kein Tabellenblatt.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/75">
            Klarpunkt überführt die genormte Offene-Punkte-Liste in eine gemeinsame Lage: wer hat was
            geändert, was sieht der Kunde, was bleibt intern.
          </p>
        </div>
        <dl className="relative grid grid-cols-3 gap-6 border-t border-white/10 px-14 py-10 text-sm">
          <div>
            <dt className="text-white/50">Vorlage</dt>
            <dd className="mt-1 font-medium">XXXX_Offene-Punkte_V5-0</dd>
          </div>
          <div>
            <dt className="text-white/50">Protokoll</dt>
            <dd className="mt-1 font-medium">Feldgenau, personenbezogen</dd>
          </div>
          <div>
            <dt className="text-white/50">Kunde</dt>
            <dd className="mt-1 font-medium">Rechte je Projekt</dd>
          </div>
        </dl>
      </section>
      <section className="flex items-center justify-center bg-raised px-6 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo className="h-8 w-8" />
            <span className="text-lg font-semibold">Klarpunkt</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Anmelden</h2>
          <p className="mt-2 mb-8 text-sm text-muted">
            Internes Team und Kunden nutzen dieselbe OPL — mit unterschiedlichen Rechten.
          </p>
          <LoginForm />
        </div>
      </section>
    </div>
  );
}
