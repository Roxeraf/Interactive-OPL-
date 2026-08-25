"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Clock3, LogOut, Menu, Search, Star, X } from "lucide-react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-40 grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center bg-navy px-2 text-white sm:px-3">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title="Menü"
            onClick={() => setSidebarOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-white/90 hover:bg-white/10 lg:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" strokeWidth={1.6} /> : <Menu className="h-5 w-5" strokeWidth={1.6} />}
          </button>
          <span className="hidden h-9 w-9 items-center justify-center rounded-sm text-white/90 lg:inline-flex" title="Menü">
            <Menu className="h-5 w-5" strokeWidth={1.6} />
          </span>
          <HeaderIcon label="Verlauf" className="hidden sm:inline-flex">
            <Clock3 className="h-5 w-5" strokeWidth={1.6} />
          </HeaderIcon>
          <HeaderIcon label="Favoriten" className="hidden sm:inline-flex">
            <Star className="h-5 w-5" strokeWidth={1.6} />
          </HeaderIcon>
          <HeaderIcon label="Suche">
            <Search className="h-5 w-5" strokeWidth={1.6} />
          </HeaderIcon>
        </div>

        <Link href="/dashboard" className="flex items-center justify-center" aria-label="Klarpunkt">
          <Logo />
        </Link>

        <div className="flex items-center justify-end gap-1">
          <HeaderIcon label="Benachrichtigungen">
            <Bell className="h-5 w-5" strokeWidth={1.6} />
          </HeaderIcon>
          <div className="ml-1 flex items-center gap-2 pl-1 sm:pl-2">
            <Avatar
              person={{
                initials: user.initials,
                accent: user.accent,
                name: user.name,
              }}
              size="sm"
            />
            <span className="hidden max-w-[110px] truncate text-xs md:block">{user.name}</span>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {sidebarOpen ? (
          <button
            type="button"
            aria-label="Navigation schließen"
            className="fixed inset-0 top-12 z-20 bg-navy/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <aside
          className={`fixed top-12 z-30 flex h-[calc(100vh-3rem)] w-[220px] shrink-0 flex-col border-r border-line bg-sidebar transition-transform lg:sticky lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <AppNav isAdmin={user.role === "ADMIN"} onNavigate={() => setSidebarOpen(false)} />
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

function HeaderIcon({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-sm text-white/90 hover:bg-white/10 ${className}`}
    >
      {children}
    </span>
  );
}
