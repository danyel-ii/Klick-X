"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Input, PageHeader, SurfaceCard, TagPill } from "@/components/ui";
import { useAppStore } from "@/lib/store";
import { formatMinutes } from "@/lib/timer";
import type { StatsRange } from "@/lib/types";

export default function StatsPage() {
  const { t, stats, loadStats, subjects, tags, settings } = useAppStore();
  const [range, setRange] = useState<StatsRange>("30d");
  const [subjectId, setSubjectId] = useState("");
  const [tagId, setTagId] = useState("");
  const [noteQuery, setNoteQuery] = useState("");

  useEffect(() => {
    void loadStats({ range, subjectId: subjectId || undefined, tagId: tagId || undefined, noteQuery: noteQuery || undefined });
  }, [loadStats, noteQuery, range, subjectId, tagId]);

  const subjectData = stats?.timeBySubject.map((item) => ({ name: item.name, minutes: Math.round(item.seconds / 60) })) ?? [];
  const tagData = stats?.timeByTag.map((item) => ({ name: item.name, minutes: Math.round(item.seconds / 60) })) ?? [];

  return (
    <>
      <PageHeader title={t.stats.title} subtitle={t.stats.subtitle} />
      <SurfaceCard className="mb-5">
        <h2 className="text-lg font-bold">{t.stats.filters}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <select value={range} onChange={(event) => setRange(event.target.value as StatsRange)} className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3">
            <option value="7d">{t.stats.range7}</option>
            <option value="30d">{t.stats.range30}</option>
            <option value="90d">{t.stats.range90}</option>
            <option value="all">{t.stats.allTime}</option>
          </select>
          <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3">
            <option value="">{t.stats.allSubjects}</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <select value={tagId} onChange={(event) => setTagId(event.target.value)} className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3">
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
            <StatCard label={t.stats.completedBlocks} value={String(stats.completedBlocks)} helper={`${stats.plannedBlocks} planned`} />
            <StatCard label={t.stats.completionRate} value={`${Math.round(stats.completionRate * 100)}%`} />
            <StatCard label={t.stats.currentStreak} value={String(stats.currentStreak)} helper={`${t.stats.longestStreak}: ${stats.longestStreak}`} />
            <StatCard label={t.stats.avgTime} value={formatMinutes(stats.averageSecondsPerActiveDay)} />
            <StatCard label={t.stats.avgBlocks} value={stats.averageBlocksPerActiveDay.toFixed(1)} />
            <StatCard label="Top subject" value={stats.mostStudiedSubject?.name ?? "-"} />
            <StatCard label="Top tag" value={stats.mostUsedTag?.name ?? "-"} />
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <ChartCard title={t.stats.bySubject} data={subjectData} empty={t.stats.noData} />
            <ChartCard title={t.stats.byTag} data={tagData} empty={t.stats.noData} />
            <ChartCard title={t.stats.weekly} data={stats.weeklyTrend.map((item) => ({ name: item.label, minutes: Math.round(item.seconds / 60) }))} empty={t.stats.noData} />
            <ChartCard title={t.stats.monthly} data={stats.monthlyTrend.map((item) => ({ name: item.label, minutes: Math.round(item.seconds / 60) }))} empty={t.stats.noData} />
          </div>
          <SurfaceCard className="mt-5">
            <h2 className="text-lg font-bold">{t.stats.notes}</h2>
            <div className="mt-4 grid gap-3">
              {stats.notes.length ? (
                stats.notes.map((note) => (
                  <article key={note.block.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
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

function ChartCard({ title, data, empty }: { title: string; data: { name: string; minutes: number }[]; empty: string }) {
  return (
    <SurfaceCard>
      <h2 className="text-lg font-bold">{title}</h2>
      {data.length ? (
        <div className="mt-4 h-64" aria-label={title}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
              <Bar dataKey="minutes" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--muted)]">{empty}</p>
      )}
    </SurfaceCard>
  );
}
