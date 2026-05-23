"use client";

import Link from "next/link";
import { CalendarDays, CheckCircle2, ClipboardList, Clock3, Play, TimerReset } from "lucide-react";
import { PageHeader, SurfaceCard, TagPill } from "@/components/ui";
import { localDateKey } from "@/lib/date";
import { useAppStore } from "@/lib/store";
import { formatMinutes } from "@/lib/timer";
import type { StudyBlock } from "@/lib/types";

function workedSeconds(block: StudyBlock) {
  return block.status === "completed" || block.elapsedSeconds > 0 ? block.elapsedSeconds : 0;
}

export default function HomePage() {
  const { t, todayBlocks, allBlocks, calendarSummary, subjects, tags } = useAppStore();
  const todayKey = localDateKey();
  const completedToday = todayBlocks.filter((block) => block.status === "completed").length;
  const plannedToday = todayBlocks.length;
  const activeBlock = todayBlocks.find((block) => block.status === "active");
  const nextBlock = activeBlock ?? todayBlocks.find((block) => block.status === "planned" || block.status === "paused");
  const todaySeconds = todayBlocks.reduce((sum, block) => sum + workedSeconds(block), 0);
  const upcomingDays = calendarSummary.filter((day) => day.date > todayKey && day.plannedBlocks > 0).slice(0, 4);
  const openBlocks = allBlocks
    .filter((block) => block.date >= todayKey && (block.status === "planned" || block.status === "paused" || block.status === "active"))
    .sort((a, b) => a.date.localeCompare(b.date) || a.index - b.index)
    .slice(0, 6);
  const nextSubject = subjects.find((subject) => subject.id === nextBlock?.subjectId);
  const nextTags = tags.filter((tag) => nextBlock?.tagIds.includes(tag.id));
  const progress = plannedToday ? Math.round((completedToday / plannedToday) * 100) : 0;

  return (
    <>
      <PageHeader
        title={t.home.title}
        subtitle={t.home.subtitle}
        action={
          <Link href="/today" className="soft-shimmer inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-content)] shadow-[0_14px_32px_color-mix(in_srgb,var(--accent)_24%,transparent)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
            <Play className="h-4 w-4" aria-hidden />
            {t.home.openToday}
          </Link>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard icon={CheckCircle2} label={t.home.todayProgress} value={`${completedToday}/${plannedToday || 0}`} detail={`${progress}%`} />
            <MetricCard icon={Clock3} label={t.home.studiedToday} value={formatMinutes(todaySeconds)} detail={t.calendar.studied} />
            <MetricCard icon={ClipboardList} label={t.home.openBlocks} value={String(openBlocks.length)} detail={t.status.planned} />
          </div>
          <SurfaceCard>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{t.home.priority}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{t.home.priorityHint}</p>
              </div>
              <TimerReset className="h-5 w-5 text-[var(--muted)]" aria-hidden />
            </div>
            {nextBlock ? (
              <div className="mt-5 grid gap-4 rounded-2xl border border-[var(--app-border)] bg-[var(--glass)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--muted)]">
                      {nextBlock.date} · Block {nextBlock.index + 1}
                    </p>
                    <h3 className="mt-1 text-2xl font-semibold tracking-normal">{nextSubject?.name ?? t.home.unknownSubject}</h3>
                  </div>
                  <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-sm font-semibold">{t.status[nextBlock.status]}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {nextTags.map((tag) => (
                    <TagPill key={tag.id} tag={tag} />
                  ))}
                </div>
                <Link href="/today" className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-content)]">
                  <Play className="h-4 w-4" aria-hidden />
                  {t.home.workBlock}
                </Link>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--glass)] p-4 text-sm text-[var(--muted)]">{t.home.emptyPriority}</div>
            )}
          </SurfaceCard>
        </section>
        <section className="grid gap-5">
          <SurfaceCard>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">{t.home.upcoming}</h2>
              <Link href="/calendar" className="text-sm font-semibold text-[var(--accent)]">{t.nav.calendar}</Link>
            </div>
            <div className="mt-4 grid gap-2">
              {upcomingDays.length ? (
                upcomingDays.map((day) => (
                  <div key={day.date} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--glass)] px-3 py-2">
                    <span className="font-semibold">{day.date}</span>
                    <span className="text-sm text-[var(--muted)]">
                      {day.plannedBlocks} {t.calendar.planned}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">{t.home.noUpcoming}</p>
              )}
            </div>
          </SurfaceCard>
          <SurfaceCard>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">{t.home.queue}</h2>
              <CalendarDays className="h-5 w-5 text-[var(--muted)]" aria-hidden />
            </div>
            <div className="mt-4 grid gap-2">
              {openBlocks.length ? (
                openBlocks.map((block) => {
                  const subject = subjects.find((item) => item.id === block.subjectId);
                  return (
                    <div key={block.id} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl bg-[var(--glass)] px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{subject?.name ?? t.home.unknownSubject}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {block.date} · Block {block.index + 1}
                        </p>
                      </div>
                      <span className="rounded-full bg-[var(--surface)] px-2 py-1 text-xs font-semibold">{t.status[block.status]}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-[var(--muted)]">{t.home.emptyQueue}</p>
              )}
            </div>
          </SurfaceCard>
        </section>
      </div>
    </>
  );
}

function MetricCard({ icon: Icon, label, value, detail }: { icon: typeof CheckCircle2; label: string; value: string; detail: string }) {
  return (
    <SurfaceCard className="p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-[var(--muted)]">{label}</span>
        <Icon className="h-5 w-5 text-[var(--accent)]" aria-hidden />
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <span className="font-mono text-3xl font-bold tracking-normal">{value}</span>
        <span className="pb-1 text-sm font-semibold text-[var(--muted)]">{detail}</span>
      </div>
    </SurfaceCard>
  );
}
