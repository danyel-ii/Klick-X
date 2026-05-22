"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, NotebookPen, Play, SkipForward } from "lucide-react";
import { OnboardingDeck } from "@/components/OnboardingDeck";
import { FocusScreensaver } from "@/components/FocusScreensaver";
import { Button, PageHeader, SubjectPill, SurfaceCard, TagPill, Textarea, TimerRing } from "@/components/ui";
import { localDateKey } from "@/lib/date";
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
    startBlock,
    pauseBlock,
    completeBlock,
    skipBlock,
    updateBlockSubject,
    updateBlockTags,
    updateBlockNote,
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

  return (
    <>
      <PageHeader title={t.today.title} subtitle={t.today.subtitle} />
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <section className="grid gap-4 sm:grid-cols-2">
          {todayBlocks.map((block) => (
            <StudyBlockCard
              key={block.id}
              block={block}
              now={now}
              subjects={subjects}
              tags={tags}
              onStart={() => void startBlock(block.id)}
              onPause={() => void pauseBlock(block.id)}
              onComplete={() => void completeBlock(block.id)}
              onSkip={() => void skipBlock(block.id)}
              onSubject={(subjectId) => void updateBlockSubject(block.id, subjectId)}
              onTags={(tagIds) => void updateBlockTags(block.id, tagIds)}
              onNote={(note) => void updateBlockNote(block.id, note)}
              onFocus={() => setFocusBlockId(block.id)}
            />
          ))}
        </section>
        <SurfaceCard className="h-fit">
          <h2 className="text-lg font-bold">{t.today.activeBlock}</h2>
          {activeBlock ? (
            <ActiveBlockPanel block={activeBlock} now={now} />
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
  const [error, setError] = useState("");

  function resize(nextCount: number) {
    setCount(nextCount);
    setAssignments((current) =>
      Array.from({ length: nextCount }, (_, index) => current[index] ?? { subjectId: subjects[0]?.id ?? "", tagIds: [] }),
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
      <SurfaceCard>
        <label className="text-sm font-semibold" htmlFor="block-count">
          {t.today.blockCount}
        </label>
        <input id="block-count" type="range" min={1} max={12} value={count} onChange={(event) => resize(Number(event.target.value))} className="mt-3 w-full accent-[var(--accent)]" />
        <div className="mt-2 font-mono text-2xl font-bold">{count}</div>
      </SurfaceCard>
      <div className="mt-5 grid gap-4">
        {assignments.map((assignment, index) => (
          <SurfaceCard key={index}>
            <h2 className="font-bold">Block {index + 1}</h2>
            <p className="mt-3 text-sm font-semibold text-[var(--muted)]">{t.today.chooseSubject}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <SubjectPill
                  key={subject.id}
                  subject={subject}
                  selected={assignment.subjectId === subject.id}
                  onClick={() => setAssignments((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, subjectId: subject.id } : item)))}
                />
              ))}
            </div>
            <p className="mt-4 text-sm font-semibold text-[var(--muted)]">{t.today.chooseTags}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <TagPill
                  key={tag.id}
                  tag={tag}
                  selected={assignment.tagIds.includes(tag.id)}
                  onClick={() =>
                    setAssignments((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, tagIds: item.tagIds.includes(tag.id) ? item.tagIds.filter((id) => id !== tag.id) : [...item.tagIds, tag.id] }
                          : item,
                      ),
                    )
                  }
                />
              ))}
            </div>
          </SurfaceCard>
        ))}
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
  onStart,
  onPause,
  onComplete,
  onSkip,
  onSubject,
  onTags,
  onNote,
  onFocus,
}: {
  block: StudyBlock;
  now: Date;
  subjects: ReturnType<typeof useAppStore.getState>["subjects"];
  tags: ReturnType<typeof useAppStore.getState>["tags"];
  onStart: () => void;
  onPause: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onSubject: (id: string) => void;
  onTags: (ids: string[]) => void;
  onNote: (note: string) => void;
  onFocus: () => void;
}) {
  const { t } = useAppStore();
  const subject = subjects.find((item) => item.id === block.subjectId);
  const blockTags = tags.filter((tag) => block.tagIds.includes(tag.id));
  const elapsed = visibleElapsedSeconds(block, now);
  const activeTags = tags.filter((tag) => !tag.archivedAt);
  const activeSubjects = subjects.filter((subject) => !subject.archivedAt);

  return (
    <SurfaceCard className={block.status === "active" ? "ring-2 ring-[var(--ring)]" : ""}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--muted)]">
            {block.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-[var(--success)]" /> : <Circle className="h-4 w-4" />}
            Block {block.index + 1} · {t.status[block.status]}
          </div>
          <h2 className="mt-2 text-xl font-bold">{subject?.name}</h2>
        </div>
        <div className="font-mono text-lg font-bold">{formatDuration(elapsed)}</div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {blockTags.map((tag) => (
          <TagPill key={tag.id} tag={tag} />
        ))}
      </div>
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--muted)]">{t.today.changeSubject}</summary>
        <div className="mt-3 flex flex-wrap gap-2">
          {activeSubjects.map((item) => (
            <SubjectPill key={item.id} subject={item} selected={item.id === block.subjectId} onClick={() => onSubject(item.id)} />
          ))}
        </div>
      </details>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--muted)]">{t.today.changeTags}</summary>
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
      <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-[var(--muted)]">
        <NotebookPen className="h-4 w-4" aria-hidden />
        {t.today.notes}
      </label>
      <Textarea value={block.note ?? ""} onChange={(event) => onNote(event.target.value)} placeholder={t.today.notePlaceholder} className="mt-2 w-full" />
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
        <Button variant="secondary" onClick={onFocus} disabled={block.status !== "active"}>
          {t.today.focusMode}
        </Button>
      </div>
    </SurfaceCard>
  );
}

function ActiveBlockPanel({ block, now }: { block: StudyBlock; now: Date }) {
  const subject = useAppStore((state) => state.subjects.find((item) => item.id === block.subjectId));
  const tags = useAppStore((state) => state.tags.filter((tag) => block.tagIds.includes(tag.id)));
  return (
    <div className="mt-5 grid place-items-center text-center">
      <TimerRing block={block} now={now} />
      <h3 className="mt-4 text-xl font-bold">{subject?.name}</h3>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {tags.map((tag) => (
          <TagPill key={tag.id} tag={tag} />
        ))}
      </div>
    </div>
  );
}
