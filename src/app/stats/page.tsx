"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Input, PageHeader, SurfaceCard, TagPill } from "@/components/ui";
import { buildStatsSummary } from "@/lib/analytics";
import { localDateKey } from "@/lib/date";
import { useAppStore } from "@/lib/store";
import { formatMinutes } from "@/lib/timer";
import type { StatsRange } from "@/lib/types";

export default function StatsPage() {
  const { t, subjects, tags, settings, allDays, allBlocks } = useAppStore();
  const [range, setRange] = useState<StatsRange>("30d");
  const [subjectId, setSubjectId] = useState("");
  const [tagId, setTagId] = useState("");
  const [noteQuery, setNoteQuery] = useState("");
  const [appliedNoteQuery, setAppliedNoteQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setAppliedNoteQuery(noteQuery), 350);
    return () => window.clearTimeout(timer);
  }, [noteQuery]);

  const stats = useMemo(
    () =>
      buildStatsSummary({
        days: allDays,
        blocks: allBlocks,
        subjects,
        tags,
        filters: {
          range,
          subjectId: subjectId || undefined,
          tagId: tagId || undefined,
          noteQuery: appliedNoteQuery || undefined,
        },
        todayKey: localDateKey(),
      }),
    [allBlocks, allDays, appliedNoteQuery, range, subjectId, subjects, tagId, tags],
  );
  const subjectData = useMemo(() => stats.timeBySubject.map((item) => ({ name: item.name, minutes: Math.round(item.seconds / 60), color: item.color })), [stats.timeBySubject]);
  const tagData = useMemo(() => stats.timeByTag.map((item) => ({ name: item.name, minutes: Math.round(item.seconds / 60), color: item.color })), [stats.timeByTag]);
  const weeklyData = useMemo(() => stats.weeklyTrend.map((item) => ({ name: item.label, value: item.completedBlocks })), [stats.weeklyTrend]);
  const monthlyData = useMemo(() => stats.monthlyTrend.map((item) => ({ name: item.label, value: item.completedBlocks })), [stats.monthlyTrend]);
  const consistencyDays = useMemo(() => {
    const secondsByDate = new Map<string, number>();
    for (const block of allBlocks) secondsByDate.set(block.date, (secondsByDate.get(block.date) ?? 0) + block.elapsedSeconds);
    return Array.from({ length: 49 }, (_, index) => {
      const date = localDateKey(subDays(new Date(), 48 - index));
      return { date, seconds: secondsByDate.get(date) ?? 0 };
    });
  }, [allBlocks]);

  return (
    <>
      <PageHeader title={t.stats.title} subtitle={t.stats.subtitle} />
      <SurfaceCard className="mb-5">
        <h2 className="text-lg font-bold">{t.stats.filters}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <select value={range} onChange={(event) => setRange(event.target.value as StatsRange)} className="min-h-11 rounded-2xl border border-[var(--app-border)] bg-[var(--glass)] px-4 shadow-inner shadow-slate-950/5">
            <option value="7d">{t.stats.range7}</option>
            <option value="30d">{t.stats.range30}</option>
            <option value="90d">{t.stats.range90}</option>
            <option value="all">{t.stats.allTime}</option>
          </select>
          <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className="min-h-11 rounded-2xl border border-[var(--app-border)] bg-[var(--glass)] px-4 shadow-inner shadow-slate-950/5">
            <option value="">{t.stats.allSubjects}</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <select value={tagId} onChange={(event) => setTagId(event.target.value)} className="min-h-11 rounded-2xl border border-[var(--app-border)] bg-[var(--glass)] px-4 shadow-inner shadow-slate-950/5">
            <option value="">{t.stats.allTags}</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          <Input value={noteQuery} onChange={(event) => setNoteQuery(event.target.value)} placeholder={t.stats.searchNotes} aria-label={t.stats.searchNotes} />
        </div>
      </SurfaceCard>
      {stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t.stats.totalTime} value={formatMinutes(stats.totalSeconds)} />
            <StatCard label={t.stats.completedBlocks} value={String(stats.completedBlocks)} helper={`${stats.plannedBlocks} ${t.stats.plannedShort}`} />
            <StatCard label={t.stats.completionRate} value={`${Math.round(stats.completionRate * 100)}%`} />
            <StatCard label={t.stats.currentStreak} value={String(stats.currentStreak)} helper={`${t.stats.longestStreak}: ${stats.longestStreak}`} />
            <StatCard label={t.stats.avgTime} value={formatMinutes(stats.averageSecondsPerActiveDay)} />
            <StatCard label={t.stats.avgBlocks} value={stats.averageBlocksPerActiveDay.toFixed(1)} />
            <StatCard label={t.stats.topSubject} value={stats.mostStudiedSubject?.name ?? "-"} />
            <StatCard label={t.stats.topTag} value={stats.mostUsedTag?.name ?? "-"} />
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <DonutChartCard title={t.stats.bySubject} data={subjectData} empty={t.stats.noData} />
            <DonutChartCard title={t.stats.byTag} data={tagData} empty={t.stats.noData} />
            <AreaChartCard title={t.stats.weekly} data={weeklyData} empty={t.stats.noData} />
            <AreaChartCard title={t.stats.monthly} data={monthlyData} empty={t.stats.noData} />
          </div>
          <SurfaceCard className="mt-5">
            <h2 className="text-lg font-bold">{t.stats.consistency}</h2>
            <div className="mt-4 grid grid-cols-7 gap-1.5 sm:grid-cols-[repeat(49,minmax(0,1fr))]" aria-label={t.stats.consistency}>
              {consistencyDays.map((day) => {
                const intensity = Math.min(1, day.seconds / 7200);
                return (
                  <span
                    key={day.date}
                    title={`${format(new Date(`${day.date}T00:00:00`), "MMM d")}: ${formatMinutes(day.seconds)}`}
                    className="aspect-square rounded-md border border-[var(--app-border)] shadow-sm shadow-slate-950/5"
                    style={{ backgroundColor: intensity ? `color-mix(in srgb, var(--accent) ${20 + intensity * 65}%, var(--surface))` : "var(--surface)" }}
                  />
                );
              })}
            </div>
          </SurfaceCard>
          <SurfaceCard className="mt-5">
            <h2 className="text-lg font-bold">{t.stats.notes}</h2>
            <div className="mt-4 grid gap-3">
              {stats.notes.length ? (
                stats.notes.map((note) => (
                  <article key={note.block.id} className="liquid-glass rounded-2xl p-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
                      <span>{note.block.date}</span>
                      <span>{note.subject?.name}</span>
                      {note.tags.map((tag) => (
                        <TagPill key={tag.id} tag={tag} />
                      ))}
                    </div>
                    <p className="mt-2 text-sm">{note.block.note}</p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">{t.stats.noData}</p>
              )}
            </div>
          </SurfaceCard>
          <p className="sr-only">
            {settings?.locale === "de" ? "Diagramme werden zusätzlich als Karten und Listen zusammengefasst." : "Charts are summarized through cards and lists for accessibility."}
          </p>
        </>
      ) : null}
    </>
  );
}

function StatCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <SurfaceCard>
      <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {helper ? <p className="mt-1 text-xs text-[var(--muted)]">{helper}</p> : null}
    </SurfaceCard>
  );
}

const DonutChartCard = memo(function DonutChartCard({ title, data, empty }: { title: string; data: { name: string; minutes: number; color: string }[]; empty: string }) {
  return (
    <SurfaceCard>
      <h2 className="text-lg font-bold">{title}</h2>
      {data.length ? (
        <div className="mt-4 w-full min-w-0" aria-label={title}>
          <ResponsiveContainer width="100%" height={256} minWidth={0}>
            <PieChart>
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--app-border)", color: "var(--foreground)" }} />
              <Pie data={data} dataKey="minutes" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={3}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--muted)]">{empty}</p>
      )}
    </SurfaceCard>
  );
});

const AreaChartCard = memo(function AreaChartCard({ title, data, empty }: { title: string; data: { name: string; value: number }[]; empty: string }) {
  return (
    <SurfaceCard>
      <h2 className="text-lg font-bold">{title}</h2>
      {data.length ? (
        <div className="mt-4 w-full min-w-0" aria-label={title}>
          <ResponsiveContainer width="100%" height={256} minWidth={0}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`area-${title.replace(/\s+/g, "-")}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" />
              <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--app-border)", color: "var(--foreground)" }} />
              <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} fill={`url(#area-${title.replace(/\s+/g, "-")})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--muted)]">{empty}</p>
      )}
    </SurfaceCard>
  );
});
