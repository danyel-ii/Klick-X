import { resolveSubjectColor, resolveTagColor } from "./colors";
import { isDaisyTheme } from "./themes";
import type { AppSettings, ExportPayload, FractalBranchConfig, FractalConfig, FractalParams, Locale, StartOfWeek, StudyBlockStatus } from "./types";

const maxImportRecords = 5000;
const maxNameLength = 120;
const maxDescriptionLength = 600;
const maxNoteLength = 10000;
const maxIdLength = 160;
const maxColorLength = 180;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const blockStatuses = new Set<StudyBlockStatus>(["planned", "active", "paused", "completed", "skipped"]);
const locales = new Set<Locale>(["en", "de"]);
const startOfWeeks = new Set<StartOfWeek>(["monday", "sunday"]);

function fail(field: string): never {
  throw new Error(`Invalid import payload: ${field}.`);
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(field);
  return value as Record<string, unknown>;
}

function array(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) fail(field);
  return value;
}

function stringValue(value: unknown, field: string, maxLength: number, allowEmpty = false) {
  if (typeof value !== "string") fail(field);
  const next = value.trim();
  if (!allowEmpty && !next) fail(field);
  if (next.length > maxLength) fail(field);
  return next;
}

function optionalString(value: unknown, field: string, maxLength: number) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return stringValue(value, field, maxLength, true);
}

function optionalStringArray(value: unknown, field: string, maxLength: number) {
  if (value === undefined) return [];
  return array(value, field).map((item) => stringValue(item, field, maxLength, true)).slice(0, 24);
}

function nullableString(value: unknown, field: string, maxLength: number) {
  if (value === undefined || value === null) return null;
  return stringValue(value, field, maxLength, true);
}

function integerValue(value: unknown, field: string, min: number, max: number) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) fail(field);
  return value;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function dateValue(value: unknown, field: string) {
  const next = stringValue(value, field, 10);
  if (!datePattern.test(next)) fail(field);
  return next;
}

function timestampValue(value: unknown, field: string) {
  return stringValue(value, field, 80);
}

function numberValue(value: unknown, field: string, min: number, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) fail(field);
  return value;
}

function normalizeSubjectColor(value: unknown) {
  return resolveSubjectColor(stringValue(value, "subject.color", 120));
}

function normalizeLocale(value: unknown) {
  return typeof value === "string" && locales.has(value as Locale) ? (value as Locale) : "en";
}

function normalizeStartOfWeek(value: unknown) {
  return typeof value === "string" && startOfWeeks.has(value as StartOfWeek) ? (value as StartOfWeek) : "monday";
}

function normalizeTheme(value: unknown): AppSettings["theme"] {
  if (value === "system") return "system";
  if (typeof value === "string" && isDaisyTheme(value)) return value;
  return "system";
}

function normalizeSubject(value: unknown) {
  const item = record(value, "subject");
  return {
    id: stringValue(item.id, "subject.id", maxIdLength),
    name: stringValue(item.name, "subject.name", maxNameLength),
    color: normalizeSubjectColor(item.color),
    icon: optionalString(item.icon, "subject.icon", 80) ?? "",
    archivedAt: nullableString(item.archivedAt, "subject.archivedAt", 80),
    createdAt: timestampValue(item.createdAt, "subject.createdAt"),
    updatedAt: timestampValue(item.updatedAt, "subject.updatedAt"),
  };
}

function normalizeTag(value: unknown) {
  const item = record(value, "tag");
  return {
    id: stringValue(item.id, "tag.id", maxIdLength),
    name: stringValue(item.name, "tag.name", maxNameLength),
    color: resolveTagColor(optionalString(item.color, "tag.color", 120)),
    description: optionalString(item.description, "tag.description", maxDescriptionLength) ?? "",
    archivedAt: nullableString(item.archivedAt, "tag.archivedAt", 80),
    createdAt: timestampValue(item.createdAt, "tag.createdAt"),
    updatedAt: timestampValue(item.updatedAt, "tag.updatedAt"),
  };
}

function normalizeDay(value: unknown) {
  const item = record(value, "studyDay");
  return {
    id: stringValue(item.id, "studyDay.id", maxIdLength),
    date: dateValue(item.date, "studyDay.date"),
    plannedBlockCount: integerValue(item.plannedBlockCount, "studyDay.plannedBlockCount", 0, 96),
    createdAt: timestampValue(item.createdAt, "studyDay.createdAt"),
    updatedAt: timestampValue(item.updatedAt, "studyDay.updatedAt"),
  };
}

function normalizeBlockStatus(value: unknown) {
  if (typeof value === "string" && blockStatuses.has(value as StudyBlockStatus)) return value as StudyBlockStatus;
  fail("studyBlock.status");
}

function normalizeTagIds(value: unknown) {
  const ids = array(value, "studyBlock.tagIds").map((tagId) => stringValue(tagId, "studyBlock.tagId", maxIdLength));
  if (ids.length > 50) fail("studyBlock.tagIds");
  return [...new Set(ids)];
}

function normalizeBlock(value: unknown) {
  const item = record(value, "studyBlock");
  return {
    id: stringValue(item.id, "studyBlock.id", maxIdLength),
    dayId: stringValue(item.dayId, "studyBlock.dayId", maxIdLength),
    date: dateValue(item.date, "studyBlock.date"),
    index: integerValue(item.index, "studyBlock.index", 0, 95),
    subjectId: stringValue(item.subjectId, "studyBlock.subjectId", maxIdLength),
    tagIds: normalizeTagIds(item.tagIds),
    status: normalizeBlockStatus(item.status),
    plannedMinutes: integerValue(item.plannedMinutes, "studyBlock.plannedMinutes", 1, 240),
    elapsedSeconds: integerValue(item.elapsedSeconds, "studyBlock.elapsedSeconds", 0, 60 * 60 * 24 * 365 * 5),
    startedAt: nullableString(item.startedAt, "studyBlock.startedAt", 80),
    completedAt: nullableString(item.completedAt, "studyBlock.completedAt", 80),
    note: optionalString(item.note, "studyBlock.note", maxNoteLength) ?? "",
    createdAt: timestampValue(item.createdAt, "studyBlock.createdAt"),
    updatedAt: timestampValue(item.updatedAt, "studyBlock.updatedAt"),
  };
}

function normalizeSettings(value: unknown): AppSettings | null {
  if (value === null) return null;
  const item = record(value, "settings");
  return {
    id: "app",
    blockMinutes: integerValue(item.blockMinutes, "settings.blockMinutes", 1, 240),
    theme: normalizeTheme(item.theme),
    locale: normalizeLocale(item.locale),
    onboardingCompletedAt: nullableString(item.onboardingCompletedAt, "settings.onboardingCompletedAt", 80),
    onboardingVersion: integerValue(item.onboardingVersion, "settings.onboardingVersion", 0, 100),
    startOfWeek: normalizeStartOfWeek(item.startOfWeek),
    screensaverEnabled: booleanValue(item.screensaverEnabled, true),
    screensaverDelaySeconds: integerValue(item.screensaverDelaySeconds, "settings.screensaverDelaySeconds", 30, 3600),
    notificationsEnabled: booleanValue(item.notificationsEnabled, false),
    createdAt: timestampValue(item.createdAt, "settings.createdAt"),
    updatedAt: timestampValue(item.updatedAt, "settings.updatedAt"),
  };
}

function normalizeRecordNumberMap(value: unknown, field: string) {
  if (value === undefined) return {};
  const item = record(value, field);
  return Object.fromEntries(
    Object.entries(item).map(([key, count]) => [
      stringValue(key, `${field}.key`, maxIdLength),
      integerValue(count, `${field}.${key}`, 0, 10000),
    ]),
  );
}

function normalizeFractalParams(value: unknown): FractalParams {
  const item = record(value, "dailyFractal.params");
  return {
    date: dateValue(item.date, "dailyFractal.params.date"),
    dailyPomodoroCount: integerValue(item.dailyPomodoroCount, "dailyFractal.params.dailyPomodoroCount", 0, 10000),
    consecutivePomodoroStreak: integerValue(item.consecutivePomodoroStreak, "dailyFractal.params.consecutivePomodoroStreak", 0, 10000),
    overallStudyStreakDays: integerValue(item.overallStudyStreakDays, "dailyFractal.params.overallStudyStreakDays", 0, 10000),
    longestStudyStreakDays: integerValue(item.longestStudyStreakDays, "dailyFractal.params.longestStudyStreakDays", 0, 10000),
    subjectStreaks: normalizeRecordNumberMap(item.subjectStreaks, "dailyFractal.params.subjectStreaks"),
    tagStreaks: normalizeRecordNumberMap(item.tagStreaks, "dailyFractal.params.tagStreaks"),
    totalMinutesToday: integerValue(item.totalMinutesToday, "dailyFractal.params.totalMinutesToday", 0, 60 * 24 * 365),
    completedBlocksToday: integerValue(item.completedBlocksToday, "dailyFractal.params.completedBlocksToday", 0, 10000),
    daysSinceLastUse: integerValue(item.daysSinceLastUse, "dailyFractal.params.daysSinceLastUse", 0, 10000),
    dominantSubjectId: optionalString(item.dominantSubjectId, "dailyFractal.params.dominantSubjectId", maxIdLength) ?? undefined,
    dominantSubjectColor: stringValue(item.dominantSubjectColor, "dailyFractal.params.dominantSubjectColor", maxColorLength, true),
    dominantTagIds: optionalStringArray(item.dominantTagIds, "dailyFractal.params.dominantTagIds", maxIdLength),
    dominantTagColors: optionalStringArray(item.dominantTagColors, "dailyFractal.params.dominantTagColors", maxColorLength),
    seed: stringValue(item.seed, "dailyFractal.params.seed", 500),
  };
}

function normalizeFractalBranch(value: unknown): FractalBranchConfig {
  const item = record(value, "dailyFractal.config.branch");
  return {
    angle: numberValue(item.angle, "dailyFractal.config.branch.angle", -1000, 1000),
    length: numberValue(item.length, "dailyFractal.config.branch.length", 0, 100),
    width: numberValue(item.width, "dailyFractal.config.branch.width", 0, 100),
    color: stringValue(item.color, "dailyFractal.config.branch.color", maxColorLength, true),
  };
}

function normalizeFractalConfig(value: unknown): FractalConfig {
  const item = record(value, "dailyFractal.config");
  const branches = array(item.branches, "dailyFractal.config.branches").map(normalizeFractalBranch);
  if (branches.length > 64) fail("dailyFractal.config.branches");
  return {
    seed: stringValue(item.seed, "dailyFractal.config.seed", 500),
    background: optionalStringArray(item.background, "dailyFractal.config.background", maxColorLength),
    palette: optionalStringArray(item.palette, "dailyFractal.config.palette", maxColorLength),
    depth: integerValue(item.depth, "dailyFractal.config.depth", 1, 16),
    symmetry: integerValue(item.symmetry, "dailyFractal.config.symmetry", 1, 32),
    rotation: numberValue(item.rotation, "dailyFractal.config.rotation", -1000, 1000),
    curl: numberValue(item.curl, "dailyFractal.config.curl", -100, 100),
    spread: numberValue(item.spread, "dailyFractal.config.spread", -100, 100),
    branchScale: numberValue(item.branchScale, "dailyFractal.config.branchScale", 0, 10),
    lineWidth: numberValue(item.lineWidth, "dailyFractal.config.lineWidth", 0, 100),
    glow: numberValue(item.glow, "dailyFractal.config.glow", 0, 10),
    rings: integerValue(item.rings, "dailyFractal.config.rings", 0, 64),
    branches,
  };
}

function normalizeDailyFractal(value: unknown) {
  const item = record(value, "dailyFractal");
  return {
    id: stringValue(item.id, "dailyFractal.id", maxIdLength),
    date: dateValue(item.date, "dailyFractal.date"),
    seed: stringValue(item.seed, "dailyFractal.seed", 500),
    params: normalizeFractalParams(item.params),
    config: normalizeFractalConfig(item.config),
    createdAt: timestampValue(item.createdAt, "dailyFractal.createdAt"),
    updatedAt: timestampValue(item.updatedAt, "dailyFractal.updatedAt"),
  };
}

function assertUnique(values: string[], field: string) {
  if (new Set(values).size !== values.length) fail(field);
}

export function normalizeExportPayload(payload: unknown): ExportPayload {
  const root = record(payload, "payload");
  if (root.version !== 1) fail("version");

  const subjects = array(root.subjects, "subjects").map(normalizeSubject);
  const tags = array(root.tags, "tags").map(normalizeTag);
  const studyDays = array(root.studyDays, "studyDays").map(normalizeDay);
  const studyBlocks = array(root.studyBlocks, "studyBlocks").map(normalizeBlock);
  const dailyFractals = (Array.isArray(root.dailyFractals) ? root.dailyFractals : []).map(normalizeDailyFractal);
  const recordCount = subjects.length + tags.length + studyDays.length + studyBlocks.length + dailyFractals.length;
  if (recordCount > maxImportRecords) fail("too many records");

  assertUnique(subjects.map((subject) => subject.id), "subject.id");
  assertUnique(tags.map((tag) => tag.id), "tag.id");
  assertUnique(studyDays.map((day) => day.id), "studyDay.id");
  assertUnique(studyDays.map((day) => day.date), "studyDay.date");
  assertUnique(studyBlocks.map((block) => block.id), "studyBlock.id");
  assertUnique(dailyFractals.map((fractal) => fractal.id), "dailyFractal.id");
  assertUnique(dailyFractals.map((fractal) => fractal.date), "dailyFractal.date");

  return {
    version: 1,
    exportedAt: timestampValue(root.exportedAt, "exportedAt"),
    subjects,
    tags,
    studyDays,
    studyBlocks,
    dailyFractals,
    settings: normalizeSettings(root.settings),
  };
}
