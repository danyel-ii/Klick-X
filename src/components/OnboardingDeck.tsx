"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import type { Locale } from "@/lib/types";
import { Button } from "./ui";

export function OnboardingDeck() {
  const { t, settings, setLocale, completeOnboarding } = useAppStore();
  const [index, setIndex] = useState(0);
  const swipeStartX = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();
  const cards = t.onboarding.cards;
  const isLast = index === cards.length - 1;
  const next = () => (isLast ? void completeOnboarding() : setIndex((value) => Math.min(cards.length - 1, value + 1)));
  const previous = () => setIndex((value) => Math.max(0, value - 1));

  function finishSwipe(clientX: number) {
    if (swipeStartX.current === null) return;
    const delta = clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (delta < -44) next();
    if (delta > 44) previous();
  }

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
      <div className="liquid-glass absolute right-0 top-0 z-20 flex rounded-full p-1">
        {(["en", "de"] as Locale[]).map((locale) => (
          <button
            key={locale}
            type="button"
            aria-pressed={(settings?.locale ?? "en") === locale}
            onClick={() => void setLocale(locale)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
              (settings?.locale ?? "en") === locale ? "bg-[var(--accent)] text-[var(--color-primary-content)] shadow-sm" : "text-[var(--muted)]"
            }`}
          >
            {locale === "en" ? "English" : "Deutsch"}
          </button>
        ))}
      </div>
      <section className="relative w-full max-w-2xl pt-16" aria-label="Onboarding">
        <motion.div
          aria-hidden
          className="liquid-glass pointer-events-none absolute inset-x-8 top-28 h-80 rounded-[2rem] opacity-35 sm:inset-x-12"
          animate={reduceMotion ? undefined : { scale: [0.96, 0.985, 0.96], y: [12, 4, 12] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="liquid-glass pointer-events-none absolute inset-x-4 top-24 h-80 rounded-[2rem] opacity-60 sm:inset-x-6"
          animate={reduceMotion ? undefined : { scale: [0.98, 1, 0.98], y: [6, 0, 6] }}
          transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="liquid-glass relative rounded-[2rem] p-5 shadow-[var(--soft-shadow)] sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-[var(--muted)]">
              {t.onboarding.step} {index + 1} / {cards.length}
            </div>
            <Button variant="ghost" onClick={() => void completeOnboarding()}>
              {t.onboarding.skip}
            </Button>
          </div>
          <div className="overflow-hidden rounded-[1.5rem]">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={index}
                drag={reduceMotion ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.26}
                dragMomentum
                onPointerDown={(event) => {
                  swipeStartX.current = event.clientX;
                }}
                onPointerUp={(event) => finishSwipe(event.clientX)}
                onPointerCancel={() => {
                  swipeStartX.current = null;
                }}
                onMouseDown={(event) => {
                  swipeStartX.current = event.clientX;
                }}
                onMouseUp={(event) => finishSwipe(event.clientX)}
                onTouchStart={(event) => {
                  swipeStartX.current = event.touches[0]?.clientX ?? null;
                }}
                onTouchEnd={(event) => {
                  const touch = event.changedTouches[0];
                  if (touch) finishSwipe(touch.clientX);
                }}
                whileDrag={reduceMotion ? undefined : { scale: 0.985, rotate: index % 2 ? -1.2 : 1.2 }}
                initial={reduceMotion ? false : { opacity: 0, x: 90, scale: 0.98, rotate: 1.5 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: -110, rotate: -2.5, scale: 0.98 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="min-h-72 cursor-grab select-none rounded-[1.5rem] px-1 active:cursor-grabbing"
                style={{ touchAction: "pan-y" }}
              >
                <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-[var(--app-border)]" aria-hidden />
                <h1 className="max-w-xl text-balance text-3xl font-semibold leading-tight tracking-normal text-[var(--foreground)] sm:text-4xl">{cards[index][0]}</h1>
                <p className="mt-4 max-w-xl text-pretty text-base leading-7 text-[var(--muted)]">{cards[index][1]}</p>
                <div className="liquid-glass mt-8 grid h-28 grid-cols-5 gap-2 rounded-[1.5rem] p-3">
                  {Array.from({ length: 10 }, (_, blockIndex) => (
                    <div
                      key={blockIndex}
                      className="rounded-2xl border border-[var(--app-border)] bg-[var(--glass-strong)] shadow-sm shadow-slate-950/5"
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
                <span key={card[0]} className={`h-2 rounded-full transition-all ${dotIndex === index ? "w-7 bg-[var(--accent)] shadow-[0_0_18px_color-mix(in_srgb,var(--accent)_45%,transparent)]" : "w-2 bg-[var(--app-border)]"}`} />
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={index === 0} onClick={previous}>
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
