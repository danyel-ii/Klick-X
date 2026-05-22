"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Languages } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import type { Locale } from "@/lib/types";
import { Button } from "./ui";

export function OnboardingDeck() {
  const { t, settings, setLocale, completeOnboarding } = useAppStore();
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const cards = t.onboarding.cards;
  const isLast = index === cards.length - 1;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "Enter") setIndex((value) => Math.min(cards.length - 1, value + 1));
      if (event.key === "ArrowLeft") setIndex((value) => Math.max(0, value - 1));
      if (event.key === "Escape") void completeOnboarding();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cards.length, completeOnboarding]);

  return (
    <div className="grid min-h-[calc(100vh-3rem)] place-items-center">
      <section className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl sm:p-8" aria-label="Onboarding">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--muted)]">
            <Languages className="h-4 w-4" aria-hidden />
            <select
              aria-label={t.settings.language}
              value={settings?.locale ?? "en"}
              onChange={(event) => void setLocale(event.target.value as Locale)}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[var(--foreground)]"
            >
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
          <Button variant="ghost" onClick={() => void completeOnboarding()}>
            {t.onboarding.skip}
          </Button>
        </div>
        <div className="overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="min-h-64"
            >
              <p className="text-sm font-semibold text-[var(--accent)]">
                {t.onboarding.step} {index + 1} / {cards.length}
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-normal sm:text-4xl">{cards[index][0]}</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">{cards[index][1]}</p>
              <div className="mt-8 h-24 rounded-xl border border-[var(--border)] bg-[linear-gradient(135deg,var(--surface),var(--surface-elevated))] p-4">
                <div className="h-full rounded-lg bg-[radial-gradient(circle_at_30%_30%,var(--accent-soft),transparent_45%),var(--card)]" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex gap-1.5" aria-hidden>
            {cards.map((card, dotIndex) => (
              <span key={card[0]} className={`h-2 rounded-full transition-all ${dotIndex === index ? "w-6 bg-[var(--accent)]" : "w-2 bg-[var(--border)]"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
              {t.actions.back}
            </Button>
            <Button onClick={() => (isLast ? void completeOnboarding() : setIndex((value) => value + 1))}>
              {isLast ? t.onboarding.getStarted : t.actions.next}
              {!isLast ? <ChevronRight className="h-4 w-4" aria-hidden /> : null}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
