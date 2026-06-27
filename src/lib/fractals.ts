import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { calculateStreaks } from "./analytics";
import { resolveSubjectColor, resolveTagColor } from "./colors";
import type { ArtworkFace, ArtworkPoint, ArtworkSegment, ArtworkStats, CoinPartitionArtwork, DailyFractal, FractalConfig, FractalParams, StudyBlock, Subject, Tag } from "./types";

const fallbackSubjectColor = "var(--color-primary)";
const fallbackTagColor = "var(--color-secondary)";
const fallbackPalette = ["var(--color-primary)", "var(--color-secondary)", "var(--color-accent)", "var(--color-info)"];
const pageWidth = 210;
const pageHeight = 297;
export const artworkStepCount = 24;
const defaultHatchSpacing = 3;
const geometryEpsilon = 1e-7;

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

function randomFromSeed(seed: string) {
  return mulberry32(hashString(seed));
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
  const seed = [
    "coin-partition-art",
    date,
    `streak-${currentStreak}`,
    `longest-${longestStreak}`,
    `pomodoro-streak-${completedPomodoroStreak(date, blocks)}`,
    `completed-${completedBlocksToday}`,
    `rest-${gap}`,
    `subject-${subject.id ?? "none"}`,
    `tags-${tagSet.ids.join(",")}`,
  ].join(":");

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
  const random = randomFromSeed(params.seed);
  const palette = [params.dominantSubjectColor, ...params.dominantTagColors, ...fallbackPalette].slice(0, 6);
  const artwork = generateCoinPartitionArtwork(params.seed, artworkStepCount, defaultHatchSpacing);
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
    artwork,
  };
}

function dateRange(startDate: string, endDate: string) {
  const dates: string[] = [];
  let cursor = parseISO(startDate);
  const end = parseISO(endDate);
  while (cursor <= end) {
    dates.push(format(cursor, "yyyy-MM-dd"));
    cursor = new Date(cursor.getTime() + 86_400_000);
  }
  return dates;
}

function completedBlocksByDate(blocks: StudyBlock[]) {
  const map = new Map<string, StudyBlock[]>();
  for (const block of blocks) {
    if (block.status !== "completed") continue;
    map.set(block.date, [...(map.get(block.date) ?? []), block]);
  }
  return map;
}

function studiedBlocksBetween(blocks: StudyBlock[], startDate: string, endDate: string) {
  return blocks.filter((block) => block.date >= startDate && block.date <= endDate && studiedSeconds(block) > 0);
}

function blocksForArtworkCycle(blocks: StudyBlock[], startDate: string, createdAt: string) {
  return blocks.filter((block) => {
    if (block.date < startDate) return false;
    if (block.date > startDate) return true;
    const blockTimestamp = block.completedAt ?? block.updatedAt;
    return blockTimestamp >= createdAt;
  });
}

function buildArtworkStats(blocks: StudyBlock[], startDate: string, endDate: string | null): ArtworkStats {
  const effectiveEndDate = endDate ?? startDate;
  const scopedBlocks = studiedBlocksBetween(blocks, startDate, effectiveEndDate);
  const completedBlocks = scopedBlocks.filter((block) => block.status === "completed").length;
  const activeDays = new Set(scopedBlocks.map((block) => block.date));
  const totalSeconds = scopedBlocks.reduce((sum, block) => sum + studiedSeconds(block), 0);
  return {
    startDate,
    endDate,
    calendarDays: Math.max(1, differenceInCalendarDays(parseISO(effectiveEndDate), parseISO(startDate)) + 1),
    activeDays: activeDays.size,
    completedBlocks,
    totalSeconds,
    averageBlocksPerActiveDay: activeDays.size ? completedBlocks / activeDays.size : 0,
    averageSecondsPerActiveDay: activeDays.size ? totalSeconds / activeDays.size : 0,
    subjectIds: [...new Set(scopedBlocks.map((block) => block.subjectId))],
    tagIds: [...new Set(scopedBlocks.flatMap((block) => block.tagIds))],
  };
}

export function calculateArtworkProgress({
  startDate,
  asOfDate,
  blocks,
}: {
  startDate: string;
  asOfDate: string;
  blocks: StudyBlock[];
}) {
  const byDate = completedBlocksByDate(blocks);
  let visibleSteps = 0;
  let completedAt: string | null = null;

  for (const date of dateRange(startDate, asOfDate)) {
    const completedToday = byDate.get(date)?.length ?? 0;
    if (completedToday > 0) {
      visibleSteps += completedToday;
    } else if (date > startDate) {
      visibleSteps -= 1;
    }
    visibleSteps = Math.max(0, Math.min(artworkStepCount, visibleSteps));
    if (visibleSteps >= artworkStepCount) {
      completedAt = date;
      break;
    }
  }

  return { visibleSteps, completedAt };
}

type CoinSide = "heads" | "tails";
type CoinToss = ArtworkPoint & { theta: number; side: CoinSide };
type Triangle = readonly [ArtworkPoint, ArtworkPoint, ArtworkPoint];

function generateCoinPartitionArtwork(seed: string, lineCount: number, hatchSpacing: number): CoinPartitionArtwork {
  const random = randomFromSeed(seed);
  let regions: ArtworkPoint[][] = [[point(0, 0), point(pageWidth, 0), point(pageWidth, pageHeight), point(0, pageHeight)]];

  for (let index = 0; index < lineCount; index += 1) {
    const toss = orientedCoinToss(random, [point(0, 0), point(pageWidth, 0), point(pageWidth, pageHeight), point(0, pageHeight)]);
    const nextRegions: ArtworkPoint[][] = [];
    for (const region of regions) {
      const pieces = splitConvexPolygon(region, toss);
      nextRegions.push(...pieces);
    }
    regions = nextRegions.sort(regionSortKey);
  }

  const faces: ArtworkFace[] = regions.sort(regionSortKey).map((polygon, index) => {
    const hatchToss = orientedCoinToss(random, polygon);
    const polarityToss = orientedCoinToss(random, polygon);
    const colorToss = orientedCoinToss(random, polygon);
    return {
      id: index + 1,
      polygon,
      hatchSegments: generateHatchesForPolygon(polygon, hatchToss.theta, hatchSpacing),
      inverted: polarityToss.side === "tails",
      color: colorFromToss(colorToss),
    };
  });

  return { pageWidth, pageHeight, lineCount, hatchSpacing, faces };
}

function point(x: number, y: number): ArtworkPoint {
  return { x, y };
}

function orientedCoinToss(random: () => number, polygon: ArtworkPoint[]): CoinToss {
  const sampled = samplePointInConvexPolygon(random, polygon);
  return {
    ...sampled,
    theta: random() * Math.PI,
    side: random() < 0.5 ? "heads" : "tails",
  };
}

function samplePointInConvexPolygon(random: () => number, polygon: ArtworkPoint[]) {
  if (isPageRectangle(polygon)) return point(random() * pageWidth, random() * pageHeight);
  const origin = polygon[0];
  if (!origin || polygon.length < 3) return centroid(polygon);
  const triangles = polygon.slice(1, -1).flatMap<Triangle>((vertex, index) => {
    const next = polygon[index + 2];
    return next ? [[origin, vertex, next]] : [];
  });
  const weights = triangles.map(([a, b, c]) => Math.abs(cross(subtract(b, a), subtract(c, a))) / 2);
  const total = weights.reduce((sum, value) => sum + value, 0);
  const fallbackTriangle = triangles[triangles.length - 1];
  if (total <= geometryEpsilon || !fallbackTriangle) return centroid(polygon);

  let target = random() * total;
  let selected: Triangle = fallbackTriangle;
  for (let index = 0; index < triangles.length; index += 1) {
    target -= weights[index] ?? 0;
    const triangle = triangles[index];
    if (target <= 0 && triangle) {
      selected = triangle;
      break;
    }
  }
  const [a, b, c] = selected;
  let r1 = random();
  let r2 = random();
  if (r1 + r2 > 1) {
    r1 = 1 - r1;
    r2 = 1 - r2;
  }
  return point(a.x + r1 * (b.x - a.x) + r2 * (c.x - a.x), a.y + r1 * (b.y - a.y) + r2 * (c.y - a.y));
}

function isPageRectangle(polygon: ArtworkPoint[]) {
  if (polygon.length !== 4) return false;
  const bounds = polygonBounds(polygon);
  return Math.abs(bounds.minX) < geometryEpsilon && Math.abs(bounds.minY) < geometryEpsilon && Math.abs(bounds.maxX - pageWidth) < geometryEpsilon && Math.abs(bounds.maxY - pageHeight) < geometryEpsilon;
}

function splitConvexPolygon(polygon: ArtworkPoint[], toss: CoinToss) {
  const positive = clipPolygonHalfPlane(polygon, toss, 1);
  const negative = clipPolygonHalfPlane(polygon, toss, -1);
  return [positive, negative].filter((piece) => piece.length >= 3 && polygonArea(piece) > geometryEpsilon);
}

function clipPolygonHalfPlane(polygon: ArtworkPoint[], line: CoinToss, side: 1 | -1) {
  const result: ArtworkPoint[] = [];
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    if (!current || !next) continue;
    const currentDistance = side * signedLineDistance(current, line);
    const nextDistance = side * signedLineDistance(next, line);
    const currentInside = currentDistance >= -geometryEpsilon;
    const nextInside = nextDistance >= -geometryEpsilon;

    if (currentInside && nextInside) {
      pushUnique(result, next);
    } else if (currentInside && !nextInside) {
      pushUnique(result, interpolate(current, next, currentDistance, nextDistance));
    } else if (!currentInside && nextInside) {
      pushUnique(result, interpolate(current, next, currentDistance, nextDistance));
      pushUnique(result, next);
    }
  }
  return result;
}

function signedLineDistance(item: ArtworkPoint, line: CoinToss) {
  const dx = Math.cos(line.theta);
  const dy = Math.sin(line.theta);
  return (item.x - line.x) * dy - (item.y - line.y) * dx;
}

function interpolate(a: ArtworkPoint, b: ArtworkPoint, da: number, db: number) {
  const ratio = da / (da - db);
  return point(a.x + (b.x - a.x) * ratio, a.y + (b.y - a.y) * ratio);
}

function generateHatchesForPolygon(polygon: ArtworkPoint[], angle: number, spacing: number): ArtworkSegment[] {
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const vx = -Math.sin(angle);
  const vy = Math.cos(angle);
  const bounds = polygonBounds(polygon);
  const corners = [point(bounds.minX, bounds.minY), point(bounds.minX, bounds.maxY), point(bounds.maxX, bounds.minY), point(bounds.maxX, bounds.maxY)];
  const normalProjections = corners.map((corner) => corner.x * vx + corner.y * vy);
  const directionProjections = corners.map((corner) => corner.x * ux + corner.y * uy);
  const start = Math.floor((Math.min(...normalProjections) - spacing) / spacing) * spacing;
  const end = Math.ceil((Math.max(...normalProjections) + spacing) / spacing) * spacing;
  const directionMidpoint = (Math.min(...directionProjections) + Math.max(...directionProjections)) / 2;
  const halfLength = (Math.max(...directionProjections) - Math.min(...directionProjections)) / 2 + 2 * spacing + 10;
  const segments: ArtworkSegment[] = [];

  for (let offset = start; offset <= end + geometryEpsilon; offset += spacing) {
    const px = directionMidpoint * ux + offset * vx;
    const py = directionMidpoint * uy + offset * vy;
    const segment = clipSegmentToConvexPolygon(point(px - halfLength * ux, py - halfLength * uy), point(px + halfLength * ux, py + halfLength * uy), polygon);
    if (segment) segments.push(segment);
  }

  return segments;
}

function clipSegmentToConvexPolygon(a: ArtworkPoint, b: ArtworkPoint, polygon: ArtworkPoint[]): ArtworkSegment | null {
  const hits: ArtworkPoint[] = [];
  if (pointInConvexPolygon(a, polygon)) hits.push(a);
  if (pointInConvexPolygon(b, polygon)) hits.push(b);

  for (let index = 0; index < polygon.length; index += 1) {
    const edgeStart = polygon[index];
    const edgeEnd = polygon[(index + 1) % polygon.length];
    if (!edgeStart || !edgeEnd) continue;
    const hit = segmentIntersection(a, b, edgeStart, edgeEnd);
    if (hit) pushUnique(hits, hit);
  }

  if (hits.length < 2) return null;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const ordered = hits.sort((left, right) => (left.x - a.x) * dx + (left.y - a.y) * dy - ((right.x - a.x) * dx + (right.y - a.y) * dy));
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  if (!first || !last || distance(first, last) <= geometryEpsilon) return null;
  return { a: first, b: last };
}

function segmentIntersection(a: ArtworkPoint, b: ArtworkPoint, c: ArtworkPoint, d: ArtworkPoint) {
  const r = subtract(b, a);
  const s = subtract(d, c);
  const denominator = cross(r, s);
  if (Math.abs(denominator) < geometryEpsilon) return null;
  const qp = subtract(c, a);
  const t = cross(qp, s) / denominator;
  const u = cross(qp, r) / denominator;
  if (t < -geometryEpsilon || t > 1 + geometryEpsilon || u < -geometryEpsilon || u > 1 + geometryEpsilon) return null;
  return point(a.x + t * r.x, a.y + t * r.y);
}

function pointInConvexPolygon(item: ArtworkPoint, polygon: ArtworkPoint[]) {
  let sign = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const a = polygon[index];
    const b = polygon[(index + 1) % polygon.length];
    if (!a || !b) continue;
    const value = cross(subtract(b, a), subtract(item, a));
    if (Math.abs(value) <= geometryEpsilon) continue;
    const currentSign = Math.sign(value);
    if (sign && currentSign !== sign) return false;
    sign = currentSign;
  }
  return true;
}

function polygonBounds(polygon: ArtworkPoint[]) {
  return {
    minX: Math.min(...polygon.map((item) => item.x)),
    minY: Math.min(...polygon.map((item) => item.y)),
    maxX: Math.max(...polygon.map((item) => item.x)),
    maxY: Math.max(...polygon.map((item) => item.y)),
  };
}

function polygonArea(polygon: ArtworkPoint[]) {
  let area = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    if (current && next) area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area) / 2;
}

function centroid(polygon: ArtworkPoint[]) {
  const total = polygon.reduce((sum, item) => point(sum.x + item.x, sum.y + item.y), point(0, 0));
  return point(total.x / Math.max(1, polygon.length), total.y / Math.max(1, polygon.length));
}

function subtract(a: ArtworkPoint, b: ArtworkPoint) {
  return point(a.x - b.x, a.y - b.y);
}

function cross(a: ArtworkPoint, b: ArtworkPoint) {
  return a.x * b.y - a.y * b.x;
}

function distance(a: ArtworkPoint, b: ArtworkPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pushUnique(points: ArtworkPoint[], item: ArtworkPoint) {
  if (!points.some((existing) => distance(existing, item) <= geometryEpsilon)) points.push(item);
}

function regionSortKey(a: ArtworkPoint[], b: ArtworkPoint[]) {
  const ca = centroid(a);
  const cb = centroid(b);
  return ca.y - cb.y || ca.x - cb.x || polygonArea(a) - polygonArea(b);
}

function colorFromToss(toss: CoinToss) {
  const hue = toss.side === "tails" ? (toss.theta / Math.PI + 0.5) % 1 : toss.theta / Math.PI;
  const saturation = 0.48 + 0.32 * ((toss.x % 37) / 37);
  const baseLightness = 0.42 + 0.2 * ((toss.y % 53) / 53);
  const lightness = toss.side === "tails" ? 1 - baseLightness : baseLightness;
  return hslToHex(hue, saturation, lightness);
}

function hslToHex(hue: number, saturation: number, lightness: number) {
  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;
  const channels = [hue + 1 / 3, hue, hue - 1 / 3].map((channel) => {
    let value = channel;
    if (value < 0) value += 1;
    if (value > 1) value -= 1;
    if (value < 1 / 6) return p + (q - p) * 6 * value;
    if (value < 1 / 2) return q;
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
    return p;
  });
  return `#${channels.map((channel) => Math.round(channel * 255).toString(16).padStart(2, "0")).join("")}`;
}

export function buildDailyFractal({
  existing,
  date,
  asOfDate = date,
  blocks,
  subjects,
  tags,
  now,
}: {
  existing?: DailyFractal | null;
  date: string;
  asOfDate?: string;
  blocks: StudyBlock[];
  subjects: Subject[];
  tags: Tag[];
  now: string;
}): DailyFractal {
  const startDate = existing?.startDate ?? existing?.date ?? date;
  const createdAt = existing?.createdAt ?? now;
  const cycleBlocks = blocksForArtworkCycle(blocks, startDate, createdAt);
  const params = buildFractalParams({ date: startDate, blocks: cycleBlocks, subjects, tags });
  const { visibleSteps, completedAt } = existing?.status === "completed" && existing.endDate
    ? { visibleSteps: existing.visibleSteps ?? artworkStepCount, completedAt: existing.endDate }
    : calculateArtworkProgress({ startDate, asOfDate, blocks: cycleBlocks });
  const status = completedAt ? "completed" : "active";
  const endDate = completedAt;
  return {
    id: existing?.id ?? `fractal_${startDate}_${hashString(now).toString(16)}`,
    date: startDate,
    startDate,
    endDate,
    status,
    totalSteps: artworkStepCount,
    visibleSteps: status === "completed" ? artworkStepCount : visibleSteps,
    stats: buildArtworkStats(cycleBlocks, startDate, endDate ?? asOfDate),
    seed: params.seed,
    params,
    config: generateFractalConfig(params),
    createdAt,
    updatedAt: now,
  };
}
