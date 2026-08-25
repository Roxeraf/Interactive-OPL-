import Link from "next/link";
import { Bell, Clock3, LogOut, Menu, Search, Star } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth";
import { AppNav } from "./app-nav";
import { Avatar } from "./ui";
import { Logo } from "./logo";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between bg-navy px-3 text-white">
        <div className="flex w-[220px] items-center gap-1">
          <HeaderIcon label="Menü">
            <Menu className="h-5 w-5" strokeWidth={1.6} />
          </HeaderIcon>
          <HeaderIcon label="Verlauf">
            <Clock3 className="h-5 w-5" strokeWidth={1.6} />
          </HeaderIcon>
          <HeaderIcon label="Favoriten">
            <Star className="h-5 w-5" strokeWidth={1.6} />
          </HeaderIcon>
          <HeaderIcon label="Suche">
            <Search className="h-5 w-5" strokeWidth={1.6} />
          </HeaderIcon>
        </div>

        <Link href="/dashboard" className="flex items-center gap-2" aria-label="Klarpunkt">
          <Logo />
        </Link>

        <div className="flex w-[220px] items-center justify-end gap-1">
          <HeaderIcon label="Benachrichtigungen">
            <Bell className="h-5 w-5" strokeWidth={1.6} />
          </HeaderIcon>
          <div className="ml-1 flex items-center gap-2 pl-2">
            <Avatar
              person={{
                initials: user.initials,
                accent: user.accent,
                name: user.name,
              }}
              size="sm"
            />
            <span className="hidden max-w-[110px] truncate text-xs sm:block">{user.name}</span>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="sticky top-12 flex h-[calc(100vh-3rem)] w-[220px] shrink-0 flex-col border-r border-line bg-sidebar">
          <AppNav isAdmin={user.role === "ADMIN"} />
          <div className="border-t border-line p-3">
            <div className="mb-2 flex items-center gap-2.5">
              <Avatar
                person={{
                  initials: user.initials,
                  accent: user.accent,
                  name: user.name,
                }}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{user.name}</p>
                <p className="truncate text-[11px] text-muted">
                  {user.role === "CUSTOMER" ? user.organization : user.title}
                </p>
              </div>
            </div>
            <form action={logoutAction}>
              <button type="submit" className="btn w-full text-muted">
                <LogOut className="h-3.5 w-3.5" />
                Abmelden
              </button>
            </form>
          </div>
        </aside>
        <div className="min-w-0 flex-1 bg-canvas">{children}</div>
      </div>
    </div>
  );
}

function HeaderIcon({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-white/90 hover:bg-white/10"
    >
      {children}
    </span>
  );
}
