"use client";

import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { resolveSubjectColor } from "@/lib/colors";
import { useAppStore } from "@/lib/store";
import { formatDuration, visibleElapsedSeconds } from "@/lib/timer";
import type { StudyBlock, Subject, Tag } from "@/lib/types";
import { Button, TagPill, Textarea } from "./ui";

export function FocusScreensaver({
  block,
  subject,
  tags,
  now,
  note,
  setNote,
  onPause,
  onResume,
  onComplete,
  onExit,
}: {
  block: StudyBlock;
  subject?: Subject;
  tags: Tag[];
  now: Date;
  note: string;
  setNote: (value: string) => void;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onExit: () => void;
}) {
  const { t } = useAppStore();
  const reduceMotion = useReducedMotion();
  const accent = resolveSubjectColor(subject?.color);
  const elapsed = visibleElapsedSeconds(block, now);
  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-slate-950 p-4 text-slate-50">
      <div className="absolute inset-0 opacity-90" style={{ background: `linear-gradient(160deg, #020617, color-mix(in srgb, ${accent} 14%, #020617))` }} />
      <motion.div
        className="absolute h-[34rem] w-[34rem] rounded-[38%_62%_55%_45%/45%_42%_58%_55%] blur-3xl"
        style={{ background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 48%, #38bdf8), #020617)`, opacity: 0.38 }}
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [1, 1.08, 0.98, 1],
                rotate: [0, 7, -4, 0],
                borderRadius: ["38% 62% 55% 45% / 45% 42% 58% 55%", "58% 42% 36% 64% / 40% 60% 40% 60%", "42% 58% 62% 38% / 58% 38% 62% 42%", "38% 62% 55% 45% / 45% 42% 58% 55%"],
              }
        }
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute h-72 w-72 rounded-[60%_40%_50%_50%/40%_55%_45%_60%] blur-3xl"
        style={{ backgroundColor: accent, opacity: 0.18 }}
        animate={reduceMotion ? undefined : { x: [-30, 34, -12, -30], y: [12, -28, 26, 12], scale: [1, 0.92, 1.1, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <section className="relative z-10 w-full max-w-2xl rounded-[2rem] border border-white/15 bg-slate-950/45 p-5 text-center shadow-2xl shadow-black/35 backdrop-blur-2xl sm:p-8">
        <button
          type="button"
          aria-label={t.today.exitFocus}
          onClick={onExit}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-300 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">{t.today.focusMode}</p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{subject?.name}</h2>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {tags.map((tag) => (
            <TagPill key={tag.id} tag={tag} />
          ))}
        </div>
        <div className="mt-10">
          <div className="font-mono text-7xl font-bold tracking-normal sm:text-8xl" style={{ textShadow: `0 0 50px ${accent}` }}>
            {formatDuration(elapsed)}
          </div>
          <div className="mx-auto mt-6 h-2 max-w-sm overflow-hidden rounded-full bg-white/10 shadow-inner">
            <div className="h-full rounded-full transition-[width]" style={{ width: `${Math.min(100, (elapsed / (block.plannedMinutes * 60)) * 100)}%`, backgroundColor: accent }} />
          </div>
          <p className="mt-2 text-sm text-slate-400">{block.plannedMinutes}m</p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {block.status === "active" ? <Button onClick={onPause}>{t.actions.pause}</Button> : <Button onClick={onResume}>{t.actions.resume}</Button>}
          <Button variant="secondary" onClick={onComplete}>
            {t.actions.complete}
          </Button>
          <Button variant="ghost" onClick={onExit}>
            {t.today.exitFocus}
          </Button>
        </div>
        <Textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-6 w-full border-white/15 bg-white/10 text-left text-slate-50 placeholder:text-slate-400" placeholder={t.today.notePlaceholder} />
      </section>
    </div>
  );
}
