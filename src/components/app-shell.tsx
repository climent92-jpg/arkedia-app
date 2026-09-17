"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo, LogoMark } from "@/components/logo";
import { ROLE_HOME, navByRole, roleLabel } from "@/lib/nav-config";
import type { NavBadges } from "@/lib/nav-badges";
import { useSignOut } from "@/lib/use-sign-out";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const ROOT_HREFS = new Set(Object.values(ROLE_HOME));

function isActive(pathname: string, href: string) {
  if (ROOT_HREFS.has(href)) {
    return pathname === href;
  }
  return pathname.startsWith(href);
}

// L'últim tram de la ruta ("/professor/deures" -> "deures") fa de clau del
// mapa de notificacions: així el mateix AppShell serveix tant per a
// l'alumne com per al professor sense haver de repetir la llista d'items.
const BADGE_KEYS = new Set<keyof NavBadges>(["deures", "material", "avisos", "xat"]);

function badgeKeyFor(href: string): keyof NavBadges | undefined {
  const key = href.split("/").filter(Boolean).pop();
  return key && BADGE_KEYS.has(key as keyof NavBadges) ? (key as keyof NavBadges) : undefined;
}

function badgeCountFor(badges: NavBadges | undefined, href: string): number {
  const key = badgeKeyFor(href);
  const count = key ? badges?.[key] : undefined;
  return count && count > 0 ? count : 0;
}

export function AppShell({
  role,
  userName,
  badges,
  children,
}: {
  role: UserRole;
  userName: string;
  badges?: NavBadges;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = navByRole[role];
  const { signOut, loading: signingOut } = useSignOut();

  return (
    <div className="min-h-dvh flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-surface md:sticky md:top-0 md:h-dvh">
        <div className="p-6">
          <Link href={ROLE_HOME[role]}>
            <Logo size="sm" />
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            const count = badgeCountFor(badges, item.href);
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
                <span className="relative flex">
                  <Icon className="size-5" />
                  {count > 0 && <BadgeCount count={count} />}
                </span>
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
          <button
            onClick={signOut}
            disabled={signingOut}
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-muted hover:bg-black/[0.04] disabled:opacity-50"
          >
            <LogOut className="size-4" />
            {signingOut ? "Sortint..." : "Tancar sessió"}
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-arkedia-blue-light px-3 py-1.5 text-xs font-semibold text-arkedia-blue">
            {roleLabel[role]}
          </span>
          <button
            onClick={signOut}
            disabled={signingOut}
            aria-label="Tancar sessió"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-black/[0.06] disabled:opacity-50"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 min-w-0 px-4 pb-24 pt-4 md:px-8 md:pb-10 md:pt-8">
        <div className="mx-auto w-full max-w-3xl md:max-w-4xl">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-stretch justify-around border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          const count = badgeCountFor(badges, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold",
                active ? "text-arkedia-blue" : "text-muted"
              )}
            >
              <span className="relative flex">
                <Icon className={cn("size-5", active && "fill-arkedia-blue-light")} />
                {count > 0 && <BadgeCount count={count} />}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function BadgeCount({ count }: { count: number }) {
  const label = count > 99 ? "99+" : String(count);
  return (
    <span
      className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold leading-none text-white ring-2 ring-surface"
      aria-label={`${count} notificacions pendents`}
    >
      {label}
    </span>
  );
}
