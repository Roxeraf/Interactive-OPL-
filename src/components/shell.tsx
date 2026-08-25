import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth";
import { Avatar } from "./ui";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const nav = [
    { href: "/dashboard", label: "Lage" },
    { href: "/projects", label: "Projekte" },
    ...(user.role === "ADMIN" ? [{ href: "/admin/users", label: "Personen" }] : []),
  ];

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="sticky top-0 flex h-screen w-[240px] shrink-0 flex-col bg-sidebar text-[#f3eee4]">
        <div className="px-6 pt-8 pb-10">
          <Link href="/dashboard" className="block">
            <p className="font-display text-3xl leading-none tracking-tight">Klarpunkt</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-[#c4b8a5]">
              Digitale OPL · V5.0
            </p>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2.5 text-sm text-[#e8dfd0] transition hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <Avatar
              person={{
                initials: user.initials,
                accent: user.accent,
                name: user.name,
              }}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-[11px] text-[#c4b8a5]">
                {user.role === "CUSTOMER" ? user.organization : user.title}
              </p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-[#c4b8a5] hover:text-white"
            >
              Abmelden
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
