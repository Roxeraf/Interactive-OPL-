"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { FolderKanban, LayoutDashboard, Users } from "lucide-react";

export function AppNav({ isAdmin, onNavigate }: { isAdmin: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = [
    { href: "/dashboard", label: "Lage", icon: LayoutDashboard },
    { href: "/projects", label: "Projekte", icon: FolderKanban },
    ...(isAdmin ? [{ href: "/admin/users", label: "Personen", icon: Users }] : []),
  ];

  function active(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="flex flex-1 flex-col px-2 py-3">
      <p className="mb-1 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        Management
      </p>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={clsx(
              "relative flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition",
              isActive ? "bg-active font-medium text-navy" : "text-ink hover:bg-active/70",
            )}
          >
            {isActive ? <span className="absolute inset-y-1 left-0 w-[3px] rounded-r bg-navy" /> : null}
            <Icon className={clsx("h-4 w-4", isActive ? "text-brand" : "text-muted")} strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
