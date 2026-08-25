import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-sidebar text-[#f3eee4] lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 draft-grid opacity-30" />
        <div className="relative px-14 pt-16">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#c4b8a5]">
            Customer Project · OPL V5.0
          </p>
          <h1 className="mt-10 max-w-xl font-display text-6xl leading-[1.05] tracking-tight">
            Offene Punkte verdienen ein Protokoll, kein Tabellenblatt.
          </h1>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-[#d9d0c1]">
            Klarpunkt überführt die genormte Offene-Punkte-Liste in eine gemeinsame Lage:
            wer hat was geändert, was sieht der Kunde, was bleibt intern.
          </p>
        </div>
        <dl className="relative grid grid-cols-3 gap-6 border-t border-white/10 px-14 py-10 text-sm">
          <div>
            <dt className="text-[#c4b8a5]">Vorlage</dt>
            <dd className="mt-1 font-medium">XXXX_Offene-Punkte_V5-0</dd>
          </div>
          <div>
            <dt className="text-[#c4b8a5]">Protokoll</dt>
            <dd className="mt-1 font-medium">Feldgenau, personenbezogen</dd>
          </div>
          <div>
            <dt className="text-[#c4b8a5]">Kunde</dt>
            <dd className="mt-1 font-medium">Rechte je Projekt</dd>
          </div>
        </dl>
      </section>
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <p className="font-display text-4xl tracking-tight lg:hidden">Klarpunkt</p>
          <h2 className="font-display text-3xl tracking-tight">Anmelden</h2>
          <p className="mt-2 mb-8 text-sm text-muted">
            Internes Team und Kunden nutzen dieselbe OPL — mit unterschiedlichen Rechten.
          </p>
          <LoginForm />
        </div>
      </section>
    </div>
  );
}
