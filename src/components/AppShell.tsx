"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, Settings, TimerReset } from "lucide-react";
import { clsx } from "clsx";
import { useEffect } from "react";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { useAppStore } from "@/lib/store";
import { isDaisyTheme, type DaisyTheme } from "@/lib/themes";

const nav = [
  { href: "/today", key: "today" as const, icon: TimerReset },
  { href: "/calendar", key: "calendar" as const, icon: CalendarDays },
  { href: "/stats", key: "stats" as const, icon: BarChart3 },
  { href: "/settings", key: "settings" as const, icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { initialize, hydrated, settings, t } = useAppStore();
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (isLogin) return;
    initialize();
  }, [initialize, isLogin]);

  useEffect(() => {
    if (isLogin) return;
    if (!settings) return;
    const root = document.documentElement;
    root.lang = settings.locale;
    root.dataset.selectedTheme = settings.theme;

    const getSystemTheme = (): DaisyTheme => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const applyTheme = () => {
      root.dataset.theme = settings.theme === "system" || !isDaisyTheme(settings.theme) ? getSystemTheme() : settings.theme;
    };

    applyTheme();

    if (settings.theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [isLogin, settings]);

  if (isLogin) {
    return (
      <>
        <ServiceWorkerRegistration />
        {children}
        <InstallPrompt />
      </>
    );
  }

  if (!hydrated) {
    return (
      <>
        <ServiceWorkerRegistration />
        <main className="grid min-h-screen place-items-center bg-[var(--background)] text-[var(--muted)]">Study Blocks</main>
        <InstallPrompt />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <ServiceWorkerRegistration />
      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-[var(--app-border)] bg-[var(--background)]/80 p-5 backdrop-blur md:block">
          <Link href="/today" className="block rounded-xl px-3 py-2 text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
            Study Blocks
          </Link>
          <nav className="mt-8 space-y-2" aria-label="Primary">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (pathname === "/" && item.href === "/today");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                    active ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm shadow-slate-950/5" : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {t.nav[item.key]}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="w-full px-4 pb-24 pt-6 sm:px-6 md:px-8 md:pb-8">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--app-border)] bg-[var(--card)]/95 px-2 py-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden" aria-label="Primary">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (pathname === "/" && item.href === "/today");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                  active ? "bg-[var(--surface)] text-[var(--foreground)]" : "text-[var(--muted)]",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {t.nav[item.key]}
              </Link>
            );
          })}
        </div>
      </nav>
      <InstallPrompt />
    </div>
  );
}
