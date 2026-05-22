"use client";

import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { StudyBlock, Subject, Tag } from "@/lib/types";
import { Button, TagPill, TimerRing, Textarea } from "./ui";

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
  const reduceMotion = useReducedMotion();
  const accent = subject?.color ?? "var(--accent)";
  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-[var(--background)] p-4">
      <div className="absolute inset-0 opacity-80" style={{ background: `radial-gradient(circle at 50% 35%, ${accent}33, transparent 36%), linear-gradient(160deg, var(--background), var(--surface-elevated))` }} />
      <motion.div
        className="absolute h-72 w-72 rounded-full blur-2xl"
        style={{ backgroundColor: accent, opacity: 0.22 }}
        animate={reduceMotion ? undefined : { scale: [1, 1.12, 1], opacity: [0.16, 0.28, 0.16] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <section className="relative z-10 w-full max-w-xl rounded-2xl border border-white/15 bg-[var(--card)]/82 p-5 text-center shadow-2xl backdrop-blur sm:p-8">
        <button
          type="button"
          aria-label="Exit focus mode"
          onClick={onExit}
          className="absolute right-4 top-4 rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Focus mode</p>
        <h2 className="mt-2 text-3xl font-bold">{subject?.name}</h2>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {tags.map((tag) => (
            <TagPill key={tag.id} tag={tag} />
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <TimerRing block={block} now={now} />
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {block.status === "active" ? <Button onClick={onPause}>Pause</Button> : <Button onClick={onResume}>Resume</Button>}
          <Button variant="secondary" onClick={onComplete}>
            Complete
          </Button>
          <Button variant="ghost" onClick={onExit}>
            Exit focus
          </Button>
        </div>
        <Textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-6 w-full text-left" placeholder="Notes" />
      </section>
    </div>
  );
}
