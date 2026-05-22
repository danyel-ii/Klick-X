"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { useAppStore } from "@/lib/store";

type PromptOutcome = "accepted" | "dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: PromptOutcome; platform: string }>;
}

const promptStorageKey = "study-blocks-install-prompt-dismissed";

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function hasDismissedPrompt() {
  try {
    return window.localStorage.getItem(promptStorageKey) === "true";
  } catch {
    return false;
  }
}

function dismissPrompt() {
  try {
    window.localStorage.setItem(promptStorageKey, "true");
  } catch {
    // Local storage may be unavailable in private contexts.
  }
}

export function InstallPrompt() {
  const { t } = useAppStore();
  const [visible, setVisible] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isAndroid() || isStandalone() || hasDismissedPrompt()) return;

    const showTimer = window.setTimeout(() => setVisible(true), 900);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const handleInstalled = () => {
      dismissPrompt();
      setVisible(false);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.clearTimeout(showTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) {
      setShowFallback(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === "accepted") {
      dismissPrompt();
      setVisible(false);
    } else {
      setShowFallback(true);
    }
  }

  function handleDismiss() {
    dismissPrompt();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      aria-label={t.install.title}
      className="fixed inset-x-3 bottom-24 z-30 mx-auto max-w-md rounded-lg border border-[var(--app-border)] bg-[var(--card)] p-4 text-[var(--foreground)] shadow-2xl shadow-slate-950/20 backdrop-blur md:bottom-6"
    >
      <button
        type="button"
        aria-label={t.install.later}
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
      <div className="pr-8">
        <p className="text-sm font-bold">{t.install.title}</p>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{t.install.body}</p>
      </div>
      {showFallback ? <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{t.install.fallback}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={() => void handleInstall()}>
          <Download className="h-4 w-4" aria-hidden />
          {t.install.action}
        </Button>
        <Button type="button" variant="ghost" onClick={handleDismiss}>
          {t.install.later}
        </Button>
      </div>
    </aside>
  );
}
