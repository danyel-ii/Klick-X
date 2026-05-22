import { endOfWeek, format, parseISO, startOfWeek } from "date-fns";
import { resolveSubjectColor, resolveTagColor } from "./colors";
import { rangeStart } from "./date";
import type {
  BreakdownItem,
  StatsFilters,
  StatsSummary,
  StudyBlock,
  StudyDay,
  Subject,
  Tag,
  TrendItem,
} from "./types";

function studiedSeconds(block: StudyBlock) {
  return block.status === "completed" || block.elapsedSeconds > 0 ? block.elapsedSeconds : 0;
}

function matchesFilters(block: StudyBlock, filters: StatsFilters) {
  if (filters.subjectId && block.subjectId !== filters.subjectId) return false;
  if (filters.tagId && !block.tagIds.includes(filters.tagId)) return false;
  if (filters.noteQuery) {
    return (block.note ?? "").toLowerCase().includes(filters.noteQuery.toLowerCase());
  }
  return true;
}

export function calculateStreaks(blocks: StudyBlock[], todayKey: string) {
  const studiedDays = new Set(
    blocks.filter((block) => studiedSeconds(block) > 0).map((block) => block.date),
  );
  const sortedDays = [...studiedDays].sort();
  let longestStreak = 0;
  let running = 0;
  let previous: string | null = null;

  for (const day of sortedDays) {
    const diff = previous
      ? Math.round((parseISO(day).getTime() - parseISO(previous).getTime()) / 86_400_000)
      : 1;
    running = diff === 1 ? running + 1 : 1;
    longestStreak = Math.max(longestStreak, running);
    previous = day;
  }

  let currentStreak = 0;
  let cursor = parseISO(todayKey);
  while (studiedDays.has(format(cursor, "yyyy-MM-dd"))) {
    currentStreak += 1;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }

  return { currentStreak, longestStreak };
}

export function completionRate(completedBlocks: number, plannedBlocks: number) {
  return plannedBlocks > 0 ? completedBlocks / plannedBlocks : 0;
}

function upsertBreakdown(
  map: Map<string, BreakdownItem>,
  id: string,
  fallbackName: string,
  color: string,
  seconds: number,
) {
  const item = map.get(id) ?? { id, name: fallbackName, color, seconds: 0, blocks: 0 };
  item.seconds += seconds;
  item.blocks += 1;
  map.set(id, item);
}

function trend(blocks: StudyBlock[], mode: "week" | "month"): TrendItem[] {
  const map = new Map<string, TrendItem>();
  for (const block of blocks) {
    const seconds = studiedSeconds(block);
    if (!seconds) continue;
    const date = parseISO(block.date);
    const key =
      mode === "week"
        ? format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd")
        : format(date, "yyyy-MM");
    const label =
      mode === "week"
        ? `${format(startOfWeek(date, { weekStartsOn: 1 }), "MMM d")} - ${format(endOfWeek(date, { weekStartsOn: 1 }), "MMM d")}`
        : format(date, "MMM yyyy");
    const item = map.get(key) ?? { label, date: key, seconds: 0, completedBlocks: 0 };
    item.seconds += seconds;
    if (block.status === "completed") item.completedBlocks += 1;
    map.set(key, item);
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function buildStatsSummary({
  days,
  blocks,
  subjects,
  tags,
  filters,
  todayKey,
}: {
  days: StudyDay[];
  blocks: StudyBlock[];
  subjects: Subject[];
  tags: Tag[];
  filters: StatsFilters;
  todayKey: string;
}): StatsSummary {
  const range = rangeStart(filters.range, parseISO(todayKey));
  const rangeBlocks = blocks.filter((block) => (!range || block.date >= range) && matchesFilters(block, filters));
  const rangeDays = days.filter((day) => !range || day.date >= range);
  const subjectsById = new Map(subjects.map((subject) => [subject.id, subject]));
  const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
  const totalSeconds = rangeBlocks.reduce((sum, block) => sum + studiedSeconds(block), 0);
  const completedBlocks = rangeBlocks.filter((block) => block.status === "completed").length;
  const plannedBlocks = rangeDays.reduce((sum, day) => sum + day.plannedBlockCount, 0);
  const activeDays = new Set(rangeBlocks.filter((block) => studiedSeconds(block) > 0).map((block) => block.date));
  const subjectMap = new Map<string, BreakdownItem>();
  const tagMap = new Map<string, BreakdownItem>();

  for (const block of rangeBlocks) {
    const seconds = studiedSeconds(block);
    if (!seconds) continue;
    const subject = subjectsById.get(block.subjectId);
    upsertBreakdown(subjectMap, block.subjectId, subject?.name ?? "Unknown", resolveSubjectColor(subject?.color), seconds);
    for (const tagId of block.tagIds) {
      const tag = tagsById.get(tagId);
      upsertBreakdown(tagMap, tagId, tag?.name ?? "Unknown", resolveTagColor(tag?.color), seconds);
    }
  }

  const timeBySubject = [...subjectMap.values()].sort((a, b) => b.seconds - a.seconds);
  const timeByTag = [...tagMap.values()].sort((a, b) => b.seconds - a.seconds);
  const { currentStreak, longestStreak } = calculateStreaks(blocks, todayKey);

  return {
    totalSeconds,
    completedBlocks,
    plannedBlocks,
    completionRate: completionRate(completedBlocks, plannedBlocks),
    currentStreak,
    longestStreak,
    averageSecondsPerActiveDay: activeDays.size ? totalSeconds / activeDays.size : 0,
    averageBlocksPerActiveDay: activeDays.size ? completedBlocks / activeDays.size : 0,
    timeBySubject,
    timeByTag,
    weeklyTrend: trend(rangeBlocks, "week"),
    monthlyTrend: trend(rangeBlocks, "month"),
    mostStudiedSubject: timeBySubject[0],
    mostUsedTag: timeByTag[0],
    notes: rangeBlocks
      .filter((block) => block.note?.trim())
      .map((block) => ({
        block,
        subject: subjectsById.get(block.subjectId),
        tags: block.tagIds.map((id) => tagsById.get(id)).filter(Boolean) as Tag[],
      }))
      .sort((a, b) => b.block.date.localeCompare(a.block.date)),
  };
}
