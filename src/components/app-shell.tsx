"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo, LogoMark } from "@/components/logo";
import { navByRole, roleLabel } from "@/lib/nav-config";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

function isActive(pathname: string, href: string) {
  if (href === "/familia" || href === "/professor" || href === "/admin") {
    return pathname === href;
  }
  return pathname.startsWith(href);
}

export function AppShell({
  role,
  userName,
  children,
}: {
  role: UserRole;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = navByRole[role];

  return (
    <div className="min-h-dvh flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-surface md:sticky md:top-0 md:h-dvh">
        <div className="p-6">
          <Link href={`/${role}`}>
            <Logo size="sm" />
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-arkedia-blue text-white"
                    : "text-foreground/80 hover:bg-arkedia-blue-light hover:text-arkedia-blue"
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <LogoMark className="size-9 text-sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{userName}</p>
              <p className="text-xs text-muted">{roleLabel[role]}</p>
            </div>
          </div>
          <Link
            href="/"
            className="mt-2 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-muted hover:bg-black/[0.04]"
          >
            <LogOut className="size-4" />
            Tancar sessió
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur">
        <Logo size="sm" />
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-full bg-arkedia-blue-light px-3 py-1.5 text-xs font-semibold text-arkedia-blue"
        >
          {roleLabel[role]}
        </Link>
      </header>

      <main className="flex-1 min-w-0 px-4 pb-24 pt-4 md:px-8 md:pb-10 md:pt-8">
        <div className="mx-auto w-full max-w-3xl md:max-w-4xl">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-stretch justify-around border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold",
                active ? "text-arkedia-blue" : "text-muted"
              )}
            >
              <Icon className={cn("size-5", active && "fill-arkedia-blue-light")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
