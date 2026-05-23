"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Circle, Minus, NotebookPen, Play, Plus, SkipForward, Trash2 } from "lucide-react";
import { OnboardingDeck } from "@/components/OnboardingDeck";
import { FocusScreensaver } from "@/components/FocusScreensaver";
import { ActiveBlockPanel } from "@/components/ActiveBlockPanel";
import { Button, PageHeader, SubjectPill, SurfaceCard, TagPill, Textarea } from "@/components/ui";
import { resolveSubjectColor, resolveSubjectTextColor } from "@/lib/colors";
import { localDateKey } from "@/lib/date";
import { findPreviousSubjectNote } from "@/lib/notes";
import { useAppStore } from "@/lib/store";
import { formatDuration, visibleElapsedSeconds } from "@/lib/timer";
import type { DayAssignment, StudyBlock } from "@/lib/types";

export default function TodayPage() {
  const {
    t,
    settings,
    subjects,
    tags,
    today,
    todayBlocks,
    allBlocks,
    startBlock,
    pauseBlock,
    completeBlock,
    skipBlock,
    updateBlockSubject,
    updateBlockTags,
    updateBlockNote,
    addBlockToDay,
    deleteBlock,
  } = useAppStore();
  const activeSubjects = subjects.filter((subject) => !subject.archivedAt);
  const activeTags = tags.filter((tag) => !tag.archivedAt);
  const [now, setNow] = useState(new Date());
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeBlock = todayBlocks.find((block) => block.status === "active");

  useEffect(() => {
    if (!settings?.screensaverEnabled || !activeBlock) return;
    const timeout = window.setTimeout(() => setFocusBlockId(activeBlock.id), settings.screensaverDelaySeconds * 1000);
    return () => window.clearTimeout(timeout);
  }, [activeBlock, settings?.screensaverDelaySeconds, settings?.screensaverEnabled]);

  if (!settings?.onboardingCompletedAt) return <OnboardingDeck />;
  if (!today) return <DailySetup subjects={activeSubjects} tags={activeTags} />;

  const focusBlock = todayBlocks.find((block) => block.id === focusBlockId);
  const focusSubject = subjects.find((subject) => subject.id === focusBlock?.subjectId);
  const focusTags = tags.filter((tag) => focusBlock?.tagIds.includes(tag.id));
  const activeSubject = subjects.find((subject) => subject.id === activeBlock?.subjectId);
  const activeBlockTags = tags.filter((tag) => activeBlock?.tagIds.includes(tag.id));
  const defaultSubject = activeSubjects[0];

  return (
    <>
      <PageHeader
        title={t.today.title}
        subtitle={t.today.subtitle}
        action={
          <Button
            type="button"
            variant="secondary"
            disabled={!defaultSubject}
            onClick={() => {
              if (!defaultSubject) return;
              void addBlockToDay(today.date, { subjectId: defaultSubject.id, tagIds: [] });
            }}
            className="shrink-0 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t.today.addBlock}
          </Button>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <section className="grid gap-4 sm:grid-cols-2">
          {todayBlocks.map((block) => (
            <StudyBlockCard
              key={block.id}
              block={block}
              now={now}
              subjects={subjects}
              tags={tags}
              allBlocks={allBlocks}
              onStart={() => void startBlock(block.id)}
              onPause={() => void pauseBlock(block.id)}
              onComplete={() => void completeBlock(block.id)}
              onSkip={() => void skipBlock(block.id)}
              onSubject={(subjectId) => void updateBlockSubject(block.id, subjectId)}
              onTags={(tagIds) => void updateBlockTags(block.id, tagIds)}
              onNote={(note) => void updateBlockNote(block.id, note)}
              onDelete={() => {
                if (window.confirm(t.today.deleteBlockConfirm)) void deleteBlock(block.id);
              }}
              onFocus={() => setFocusBlockId(block.id)}
            />
          ))}
        </section>
        <SurfaceCard className="h-fit">
          <h2 className="text-lg font-bold">{t.today.activeBlock}</h2>
          {activeBlock ? (
            <ActiveBlockPanel block={activeBlock} now={now} subject={activeSubject} tags={activeBlockTags} />
          ) : (
            <p className="mt-3 text-sm text-[var(--muted)]">{todayBlocks.every((block) => block.status === "completed" || block.status === "skipped") ? t.today.allDone : t.today.noPlan}</p>
          )}
        </SurfaceCard>
      </div>
      {focusBlock ? (
        <FocusScreensaver
          block={focusBlock}
          subject={focusSubject}
          tags={focusTags}
          now={now}
          note={focusBlock.note ?? ""}
          setNote={(note) => void updateBlockNote(focusBlock.id, note)}
          onPause={() => void pauseBlock(focusBlock.id)}
          onResume={() => void startBlock(focusBlock.id)}
          onComplete={() => {
            void completeBlock(focusBlock.id);
            setFocusBlockId(null);
          }}
          onExit={() => setFocusBlockId(null)}
        />
      ) : null}
    </>
  );
}

function DailySetup({ subjects, tags }: { subjects: ReturnType<typeof useAppStore.getState>["subjects"]; tags: ReturnType<typeof useAppStore.getState>["tags"] }) {
  const { t, createOrUpdateDayPlan } = useAppStore();
  const [count, setCount] = useState(3);
  const [assignments, setAssignments] = useState<DayAssignment[]>(() => Array.from({ length: 3 }, () => ({ subjectId: "", tagIds: [] })));
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [error, setError] = useState("");

  function resize(nextCount: number) {
    const clamped = Math.min(12, Math.max(1, nextCount));
    setCount(clamped);
    setAssignments((current) =>
      Array.from({ length: clamped }, (_, index) => current[index] ?? { subjectId: "", tagIds: [] }),
    );
    setSelectedSlot((slot) => Math.min(slot, clamped - 1));
  }

  function assignSubject(subjectId: string) {
    const firstEmpty = assignments.findIndex((assignment) => !assignment.subjectId);
    const target = assignments[selectedSlot]?.subjectId ? (firstEmpty === -1 ? selectedSlot : firstEmpty) : selectedSlot;
    setSelectedSlot(target);
    setAssignments((current) => current.map((item, index) => (index === target ? { ...item, subjectId } : item)));
  }

  function toggleTag(tagId: string) {
    setAssignments((current) =>
      current.map((item, index) =>
        index === selectedSlot
          ? { ...item, tagIds: item.tagIds.includes(tagId) ? item.tagIds.filter((id) => id !== tagId) : [...item.tagIds, tagId] }
          : item,
      ),
    );
  }

  async function createPlan() {
    if (assignments.some((assignment) => !assignment.subjectId)) {
      setError(t.today.subjectRequired);
      return;
    }
    await createOrUpdateDayPlan(localDateKey(), count, assignments);
  }

  return (
    <>
      <PageHeader title={t.today.setupTitle} subtitle={t.today.subtitle} />
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <SurfaceCard className="h-fit">
          <p className="text-sm font-semibold text-[var(--muted)]">{t.today.blockCount}</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <Button variant="secondary" aria-label="Decrease blocks" onClick={() => resize(count - 1)}>
              <Minus className="h-4 w-4" aria-hidden />
            </Button>
            <div className="min-w-24 text-center font-mono text-6xl font-bold tracking-normal text-[var(--foreground)]">{count}</div>
            <Button variant="secondary" aria-label="Increase blocks" onClick={() => resize(count + 1)}>
              <Plus className="h-4 w-4" aria-hidden />
            </Button>
          </div>
          <input id="block-count" type="range" min={1} max={12} value={count} onChange={(event) => resize(Number(event.target.value))} className="mt-5 w-full accent-[var(--accent)]" />
        </SurfaceCard>
        <SurfaceCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">{t.today.studyBoard}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{t.today.chooseSubject}</p>
            </div>
            <div className="font-mono text-sm text-[var(--muted)]">
              {assignments.filter((assignment) => assignment.subjectId).length}/{count}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {assignments.map((assignment, index) => {
              const subject = subjects.find((item) => item.id === assignment.subjectId);
              const subjectColor = resolveSubjectColor(subject?.color);
              return (
                <motion.button
                  layout
                  key={index}
                  type="button"
                  aria-pressed={selectedSlot === index}
                  onClick={() => setSelectedSlot(index)}
                  className={`soft-shimmer min-h-28 rounded-[1.5rem] border p-3 text-left shadow-sm shadow-slate-950/5 transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                    selectedSlot === index ? "border-[var(--accent)] bg-[var(--glass-strong)]" : "border-dashed border-[var(--app-border)] bg-[var(--glass)]"
                  }`}
                  style={subject ? { borderColor: subjectColor, boxShadow: selectedSlot === index ? `0 0 0 3px color-mix(in srgb, ${subjectColor} 14%, transparent)` : undefined } : undefined}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Block {index + 1}</span>
                  {subject ? (
                    <motion.div layoutId={`setup-subject-${subject.id}-${index}`} className="mt-3 flex items-center gap-2 font-semibold">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: subjectColor }} />
                      {subject.name}
                    </motion.div>
                  ) : (
                    <span className="mt-3 block text-sm text-[var(--muted)]">{t.today.chooseSubject}</span>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tags
                      .filter((tag) => assignment.tagIds.includes(tag.id))
                      .map((tag) => (
                        <TagPill key={tag.id} tag={tag} />
                      ))}
                  </div>
                </motion.button>
              );
            })}
          </div>
          <div className="liquid-glass mt-5 rounded-[1.5rem] p-3">
            <p className="text-sm font-semibold text-[var(--muted)]">{t.today.chooseSubject}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <SubjectPill key={subject.id} subject={subject} selected={assignments[selectedSlot]?.subjectId === subject.id} onClick={() => assignSubject(subject.id)} />
              ))}
            </div>
            <p className="mt-4 text-sm font-semibold text-[var(--muted)]">{t.today.chooseTags}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <TagPill key={tag.id} tag={tag} selected={assignments[selectedSlot]?.tagIds.includes(tag.id)} onClick={() => toggleTag(tag.id)} />
              ))}
            </div>
          </div>
        </SurfaceCard>
      </div>
      {error ? <p className="mt-4 text-sm font-semibold text-[var(--destructive)]">{error}</p> : null}
      <Button className="mt-5 w-full sm:w-auto" onClick={() => void createPlan()}>
        {t.today.createPlan}
      </Button>
    </>
  );
}

function StudyBlockCard({
  block,
  now,
  subjects,
  tags,
  allBlocks,
  onStart,
  onPause,
  onComplete,
  onSkip,
  onSubject,
  onTags,
  onNote,
  onDelete,
  onFocus,
}: {
  block: StudyBlock;
  now: Date;
  subjects: ReturnType<typeof useAppStore.getState>["subjects"];
  tags: ReturnType<typeof useAppStore.getState>["tags"];
  allBlocks: ReturnType<typeof useAppStore.getState>["allBlocks"];
  onStart: () => void;
  onPause: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onSubject: (id: string) => void;
  onTags: (ids: string[]) => void;
  onNote: (note: string) => void;
  onDelete: () => void;
  onFocus: () => void;
}) {
  const { t } = useAppStore();
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(block.status === "active");
  const subject = subjects.find((item) => item.id === block.subjectId);
  const blockTags = tags.filter((tag) => block.tagIds.includes(tag.id));
  const elapsed = visibleElapsedSeconds(block, now);
  const activeTags = tags.filter((tag) => !tag.archivedAt);
  const activeSubjects = subjects.filter((subject) => !subject.archivedAt);
  const subjectColor = resolveSubjectColor(subject?.color);
  const previousSubjectNote = findPreviousSubjectNote(block, allBlocks);
  const subjectTextColor = resolveSubjectTextColor(subject?.color);
  const stateClass =
    block.status === "active"
      ? "border-transparent shadow-[0_24px_60px_color-mix(in_srgb,var(--accent)_12%,transparent)]"
      : block.status === "planned"
        ? "border-dashed bg-[var(--glass)]"
        : block.status === "paused"
          ? "border-transparent"
          : block.status === "completed"
            ? "border-[var(--app-border)] bg-[var(--glass-strong)]"
            : "border-[var(--app-border)] bg-[var(--glass)] opacity-55";
  const stateStyle =
    block.status === "active"
      ? {
          backgroundColor: subjectColor,
          color: subjectTextColor,
          boxShadow: `0 0 0 1px color-mix(in srgb, ${subjectColor} 38%, transparent), 0 22px 62px color-mix(in srgb, ${subjectColor} 24%, transparent)`,
        }
      : block.status === "planned"
        ? { borderColor: subjectColor, boxShadow: `inset 4px 0 0 ${subjectColor}` }
        : block.status === "paused"
          ? {
              borderColor: subjectColor,
              backgroundColor: `color-mix(in srgb, ${subjectColor} 20%, var(--card))`,
              backgroundImage: `repeating-linear-gradient(135deg, color-mix(in srgb, ${subjectColor} 14%, transparent) 0 8px, transparent 8px 16px)`,
            }
          : block.status === "skipped"
            ? { backgroundImage: "repeating-linear-gradient(135deg, transparent 0 8px, color-mix(in srgb, var(--muted) 18%, transparent) 8px 10px)" }
            : undefined;

  return (
    <motion.article
      layout
      onClick={() => setExpanded((value) => !value)}
      animate={block.status === "completed" && !reduceMotion ? { scale: [1, 1.03, 1] } : undefined}
      transition={{ duration: 0.24 }}
      className={`relative overflow-hidden rounded-[1.75rem] border p-5 shadow-sm shadow-slate-950/5 transition duration-200 hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-[var(--ring)] ${stateClass} ${
        block.status === "skipped" ? "line-through" : ""
      }`}
      style={stateStyle}
    >
      {block.status === "active" ? <motion.div className="pointer-events-none absolute inset-0 rounded-[1.75rem]" animate={reduceMotion ? undefined : { opacity: [0.12, 0.25, 0.12] }} transition={{ duration: 2.8, repeat: Infinity }} style={{ boxShadow: "inset 0 0 0 999px rgba(255,255,255,0.06)" }} /> : null}
      {block.status === "completed" && subject ? <span className="absolute right-3 top-3 h-3 w-3 rounded-full" style={{ backgroundColor: subjectColor }} /> : null}
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className={`flex items-center gap-2 text-sm font-semibold ${block.status === "active" ? "" : "text-[var(--muted)]"}`}>
            {block.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-[var(--success)]" /> : <Circle className="h-4 w-4" />}
            Block {block.index + 1} · {t.status[block.status]}
          </div>
          <h2 className="mt-2 text-xl font-bold">{subject?.name}</h2>
        </div>
        <div className="font-mono text-lg font-bold">{formatDuration(elapsed)}</div>
      </div>
      <div className="relative mt-3 flex flex-wrap gap-2">
        {blockTags.map((tag) => (
          <TagPill key={tag.id} tag={tag} />
        ))}
      </div>
      <AnimatePresence initial={false}>
        {(expanded || block.status === "active") && (
          <motion.div
            key="controls"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            className="relative overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <details className="mt-4">
              <summary className={`cursor-pointer text-sm font-semibold ${block.status === "active" ? "" : "text-[var(--muted)]"}`}>{t.today.changeSubject}</summary>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeSubjects.map((item) => (
                  <SubjectPill key={item.id} subject={item} selected={item.id === block.subjectId} onClick={() => onSubject(item.id)} />
                ))}
              </div>
            </details>
            <details className="mt-3">
              <summary className={`cursor-pointer text-sm font-semibold ${block.status === "active" ? "" : "text-[var(--muted)]"}`}>{t.today.changeTags}</summary>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeTags.map((tag) => (
                  <TagPill
                    key={tag.id}
                    tag={tag}
                    selected={block.tagIds.includes(tag.id)}
                    onClick={() => onTags(block.tagIds.includes(tag.id) ? block.tagIds.filter((id) => id !== tag.id) : [...block.tagIds, tag.id])}
                  />
                ))}
              </div>
            </details>
            <label className={`mt-4 flex items-center gap-2 text-sm font-semibold ${block.status === "active" ? "" : "text-[var(--muted)]"}`}>
              <NotebookPen className="h-4 w-4" aria-hidden />
              {t.today.notes}
            </label>
            {previousSubjectNote ? (
              <div className="liquid-glass mt-2 rounded-2xl p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  <span>{t.today.previousSubjectNote}</span>
                  <span>
                    {previousSubjectNote.date} · Block {previousSubjectNote.index + 1}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[var(--foreground)]">{previousSubjectNote.note}</p>
              </div>
            ) : null}
            <Textarea value={block.note ?? ""} onChange={(event) => onNote(event.target.value)} placeholder={t.today.notePlaceholder} className="mt-2 w-full bg-[var(--glass-strong)]" />
            <div className="mt-4 flex flex-wrap gap-2">
              {block.status === "active" ? (
                <Button onClick={onPause}>{t.actions.pause}</Button>
              ) : (
                <Button onClick={onStart} disabled={block.status === "completed" || block.status === "skipped"}>
                  <Play className="h-4 w-4" aria-hidden />
                  {block.status === "paused" ? t.actions.resume : t.actions.start}
                </Button>
              )}
              <Button variant="secondary" onClick={onComplete} disabled={block.status === "completed" || block.status === "skipped"}>
                {t.actions.complete}
              </Button>
              <Button variant="ghost" onClick={onSkip} disabled={block.status === "completed" || block.status === "skipped"}>
                <SkipForward className="h-4 w-4" aria-hidden />
                {t.actions.skip}
              </Button>
              <Button variant="danger" onClick={onDelete} disabled={block.status === "active"}>
                <Trash2 className="h-4 w-4" aria-hidden />
                {t.today.deleteBlock}
              </Button>
              <Button variant="secondary" onClick={onFocus} disabled={block.status !== "active"}>
                {t.today.focusMode}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
