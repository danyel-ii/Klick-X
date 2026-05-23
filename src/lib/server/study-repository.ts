import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { buildStatsSummary } from "@/lib/analytics";
import { defaultTagColorValues, resolveSubjectColor, resolveTagColor, subjectColorValues } from "@/lib/colors";
import { localDateKey } from "@/lib/date";
import { detectLocale } from "@/lib/i18n";
import { normalizeExportPayload } from "@/lib/import-validation";
import { accumulateElapsed } from "@/lib/timer";
import type {
  AppSettings,
  AppSnapshot,
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
} from "@/lib/types";

export const ONBOARDING_VERSION = 1;

const seedSubjects = {
  en: ["Mathematics", "Physics", "Chemistry", "Biology", "Literature", "History", "Languages", "Computer Science"],
  de: ["Mathematik", "Physik", "Chemie", "Biologie", "Literatur", "Geschichte", "Sprachen", "Informatik"],
} satisfies Record<Locale, string[]>;
const seedTags = {
  en: ["Exam prep", "Homework", "Revision", "Deep focus", "Catch-up"],
  de: ["Prüfungsvorbereitung", "Hausaufgaben", "Wiederholung", "Fokuszeit", "Nachholen"],
} satisfies Record<Locale, string[]>;

let sqlClient: NeonQueryFunction<false, false> | null = null;
let schemaReady: Promise<void> | null = null;

function sql() {
  const connection = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!connection) {
    throw new Error("DATABASE_URL is not configured.");
  }
  sqlClient ??= neon(connection);
  return sqlClient;
}

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function json<T>(value: T) {
  return JSON.stringify(value);
}

function dataOf<T>(row: { data: T | string }) {
  return typeof row.data === "string" ? (JSON.parse(row.data) as T) : (row.data as T);
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

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = sql();
      await db`
        CREATE TABLE IF NOT EXISTS app_settings (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await db`
        CREATE TABLE IF NOT EXISTS subjects (
          id TEXT PRIMARY KEY,
          archived_at TEXT,
          created_at TEXT NOT NULL,
          data JSONB NOT NULL
        )
      `;
      await db`
        CREATE TABLE IF NOT EXISTS tags (
          id TEXT PRIMARY KEY,
          archived_at TEXT,
          created_at TEXT NOT NULL,
          data JSONB NOT NULL
        )
      `;
      await db`
        CREATE TABLE IF NOT EXISTS study_days (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL UNIQUE,
          created_at TEXT NOT NULL,
          data JSONB NOT NULL
        )
      `;
      await db`
        CREATE TABLE IF NOT EXISTS study_blocks (
          id TEXT PRIMARY KEY,
          day_id TEXT NOT NULL,
          date TEXT NOT NULL,
          subject_id TEXT NOT NULL,
          status TEXT NOT NULL,
          tag_ids JSONB NOT NULL,
          started_at TEXT,
          created_at TEXT NOT NULL,
          data JSONB NOT NULL
        )
      `;
      await db`CREATE INDEX IF NOT EXISTS subjects_archived_at_idx ON subjects (archived_at)`;
      await db`CREATE INDEX IF NOT EXISTS tags_archived_at_idx ON tags (archived_at)`;
      await db`CREATE INDEX IF NOT EXISTS study_blocks_date_idx ON study_blocks (date)`;
      await db`CREATE INDEX IF NOT EXISTS study_blocks_subject_id_idx ON study_blocks (subject_id)`;
      await db`CREATE INDEX IF NOT EXISTS study_blocks_status_idx ON study_blocks (status)`;
    })();
  }
  return schemaReady;
}

async function readySql() {
  await ensureSchema();
  return sql();
}

async function putSubject(subject: Subject) {
  const db = await readySql();
  await db`
    INSERT INTO subjects (id, archived_at, created_at, data)
    VALUES (${subject.id}, ${subject.archivedAt ?? null}, ${subject.createdAt}, ${json(subject)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET
      archived_at = EXCLUDED.archived_at,
      created_at = EXCLUDED.created_at,
      data = EXCLUDED.data
  `;
}

async function putTag(tag: Tag) {
  const db = await readySql();
  await db`
    INSERT INTO tags (id, archived_at, created_at, data)
    VALUES (${tag.id}, ${tag.archivedAt ?? null}, ${tag.createdAt}, ${json(tag)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET
      archived_at = EXCLUDED.archived_at,
      created_at = EXCLUDED.created_at,
      data = EXCLUDED.data
  `;
}

async function putDay(day: StudyDay) {
  const db = await readySql();
  await db`
    INSERT INTO study_days (id, date, created_at, data)
    VALUES (${day.id}, ${day.date}, ${day.createdAt}, ${json(day)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET
      date = EXCLUDED.date,
      created_at = EXCLUDED.created_at,
      data = EXCLUDED.data
  `;
}

async function putBlock(block: StudyBlock) {
  const db = await readySql();
  await db`
    INSERT INTO study_blocks (id, day_id, date, subject_id, status, tag_ids, started_at, created_at, data)
    VALUES (${block.id}, ${block.dayId}, ${block.date}, ${block.subjectId}, ${block.status}, ${json(block.tagIds)}::jsonb, ${block.startedAt ?? null}, ${block.createdAt}, ${json(block)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET
      day_id = EXCLUDED.day_id,
      date = EXCLUDED.date,
      subject_id = EXCLUDED.subject_id,
      status = EXCLUDED.status,
      tag_ids = EXCLUDED.tag_ids,
      started_at = EXCLUDED.started_at,
      created_at = EXCLUDED.created_at,
      data = EXCLUDED.data
  `;
}

export async function getSettings() {
  const db = await readySql();
  const rows = await db`SELECT data FROM app_settings WHERE id = 'app' LIMIT 1`;
  if (rows[0]) return dataOf<AppSettings>(rows[0] as { data: AppSettings | string });
  const settings = defaultSettings("en");
  await db`INSERT INTO app_settings (id, data) VALUES ('app', ${json(settings)}::jsonb)`;
  return settings;
}

export async function updateSettings(patch: Partial<Omit<AppSettings, "id" | "createdAt">>) {
  const db = await readySql();
  const current = await getSettings();
  const next = { ...current, ...patch, updatedAt: nowIso() };
  await db`
    INSERT INTO app_settings (id, data, updated_at)
    VALUES ('app', ${json(next)}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
  `;
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

export async function listSubjects() {
  const db = await readySql();
  const rows = await db`SELECT data FROM subjects ORDER BY created_at`;
  return rows.map((row) => dataOf<Subject>(row as { data: Subject | string }));
}

export async function seedDefaultSubjectsIfEmpty(locale: Locale) {
  const db = await readySql();
  const rows = await db`SELECT COUNT(*)::int AS count FROM subjects WHERE archived_at IS NULL`;
  if (Number(rows[0]?.count ?? 0) > 0) return;
  const now = nowIso();
  for (const subject of seedSubjects[locale].map((name, index) => ({
    id: id("subject"),
    name,
    color: subjectColorValues[index % subjectColorValues.length],
    icon: "",
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  }))) {
    await putSubject(subject);
  }
}

export async function createSubject(input: { name: string; color: string; icon?: string }) {
  const now = nowIso();
  const subject: Subject = { id: id("subject"), archivedAt: null, createdAt: now, updatedAt: now, ...input, color: resolveSubjectColor(input.color) };
  await putSubject(subject);
  return subject;
}

export async function updateSubject(idValue: string, input: Partial<Pick<Subject, "name" | "color" | "icon">>) {
  const subject = (await listSubjects()).find((item) => item.id === idValue);
  if (!subject) return;
  const patch = input.color ? { ...input, color: resolveSubjectColor(input.color) } : input;
  await putSubject({ ...subject, ...patch, updatedAt: nowIso() });
}

export async function archiveSubject(idValue: string) {
  const subject = (await listSubjects()).find((item) => item.id === idValue);
  if (!subject) return;
  const now = nowIso();
  await putSubject({ ...subject, archivedAt: now, updatedAt: now });
}

export async function restoreSubject(idValue: string) {
  const subject = (await listSubjects()).find((item) => item.id === idValue);
  if (!subject) return;
  await putSubject({ ...subject, archivedAt: null, updatedAt: nowIso() });
}

export async function deleteSubject(idValue: string, force = false) {
  const db = await readySql();
  const rows = await db`SELECT COUNT(*)::int AS count FROM study_blocks WHERE subject_id = ${idValue}`;
  if (Number(rows[0]?.count ?? 0) > 0 && !force) {
    await archiveSubject(idValue);
    return "archived" as const;
  }
  await db`DELETE FROM subjects WHERE id = ${idValue}`;
  return "deleted" as const;
}

export async function listTags() {
  const db = await readySql();
  const rows = await db`SELECT data FROM tags ORDER BY created_at`;
  return rows.map((row) => dataOf<Tag>(row as { data: Tag | string }));
}

export async function seedDefaultTagsIfEmpty(locale: Locale) {
  const db = await readySql();
  const rows = await db`SELECT COUNT(*)::int AS count FROM tags WHERE archived_at IS NULL`;
  if (Number(rows[0]?.count ?? 0) > 0) return;
  const now = nowIso();
  for (const tag of seedTags[locale].map((name, index) => ({
    id: id("tag"),
    name,
    color: defaultTagColorValues[index % defaultTagColorValues.length],
    description: "",
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  }))) {
    await putTag(tag);
  }
}

export async function createTag(input: { name: string; color: string; description?: string }) {
  const now = nowIso();
  const tag: Tag = { id: id("tag"), archivedAt: null, createdAt: now, updatedAt: now, ...input, color: resolveTagColor(input.color) };
  await putTag(tag);
  return tag;
}

export async function updateTag(idValue: string, input: Partial<Pick<Tag, "name" | "color" | "description">>) {
  const tag = (await listTags()).find((item) => item.id === idValue);
  if (!tag) return;
  const patch = input.color ? { ...input, color: resolveTagColor(input.color) } : input;
  await putTag({ ...tag, ...patch, updatedAt: nowIso() });
}

export async function archiveTag(idValue: string) {
  const tag = (await listTags()).find((item) => item.id === idValue);
  if (!tag) return;
  const now = nowIso();
  await putTag({ ...tag, archivedAt: now, updatedAt: now });
}

export async function restoreTag(idValue: string) {
  const tag = (await listTags()).find((item) => item.id === idValue);
  if (!tag) return;
  await putTag({ ...tag, archivedAt: null, updatedAt: nowIso() });
}

export async function deleteTag(idValue: string, force = false) {
  const db = await readySql();
  const rows = await db`SELECT COUNT(*)::int AS count FROM study_blocks WHERE tag_ids ? ${idValue}`;
  if (Number(rows[0]?.count ?? 0) > 0 && !force) {
    await archiveTag(idValue);
    return "archived" as const;
  }
  await db`DELETE FROM tags WHERE id = ${idValue}`;
  return "deleted" as const;
}

export async function listBlocksForDate(date: string) {
  const db = await readySql();
  const rows = await db`SELECT data FROM study_blocks WHERE date = ${date} ORDER BY (data->>'index')::int`;
  return rows.map((row) => dataOf<StudyBlock>(row as { data: StudyBlock | string }));
}

export async function getTodayDay() {
  const db = await readySql();
  const rows = await db`SELECT data FROM study_days WHERE date = ${localDateKey()} LIMIT 1`;
  return rows[0] ? dataOf<StudyDay>(rows[0] as { data: StudyDay | string }) : null;
}

export async function createOrUpdateDayPlan(date: string, plannedBlockCount: number, assignments: DayAssignment[]) {
  if (assignments.length !== plannedBlockCount || assignments.some((assignment) => !assignment.subjectId)) {
    throw new Error("Every planned block needs a subject.");
  }
  const db = await readySql();
  const currentRows = await db`SELECT data FROM study_days WHERE date = ${date} LIMIT 1`;
  const currentDay = currentRows[0] ? dataOf<StudyDay>(currentRows[0] as { data: StudyDay | string }) : null;
  const now = nowIso();
  const day: StudyDay = currentDay
    ? { ...currentDay, plannedBlockCount, updatedAt: now }
    : { id: id("day"), date, plannedBlockCount, createdAt: now, updatedAt: now };
  await putDay(day);
  await db`DELETE FROM study_blocks WHERE date = ${date}`;
  for (const [index, assignment] of assignments.entries()) {
    await putBlock({
      id: id("block"),
      dayId: day.id,
      date,
      index,
      subjectId: assignment.subjectId,
      tagIds: assignment.tagIds,
      status: "planned",
      plannedMinutes: 30,
      elapsedSeconds: 0,
      startedAt: null,
      completedAt: null,
      note: "",
      createdAt: now,
      updatedAt: now,
    });
  }
}

export async function addBlockToDay(date: string, input: DayAssignment) {
  if (!input.subjectId) throw new Error("Subject is required.");
  const db = await readySql();
  const dayRows = await db`SELECT data FROM study_days WHERE date = ${date} LIMIT 1`;
  const day = dayRows[0] ? dataOf<StudyDay>(dayRows[0] as { data: StudyDay | string }) : null;
  if (!day) throw new Error("Study day not found.");
  const dayBlocks = await listBlocksForDate(date);
  const now = nowIso();
  await putDay({ ...day, plannedBlockCount: dayBlocks.length + 1, updatedAt: now });
  await putBlock({
    id: id("block"),
    dayId: day.id,
    date,
    index: dayBlocks.length,
    subjectId: input.subjectId,
    tagIds: input.tagIds,
    status: "planned",
    plannedMinutes: 30,
    elapsedSeconds: 0,
    startedAt: null,
    completedAt: null,
    note: "",
    createdAt: now,
    updatedAt: now,
  });
}

export async function deleteBlock(blockId: string) {
  const db = await readySql();
  const block = await getBlock(blockId);
  if (!block) return;
  if (block.status === "active") throw new Error("Active blocks cannot be deleted.");
  const dayRows = await db`SELECT data FROM study_days WHERE id = ${block.dayId} LIMIT 1`;
  const day = dayRows[0] ? dataOf<StudyDay>(dayRows[0] as { data: StudyDay | string }) : null;
  await db`DELETE FROM study_blocks WHERE id = ${blockId}`;
  const remainingBlocks = await listBlocksForDate(block.date);
  const now = nowIso();
  for (const [index, item] of remainingBlocks.entries()) {
    if (item.index !== index) await putBlock({ ...item, index, updatedAt: now });
  }
  if (day) await putDay({ ...day, plannedBlockCount: remainingBlocks.length, updatedAt: now });
}

async function listAllBlocks() {
  const db = await readySql();
  const rows = await db`SELECT data FROM study_blocks ORDER BY date, (data->>'index')::int`;
  return rows.map((row) => dataOf<StudyBlock>(row as { data: StudyBlock | string }));
}

async function listAllDays() {
  const db = await readySql();
  const rows = await db`SELECT data FROM study_days ORDER BY date`;
  return rows.map((row) => dataOf<StudyDay>(row as { data: StudyDay | string }));
}

async function getBlock(blockId: string) {
  const db = await readySql();
  const rows = await db`SELECT data FROM study_blocks WHERE id = ${blockId} LIMIT 1`;
  return rows[0] ? dataOf<StudyBlock>(rows[0] as { data: StudyBlock | string }) : null;
}

async function pauseActiveBlocks(exceptId?: string) {
  const db = await readySql();
  const rows = await db`SELECT data FROM study_blocks WHERE status = 'active'`;
  const now = new Date();
  for (const row of rows) {
    const block = dataOf<StudyBlock>(row as { data: StudyBlock | string });
    if (block.id === exceptId) continue;
    await putBlock({
      ...block,
      status: "paused",
      elapsedSeconds: accumulateElapsed(block, now),
      startedAt: null,
      updatedAt: now.toISOString(),
    });
  }
}

export async function startBlock(blockId: string) {
  await pauseActiveBlocks(blockId);
  const block = await getBlock(blockId);
  if (!block) return;
  await putBlock({ ...block, status: "active", startedAt: nowIso(), updatedAt: nowIso() });
}

export async function pauseBlock(blockId: string) {
  const block = await getBlock(blockId);
  if (!block) return;
  const now = new Date();
  await putBlock({ ...block, status: "paused", elapsedSeconds: accumulateElapsed(block, now), startedAt: null, updatedAt: now.toISOString() });
}

export async function completeBlock(blockId: string) {
  const block = await getBlock(blockId);
  if (!block) return;
  const now = new Date();
  await putBlock({
    ...block,
    status: "completed",
    elapsedSeconds: accumulateElapsed(block, now),
    startedAt: null,
    completedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
}

export async function skipBlock(blockId: string) {
  const block = await getBlock(blockId);
  if (!block) return;
  const now = new Date();
  await putBlock({ ...block, status: "skipped", elapsedSeconds: accumulateElapsed(block, now), startedAt: null, updatedAt: now.toISOString() });
}

export async function updateBlockSubject(blockId: string, subjectId: string) {
  const block = await getBlock(blockId);
  if (!block) return;
  await putBlock({ ...block, subjectId, updatedAt: nowIso() });
}

export async function updateBlockTags(blockId: string, tagIds: string[]) {
  const block = await getBlock(blockId);
  if (!block) return;
  await putBlock({ ...block, tagIds, updatedAt: nowIso() });
}

export async function updateBlockNote(blockId: string, note: string) {
  const block = await getBlock(blockId);
  if (!block) return;
  await putBlock({ ...block, note, updatedAt: nowIso() });
}

export async function getCalendarSummary(): Promise<CalendarDaySummary[]> {
  const days = await listAllDays();
  const blocks = await listAllBlocks();
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
  const [days, blocks, subjects, tags] = await Promise.all([listAllDays(), listAllBlocks(), listSubjects(), listTags()]);
  return buildStatsSummary({ days, blocks, subjects, tags, filters, todayKey: localDateKey() });
}

export async function exportLocalData(): Promise<ExportPayload> {
  const [subjects, tags, studyDays, studyBlocks, settings] = await Promise.all([listSubjects(), listTags(), listAllDays(), listAllBlocks(), getSettings()]);
  return { version: 1, exportedAt: nowIso(), subjects, tags, studyDays, studyBlocks, settings };
}

export async function importLocalData(payload: ExportPayload) {
  const next = normalizeExportPayload(payload);
  const db = await readySql();
  await db`DELETE FROM study_blocks`;
  await db`DELETE FROM study_days`;
  await db`DELETE FROM subjects`;
  await db`DELETE FROM tags`;
  await db`DELETE FROM app_settings`;
  for (const subject of next.subjects) await putSubject(subject);
  for (const tag of next.tags) await putTag(tag);
  for (const day of next.studyDays) await putDay(day);
  for (const block of next.studyBlocks) await putBlock(block);
  if (next.settings) await updateSettings(next.settings);
}

export async function resetLocalData() {
  const db = await readySql();
  await db`DELETE FROM study_blocks`;
  await db`DELETE FROM study_days`;
  await db`DELETE FROM subjects`;
  await db`DELETE FROM tags`;
  await db`DELETE FROM app_settings`;
}

export async function getSnapshot(): Promise<AppSnapshot> {
  const settings = await getSettings();
  await seedDefaultSubjectsIfEmpty(settings.locale);
  await seedDefaultTagsIfEmpty(settings.locale);
  const [subjects, tags, today, calendarSummary, allDays, allBlocks] = await Promise.all([
    listSubjects(),
    listTags(),
    getTodayDay(),
    getCalendarSummary(),
    listAllDays(),
    listAllBlocks(),
  ]);
  const todayBlocks = today ? allBlocks.filter((block) => block.date === today.date).sort((a, b) => a.index - b.index) : [];
  return { settings, subjects, tags, today, todayBlocks, calendarSummary, allDays, allBlocks };
}
