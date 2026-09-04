"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/app/actions/auth";

const ACCOUNTS = [
  {
    email: "admin@klarpunkt.local",
    role: "PureLoX Administration",
    name: "Lena Hofmann",
  },
  {
    email: "intern@klarpunkt.local",
    role: "PureLoX Projektteam",
    name: "Jonas Weber",
  },
  {
    email: "sicht@klarpunkt.local",
    role: "PureLoX Einsicht",
    name: "Stefan Vogt",
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
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          E-Mail
        </span>
        <input
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          Passwort
        </span>
        <input
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field"
        />
      </label>

      {state?.error ? (
        <p className="rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
      ) : null}

      <button type="submit" disabled={pending} className="btn-primary h-10 w-full text-sm">
        {pending ? "Anmelden…" : "Anmelden"}
      </button>

      <div className="mt-2">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
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
              className="flex items-center justify-between rounded-sm border border-line bg-raised px-3 py-2 text-left text-sm transition hover:border-brand/40"
            >
              <span>
                <span className="block font-medium">{a.name}</span>
                <span className="text-xs text-muted">{a.email}</span>
              </span>
              <span className="text-[11px] font-medium text-brand">{a.role}</span>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
