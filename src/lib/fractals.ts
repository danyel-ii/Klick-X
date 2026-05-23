import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { calculateStreaks } from "./analytics";
import { resolveSubjectColor, resolveTagColor } from "./colors";
import type { DailyFractal, FractalConfig, FractalParams, StudyBlock, Subject, Tag } from "./types";

const fallbackSubjectColor = "var(--color-primary)";
const fallbackTagColor = "var(--color-secondary)";
const fallbackPalette = ["var(--color-primary)", "var(--color-secondary)", "var(--color-accent)", "var(--color-info)"];

function studiedSeconds(block: StudyBlock) {
  return block.status === "completed" || block.elapsedSeconds > 0 ? block.elapsedSeconds : 0;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function countConsecutiveDays(days: Set<string>, date: string) {
  let count = 0;
  let cursor = parseISO(date);
  while (days.has(format(cursor, "yyyy-MM-dd"))) {
    count += 1;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }
  return count;
}

function daysSinceLastUse(date: string, blocks: StudyBlock[]) {
  const previousDates = new Set(blocks.filter((block) => block.date < date && studiedSeconds(block) > 0).map((block) => block.date));
  const latest = [...previousDates].sort().at(-1);
  if (!latest) return 0;
  return Math.max(0, differenceInCalendarDays(parseISO(date), parseISO(latest)) - 1);
}

function completedPomodoroStreak(date: string, blocks: StudyBlock[]) {
  const dates = [...new Set(blocks.filter((block) => block.date <= date && block.status === "completed").map((block) => block.date))].sort();
  let streak = 0;
  let cursor = parseISO(date);
  const completedDays = new Set(dates);
  while (completedDays.has(format(cursor, "yyyy-MM-dd"))) {
    const key = format(cursor, "yyyy-MM-dd");
    streak += blocks.filter((block) => block.date === key && block.status === "completed").length;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }
  return streak;
}

function entityStreaks(date: string, blocks: StudyBlock[], ids: string[], mode: "subject" | "tag") {
  const result: Record<string, number> = {};
  for (const id of ids) {
    const days = new Set(
      blocks
        .filter((block) => block.date <= date && studiedSeconds(block) > 0 && (mode === "subject" ? block.subjectId === id : block.tagIds.includes(id)))
        .map((block) => block.date),
    );
    result[id] = countConsecutiveDays(days, date);
  }
  return result;
}

function dominantSubject(dateBlocks: StudyBlock[], subjects: Subject[]) {
  const totals = new Map<string, number>();
  for (const block of dateBlocks) {
    totals.set(block.subjectId, (totals.get(block.subjectId) ?? 0) + studiedSeconds(block));
  }
  const dominantId = [...totals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? dateBlocks[0]?.subjectId;
  const subject = subjects.find((item) => item.id === dominantId);
  return { id: dominantId, color: resolveSubjectColor(subject?.color ?? fallbackSubjectColor) };
}

function dominantTags(dateBlocks: StudyBlock[], tags: Tag[]) {
  const totals = new Map<string, number>();
  for (const block of dateBlocks) {
    const seconds = studiedSeconds(block);
    for (const tagId of block.tagIds) totals.set(tagId, (totals.get(tagId) ?? 0) + seconds);
  }
  const ids = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id);
  return {
    ids,
    colors: ids.map((id) => resolveTagColor(tags.find((tag) => tag.id === id)?.color ?? fallbackTagColor)),
  };
}

export function buildFractalParams({
  date,
  blocks,
  subjects,
  tags,
}: {
  date: string;
  blocks: StudyBlock[];
  subjects: Subject[];
  tags: Tag[];
}): FractalParams {
  const dateBlocks = blocks.filter((block) => block.date === date);
  const completedBlocksToday = dateBlocks.filter((block) => block.status === "completed").length;
  const totalMinutesToday = Math.round(dateBlocks.reduce((sum, block) => sum + studiedSeconds(block), 0) / 60);
  const { currentStreak, longestStreak } = calculateStreaks(blocks, date);
  const subject = dominantSubject(dateBlocks, subjects);
  const tagSet = dominantTags(dateBlocks, tags);
  const gap = daysSinceLastUse(date, blocks);
  const seed = `${date}:${completedBlocksToday}:${currentStreak}:${gap}:${subject.id ?? "none"}:${tagSet.ids.join(",")}`;

  return {
    date,
    dailyPomodoroCount: completedBlocksToday,
    consecutivePomodoroStreak: completedPomodoroStreak(date, blocks),
    overallStudyStreakDays: currentStreak,
    longestStudyStreakDays: longestStreak,
    subjectStreaks: entityStreaks(date, blocks, subjects.map((subjectItem) => subjectItem.id), "subject"),
    tagStreaks: entityStreaks(date, blocks, tags.map((tag) => tag.id), "tag"),
    totalMinutesToday,
    completedBlocksToday,
    daysSinceLastUse: gap,
    dominantSubjectId: subject.id,
    dominantSubjectColor: subject.color,
    dominantTagIds: tagSet.ids,
    dominantTagColors: tagSet.colors,
    seed,
  };
}

export function generateFractalConfig(params: FractalParams): FractalConfig {
  const random = mulberry32(hashString(params.seed));
  const palette = [params.dominantSubjectColor, ...params.dominantTagColors, ...fallbackPalette].slice(0, 6);
  const complexity = Math.min(9, 3 + params.completedBlocksToday + Math.floor(params.overallStudyStreakDays / 3));
  const gapShift = Math.min(8, params.daysSinceLastUse);
  const symmetry = 5 + ((params.overallStudyStreakDays + gapShift) % 7);
  const branchCount = 4 + Math.min(6, params.dominantTagIds.length + Math.floor(params.consecutivePomodoroStreak / 2));

  return {
    seed: params.seed,
    background: ["color-mix(in srgb, var(--surface) 70%, black)", "color-mix(in srgb, var(--background) 76%, var(--accent))"],
    palette,
    depth: complexity,
    symmetry,
    rotation: random() * Math.PI * 2,
    curl: 0.1 + random() * 0.34 + gapShift * 0.025,
    spread: 0.34 + random() * 0.22 + Math.min(0.24, params.longestStudyStreakDays * 0.01),
    branchScale: 0.62 + random() * 0.11,
    lineWidth: 1.25 + Math.min(4, params.completedBlocksToday * 0.45),
    glow: 0.2 + Math.min(0.55, params.totalMinutesToday / 240),
    rings: Math.min(10, 2 + params.daysSinceLastUse + Math.floor(params.dailyPomodoroCount / 2)),
    branches: Array.from({ length: branchCount }, (_, index) => ({
      angle: (index / branchCount) * Math.PI * 2 + (random() - 0.5) * 0.55,
      length: 0.42 + random() * 0.26,
      width: 0.8 + random() * 1.8,
      color: palette[index % palette.length],
    })),
  };
}

export function buildDailyFractal({
  existing,
  date,
  blocks,
  subjects,
  tags,
  now,
}: {
  existing?: DailyFractal | null;
  date: string;
  blocks: StudyBlock[];
  subjects: Subject[];
  tags: Tag[];
  now: string;
}): DailyFractal {
  const params = buildFractalParams({ date, blocks, subjects, tags });
  return {
    id: existing?.id ?? `fractal_${date}`,
    date,
    seed: params.seed,
    params,
    config: generateFractalConfig(params),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}
