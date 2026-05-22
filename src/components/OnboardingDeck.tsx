"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const next = () => (isLast ? void completeOnboarding() : setIndex((value) => Math.min(cards.length - 1, value + 1)));

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
    <div className="relative grid min-h-[calc(100vh-3rem)] place-items-center overflow-hidden">
      <div className="absolute right-0 top-0 z-20 flex rounded-full border border-[var(--border)] bg-[var(--card)]/80 p-1 shadow-sm shadow-slate-950/5 backdrop-blur">
        {(["en", "de"] as Locale[]).map((locale) => (
          <button
            key={locale}
            type="button"
            aria-pressed={(settings?.locale ?? "en") === locale}
            onClick={() => void setLocale(locale)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
              (settings?.locale ?? "en") === locale ? "bg-[var(--foreground)] text-[var(--background)]" : "text-[var(--muted)]"
            }`}
          >
            {locale === "en" ? "English" : "Deutsch"}
          </button>
        ))}
      </div>
      <section className="relative w-full max-w-2xl pt-14" aria-label="Onboarding">
        <div className="pointer-events-none absolute inset-x-6 top-24 h-80 rounded-lg border border-[var(--border)] bg-[var(--card)] opacity-35 shadow-sm shadow-slate-950/5 sm:inset-x-10" />
        <div className="pointer-events-none absolute inset-x-3 top-20 h-80 rounded-lg border border-[var(--border)] bg-[var(--card)] opacity-60 shadow-lg shadow-slate-950/10 sm:inset-x-5" />
        <div className="relative rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl shadow-slate-950/10 sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-[var(--muted)]">
              {t.onboarding.step} {index + 1} / {cards.length}
            </div>
            <Button variant="ghost" onClick={() => void completeOnboarding()}>
              {t.onboarding.skip}
            </Button>
          </div>
          <div className="overflow-hidden">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={index}
                drag={reduceMotion ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -70) next();
                  if (info.offset.x > 70) setIndex((value) => Math.max(0, value - 1));
                }}
                initial={reduceMotion ? false : { opacity: 0, x: 70, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: -90, rotate: -2, scale: 0.98 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className="min-h-72 cursor-grab active:cursor-grabbing"
              >
                <h1 className="text-3xl font-bold tracking-normal text-[var(--foreground)] sm:text-4xl">{cards[index][0]}</h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">{cards[index][1]}</p>
                <div className="mt-8 grid h-28 grid-cols-5 gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                  {Array.from({ length: 10 }, (_, blockIndex) => (
                    <div
                      key={blockIndex}
                      className="rounded-md border border-[var(--border)] bg-[var(--card)] shadow-sm shadow-slate-950/5"
                      style={{ opacity: blockIndex <= index ? 1 : 0.42 }}
                    />
                  ))}
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
              <Button onClick={next}>
                {isLast ? t.onboarding.getStarted : t.actions.next}
                {!isLast ? <ChevronRight className="h-4 w-4" aria-hidden /> : null}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
