"use client";

import { addMonths, format, isSameMonth, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, PageHeader, SurfaceCard, TagPill } from "@/components/ui";
import { calendarMonthDays, formatDate, isToday, localDateKey } from "@/lib/date";
import { useAppStore } from "@/lib/store";
import { formatMinutes } from "@/lib/timer";

export default function CalendarPage() {
  const { t, settings, calendarSummary, allBlocks, subjects, tags } = useAppStore();
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(localDateKey());
  const days = calendarMonthDays(month, settings?.startOfWeek ?? "monday");
  const summaryByDate = useMemo(() => new Map(calendarSummary.map((summary) => [summary.date, summary])), [calendarSummary]);
  const selectedSummary = summaryByDate.get(selected);
  const selectedBlocks = allBlocks.filter((block) => block.date === selected).sort((a, b) => a.index - b.index);

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
        </SurfaceCard>
      </div>
    </>
  );
}
