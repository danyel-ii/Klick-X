"use client";

import { addMonths, format, isSameMonth, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, PageHeader, SubjectPill, SurfaceCard, TagPill } from "@/components/ui";
import { calendarMonthDays, formatDate, isToday, localDateKey } from "@/lib/date";
import { useAppStore } from "@/lib/store";
import { formatMinutes } from "@/lib/timer";
import type { DayAssignment, Subject, Tag } from "@/lib/types";

export default function CalendarPage() {
  const { t, settings, calendarSummary, allBlocks, subjects, tags, createOrUpdateDayPlan } = useAppStore();
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(localDateKey());
  const [draftCount, setDraftCount] = useState(3);
  const [draftAssignments, setDraftAssignments] = useState<DayAssignment[]>(() => Array.from({ length: 3 }, () => ({ subjectId: "", tagIds: [] })));
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [error, setError] = useState("");
  const days = calendarMonthDays(month, settings?.startOfWeek ?? "monday");
  const summaryByDate = useMemo(() => new Map(calendarSummary.map((summary) => [summary.date, summary])), [calendarSummary]);
  const selectedSummary = summaryByDate.get(selected);
  const selectedBlocks = allBlocks.filter((block) => block.date === selected).sort((a, b) => a.index - b.index);
  const activeSubjects = subjects.filter((subject) => !subject.archivedAt);
  const activeTags = tags.filter((tag) => !tag.archivedAt);

  function resizeDraft(nextCount: number) {
    const clamped = Math.min(12, Math.max(1, nextCount));
    setDraftCount(clamped);
    setDraftAssignments((current) => Array.from({ length: clamped }, (_, index) => current[index] ?? { subjectId: "", tagIds: [] }));
    setSelectedSlot((slot) => Math.min(slot, clamped - 1));
  }

  function assignSubject(subjectId: string) {
    setDraftAssignments((current) => current.map((item, index) => (index === selectedSlot ? { ...item, subjectId } : item)));
  }

  function toggleTag(tagId: string) {
    setDraftAssignments((current) =>
      current.map((item, index) =>
        index === selectedSlot ? { ...item, tagIds: item.tagIds.includes(tagId) ? item.tagIds.filter((id) => id !== tagId) : [...item.tagIds, tagId] } : item,
      ),
    );
  }

  async function scheduleSelectedDay() {
    if (draftAssignments.some((assignment) => !assignment.subjectId)) {
      setError(t.today.subjectRequired);
      return;
    }
    setError("");
    await createOrUpdateDayPlan(selected, draftCount, draftAssignments);
  }

  return (
    <>
      <PageHeader title={t.calendar.title} subtitle={t.calendar.subtitle} />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <SurfaceCard>
          <div className="mb-4 flex items-center justify-between">
            <Button variant="secondary" aria-label="Previous month" onClick={() => setMonth((value) => subMonths(value, 1))}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Button>
            <h2 className="text-lg font-bold">{format(month, "MMMM yyyy")}</h2>
            <Button variant="secondary" aria-label="Next month" onClick={() => setMonth((value) => addMonths(value, 1))}>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => {
              const key = localDateKey(day);
              const summary = summaryByDate.get(key);
              const intensity = Math.min(1, (summary?.studiedSeconds ?? 0) / 7200);
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={`${format(day, "PPP")}: ${formatMinutes(summary?.studiedSeconds ?? 0)} ${t.calendar.studied}`}
                  onClick={() => setSelected(key)}
                  className={`aspect-square rounded-lg border p-1 text-left text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${selected === key ? "border-[var(--accent)]" : "border-[var(--app-border)]"} ${isSameMonth(day, month) ? "opacity-100" : "opacity-40"}`}
                  style={{ backgroundColor: intensity ? `color-mix(in srgb, var(--accent) ${20 + intensity * 55}%, var(--surface))` : "var(--surface)" }}
                >
                  <span className={isToday(day) ? "rounded-full bg-[var(--foreground)] px-1.5 py-0.5 text-[var(--background)]" : ""}>{format(day, "d")}</span>
                </button>
              );
            })}
          </div>
        </SurfaceCard>
        <SurfaceCard>
          <h2 className="text-lg font-bold">{formatDate(selected, settings?.locale ?? "en")}</h2>
          {selectedSummary ? (
            <div className="mt-3 grid gap-2 text-sm text-[var(--muted)]">
              <p>{t.calendar.studied}: {formatMinutes(selectedSummary.studiedSeconds)}</p>
              <p>{selectedSummary.completedBlocks} {t.calendar.completed} · {selectedSummary.plannedBlocks} {t.calendar.planned}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--muted)]">{t.calendar.noBlocks}</p>
          )}
          <div className="mt-5 grid gap-3">
            {selectedBlocks.map((block) => {
              const subject = subjects.find((item) => item.id === block.subjectId);
              const blockTags = tags.filter((tag) => block.tagIds.includes(tag.id));
              return (
                <div key={block.id} className="rounded-lg border border-[var(--app-border)] bg-[var(--surface)] p-3">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold">{subject?.name}</span>
                    <span className="font-mono text-sm">{formatMinutes(block.elapsedSeconds)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {blockTags.map((tag) => (
                      <TagPill key={tag.id} tag={tag} />
                    ))}
                  </div>
                  {block.note ? <p className="mt-2 text-sm text-[var(--muted)]">{block.note}</p> : null}
                </div>
              );
            })}
          </div>
          {!selectedBlocks.length ? (
            <ScheduleDraft
              subjects={activeSubjects}
              tags={activeTags}
              count={draftCount}
              assignments={draftAssignments}
              selectedSlot={selectedSlot}
              error={error}
              onResize={resizeDraft}
              onSelectSlot={setSelectedSlot}
              onSubject={assignSubject}
              onTag={toggleTag}
              onSubmit={() => void scheduleSelectedDay()}
            />
          ) : null}
        </SurfaceCard>
      </div>
    </>
  );
}

function ScheduleDraft({
  subjects,
  tags,
  count,
  assignments,
  selectedSlot,
  error,
  onResize,
  onSelectSlot,
  onSubject,
  onTag,
  onSubmit,
}: {
  subjects: Subject[];
  tags: Tag[];
  count: number;
  assignments: DayAssignment[];
  selectedSlot: number;
  error: string;
  onResize: (count: number) => void;
  onSelectSlot: (slot: number) => void;
  onSubject: (subjectId: string) => void;
  onTag: (tagId: string) => void;
  onSubmit: () => void;
}) {
  const { t } = useAppStore();

  return (
    <div className="mt-5 rounded-2xl border border-[var(--app-border)] bg-[var(--surface)] p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold">{t.calendar.planSelectedDay}</h3>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" aria-label="Decrease blocks" onClick={() => onResize(count - 1)} className="h-9 min-h-9 w-9 px-0">
            <Minus className="h-4 w-4" aria-hidden />
          </Button>
          <span className="w-8 text-center font-mono font-bold">{count}</span>
          <Button type="button" variant="secondary" aria-label="Increase blocks" onClick={() => onResize(count + 1)} className="h-9 min-h-9 w-9 px-0">
            <Plus className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {assignments.map((assignment, index) => {
          const subject = subjects.find((item) => item.id === assignment.subjectId);
          return (
            <button
              key={index}
              type="button"
              aria-pressed={selectedSlot === index}
              onClick={() => onSelectSlot(index)}
              className={`min-h-16 rounded-lg border p-2 text-left text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${selectedSlot === index ? "border-[var(--accent)] bg-[var(--card)]" : "border-[var(--app-border)] bg-[var(--background)]/40"}`}
            >
              <span className="font-mono text-[var(--muted)]">#{index + 1}</span>
              <span className="mt-1 block truncate font-semibold">{subject?.name ?? t.today.chooseSubject}</span>
              {assignment.tagIds.length ? <span className="mt-1 block text-[var(--muted)]">{assignment.tagIds.length} tags</span> : null}
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-sm font-semibold text-[var(--muted)]">{t.today.chooseSubject}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {subjects.map((subject) => (
          <SubjectPill key={subject.id} subject={subject} selected={assignments[selectedSlot]?.subjectId === subject.id} onClick={() => onSubject(subject.id)} />
        ))}
      </div>
      <p className="mt-4 text-sm font-semibold text-[var(--muted)]">{t.today.chooseTags}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <TagPill key={tag.id} tag={tag} selected={assignments[selectedSlot]?.tagIds.includes(tag.id)} onClick={() => onTag(tag.id)} />
        ))}
      </div>
      {error ? <p className="mt-3 text-sm font-semibold text-[var(--destructive)]">{error}</p> : null}
      <Button type="button" onClick={onSubmit} disabled={!subjects.length} className="mt-4 w-full">
        {t.calendar.scheduleDay}
      </Button>
    </div>
  );
}
