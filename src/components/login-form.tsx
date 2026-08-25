"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/app/actions/auth";

const ACCOUNTS = [
  {
    email: "admin@klarpunkt.local",
    role: "Projektleitung intern",
    name: "Lena Hofmann",
  },
  {
    email: "intern@klarpunkt.local",
    role: "Engineering",
    name: "Jonas Weber",
  },
  {
    email: "kunde@klarpunkt.local",
    role: "Kunde Nordwerk AG",
    name: "Dr. Anna Richter",
  },
];

export function LoginForm() {
  const [email, setEmail] = useState("admin@klarpunkt.local");
  const [password, setPassword] = useState("Klarpunkt2026");
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return loginAction(formData);
    },
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          E-Mail
        </span>
        <input
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-line bg-raised px-3.5 py-3 text-sm outline-none ring-copper/30 focus:ring-2"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          Passwort
        </span>
        <input
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-line bg-raised px-3.5 py-3 text-sm outline-none ring-copper/30 focus:ring-2"
        />
      </label>

      {state?.error ? (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:bg-copper disabled:opacity-60"
      >
        {pending ? "Anmelden…" : "In die Lage gehen"}
      </button>

      <div className="mt-2">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          Demo-Zugänge · Passwort Klarpunkt2026
        </p>
        <div className="flex flex-col gap-2">
          {ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => {
                setEmail(a.email);
                setPassword("Klarpunkt2026");
              }}
              className="flex items-center justify-between rounded-xl border border-line bg-paper px-3 py-2 text-left text-sm transition hover:border-copper/40"
            >
              <span>
                <span className="block font-medium">{a.name}</span>
                <span className="text-xs text-muted">{a.email}</span>
              </span>
              <span className="text-[11px] uppercase tracking-wider text-copper">{a.role}</span>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
