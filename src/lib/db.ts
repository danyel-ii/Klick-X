import Dexie, { type Table } from "dexie";
import { buildStatsSummary } from "./analytics";
import { detectLocale } from "./i18n";
import { localDateKey } from "./date";
import { accumulateElapsed } from "./timer";
import type {
  AppSettings,
  CalendarDaySummary,
  DayAssignment,
  ExportPayload,
  Locale,
  StatsFilters,
  StatsSummary,
  StudyBlock,
  StudyDay,
  Subject,
  Tag,
} from "./types";

export const ONBOARDING_VERSION = 1;

const subjectColors = ["#2563eb", "#7c3aed", "#0891b2", "#16a34a", "#dc2626", "#d97706", "#0f766e", "#4f46e5"];
const tagColors = ["#be123c", "#9333ea", "#0d9488", "#2563eb", "#ca8a04"];
const seedSubjects = {
  en: ["Mathematics", "Physics", "Chemistry", "Biology", "Literature", "History", "Languages", "Computer Science"],
  de: ["Mathematik", "Physik", "Chemie", "Biologie", "Literatur", "Geschichte", "Sprachen", "Informatik"],
} satisfies Record<Locale, string[]>;
const seedTags = {
  en: ["Exam prep", "Homework", "Revision", "Deep focus", "Catch-up"],
  de: ["Prüfungsvorbereitung", "Hausaufgaben", "Wiederholung", "Fokuszeit", "Nachholen"],
} satisfies Record<Locale, string[]>;

class StudyBlocksDatabase extends Dexie {
  subjects!: Table<Subject, string>;
  tags!: Table<Tag, string>;
  studyDays!: Table<StudyDay, string>;
  studyBlocks!: Table<StudyBlock, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super("study-blocks");
    this.version(1).stores({
      subjects: "id, archivedAt, createdAt",
      tags: "id, archivedAt, createdAt",
      studyDays: "id, &date, createdAt",
      studyBlocks: "id, dayId, date, subjectId, status, *tagIds, startedAt",
      settings: "id",
    });
  }
}

export const db = new StudyBlocksDatabase();

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function defaultSettings(locale: Locale = detectLocale()): AppSettings {
  const now = nowIso();
  return {
    id: "app",
    blockMinutes: 30,
    theme: "system",
    locale,
    onboardingCompletedAt: null,
    onboardingVersion: ONBOARDING_VERSION,
    startOfWeek: "monday",
    screensaverEnabled: true,
    screensaverDelaySeconds: 180,
    notificationsEnabled: false,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getSettings() {
  const existing = await db.settings.get("app");
  if (existing) return existing;
  const settings = defaultSettings();
  await db.settings.put(settings);
  return settings;
}

export async function updateSettings(patch: Partial<Omit<AppSettings, "id" | "createdAt">>) {
  const current = await getSettings();
  await db.settings.put({ ...current, ...patch, updatedAt: nowIso() });
}

export async function setLocale(locale: Locale) {
  await updateSettings({ locale });
}

export async function completeOnboarding() {
  await updateSettings({ onboardingCompletedAt: nowIso(), onboardingVersion: ONBOARDING_VERSION });
}

export async function resetOnboarding() {
  await updateSettings({ onboardingCompletedAt: null, onboardingVersion: ONBOARDING_VERSION });
}

export async function seedDefaultSubjectsIfEmpty(locale: Locale) {
  const count = await db.subjects.filter((subject) => !subject.archivedAt).count();
  if (count > 0) return;
  const now = nowIso();
  await db.subjects.bulkAdd(
    seedSubjects[locale].map((name, index) => ({
      id: id("subject"),
      name,
      color: subjectColors[index % subjectColors.length],
      icon: "",
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    })),
  );
}

export async function seedDefaultTagsIfEmpty(locale: Locale) {
  const count = await db.tags.filter((tag) => !tag.archivedAt).count();
  if (count > 0) return;
  const now = nowIso();
  await db.tags.bulkAdd(
    seedTags[locale].map((name, index) => ({
      id: id("tag"),
      name,
      color: tagColors[index % tagColors.length],
      description: "",
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    })),
  );
}

export async function listSubjects() {
  return db.subjects.orderBy("createdAt").toArray();
}

export async function createSubject(input: { name: string; color: string; icon?: string }) {
  const now = nowIso();
  const subject: Subject = { id: id("subject"), archivedAt: null, createdAt: now, updatedAt: now, ...input };
  await db.subjects.add(subject);
  return subject;
}

export async function updateSubject(idValue: string, input: Partial<Pick<Subject, "name" | "color" | "icon">>) {
  await db.subjects.update(idValue, { ...input, updatedAt: nowIso() });
}

export async function archiveSubject(idValue: string) {
  await db.subjects.update(idValue, { archivedAt: nowIso(), updatedAt: nowIso() });
}

export async function listTags() {
  return db.tags.orderBy("createdAt").toArray();
}

export async function createTag(input: { name: string; color: string; description?: string }) {
  const now = nowIso();
  const tag: Tag = { id: id("tag"), archivedAt: null, createdAt: now, updatedAt: now, ...input };
  await db.tags.add(tag);
  return tag;
}

export async function updateTag(idValue: string, input: Partial<Pick<Tag, "name" | "color" | "description">>) {
  await db.tags.update(idValue, { ...input, updatedAt: nowIso() });
}

export async function archiveTag(idValue: string) {
  await db.tags.update(idValue, { archivedAt: nowIso(), updatedAt: nowIso() });
}

export async function getTodayDay() {
  return db.studyDays.where("date").equals(localDateKey()).first();
}

export async function listBlocksForDate(date: string) {
  return db.studyBlocks.where("date").equals(date).sortBy("index");
}

export async function createOrUpdateDayPlan(date: string, plannedBlockCount: number, assignments: DayAssignment[]) {
  if (assignments.length !== plannedBlockCount || assignments.some((assignment) => !assignment.subjectId)) {
    throw new Error("Every planned block needs a subject.");
  }
  const currentDay = await db.studyDays.where("date").equals(date).first();
  const now = nowIso();
  const day: StudyDay = currentDay
    ? { ...currentDay, plannedBlockCount, updatedAt: now }
    : { id: id("day"), date, plannedBlockCount, createdAt: now, updatedAt: now };

  await db.transaction("rw", db.studyDays, db.studyBlocks, async () => {
    await db.studyDays.put(day);
    const oldBlocks = await db.studyBlocks.where("date").equals(date).toArray();
    await db.studyBlocks.bulkDelete(oldBlocks.map((block) => block.id));
    await db.studyBlocks.bulkAdd(
      assignments.map((assignment, index) => ({
        id: id("block"),
        dayId: day.id,
        date,
        index,
        subjectId: assignment.subjectId,
        tagIds: assignment.tagIds,
        status: "planned" as const,
        plannedMinutes: 30,
        elapsedSeconds: 0,
        startedAt: null,
        completedAt: null,
        note: "",
        createdAt: now,
        updatedAt: now,
      })),
    );
  });
}

async function pauseActiveBlocks(exceptId?: string) {
  const activeBlocks = await db.studyBlocks.where("status").equals("active").toArray();
  const now = new Date();
  for (const block of activeBlocks) {
    if (block.id === exceptId) continue;
    await db.studyBlocks.put({
      ...block,
      status: "paused",
      elapsedSeconds: accumulateElapsed(block, now),
      startedAt: null,
      updatedAt: now.toISOString(),
    });
  }
}

export async function startBlock(blockId: string) {
  await db.transaction("rw", db.studyBlocks, async () => {
    await pauseActiveBlocks(blockId);
    const block = await db.studyBlocks.get(blockId);
    if (!block) return;
    await db.studyBlocks.put({ ...block, status: "active", startedAt: nowIso(), updatedAt: nowIso() });
  });
}

export async function pauseBlock(blockId: string) {
  const block = await db.studyBlocks.get(blockId);
  if (!block) return;
  const now = new Date();
  await db.studyBlocks.put({
    ...block,
    status: "paused",
    elapsedSeconds: accumulateElapsed(block, now),
    startedAt: null,
    updatedAt: now.toISOString(),
  });
}

export async function completeBlock(blockId: string) {
  const block = await db.studyBlocks.get(blockId);
  if (!block) return;
  const now = new Date();
  await db.studyBlocks.put({
    ...block,
    status: "completed",
    elapsedSeconds: accumulateElapsed(block, now),
    startedAt: null,
    completedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
}

export async function skipBlock(blockId: string) {
  const block = await db.studyBlocks.get(blockId);
  if (!block) return;
  const now = new Date();
  await db.studyBlocks.put({
    ...block,
    status: "skipped",
    elapsedSeconds: accumulateElapsed(block, now),
    startedAt: null,
    updatedAt: now.toISOString(),
  });
}

export async function updateBlockSubject(blockId: string, subjectId: string) {
  await db.studyBlocks.update(blockId, { subjectId, updatedAt: nowIso() });
}

export async function updateBlockTags(blockId: string, tagIds: string[]) {
  await db.studyBlocks.update(blockId, { tagIds, updatedAt: nowIso() });
}

export async function updateBlockNote(blockId: string, note: string) {
  await db.studyBlocks.update(blockId, { note, updatedAt: nowIso() });
}

export async function getCalendarSummary(): Promise<CalendarDaySummary[]> {
  const days = await db.studyDays.toArray();
  const blocks = await db.studyBlocks.toArray();
  return days
    .map((day) => {
      const dayBlocks = blocks.filter((block) => block.date === day.date);
      return {
        date: day.date,
        plannedBlocks: day.plannedBlockCount,
        completedBlocks: dayBlocks.filter((block) => block.status === "completed").length,
        studiedSeconds: dayBlocks.reduce((sum, block) => sum + block.elapsedSeconds, 0),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getStats(filters: StatsFilters): Promise<StatsSummary> {
  const [days, blocks, subjects, tags] = await Promise.all([
    db.studyDays.toArray(),
    db.studyBlocks.toArray(),
    db.subjects.toArray(),
    db.tags.toArray(),
  ]);
  return buildStatsSummary({ days, blocks, subjects, tags, filters, todayKey: localDateKey() });
}

export async function exportLocalData(): Promise<ExportPayload> {
  const [subjects, tags, studyDays, studyBlocks, settings] = await Promise.all([
    db.subjects.toArray(),
    db.tags.toArray(),
    db.studyDays.toArray(),
    db.studyBlocks.toArray(),
    db.settings.get("app"),
  ]);
  return { version: 1, exportedAt: nowIso(), subjects, tags, studyDays, studyBlocks, settings: settings ?? null };
}

export async function importLocalData(payload: ExportPayload) {
  if (payload.version !== 1 || !Array.isArray(payload.subjects) || !Array.isArray(payload.studyBlocks)) {
    throw new Error("Invalid import payload.");
  }
  await db.transaction("rw", [db.subjects, db.tags, db.studyDays, db.studyBlocks, db.settings], async () => {
    await Promise.all([db.subjects.clear(), db.tags.clear(), db.studyDays.clear(), db.studyBlocks.clear(), db.settings.clear()]);
    await db.subjects.bulkPut(payload.subjects);
    await db.tags.bulkPut(payload.tags);
    await db.studyDays.bulkPut(payload.studyDays);
    await db.studyBlocks.bulkPut(payload.studyBlocks);
    if (payload.settings) await db.settings.put(payload.settings);
  });
}

export async function resetLocalData() {
  await db.transaction("rw", [db.subjects, db.tags, db.studyDays, db.studyBlocks, db.settings], async () => {
    await Promise.all([db.subjects.clear(), db.tags.clear(), db.studyDays.clear(), db.studyBlocks.clear(), db.settings.clear()]);
  });
}
