import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { buildCalendarSummary, buildStatsSummary } from "@/lib/analytics";
import { defaultTagColorValues, resolveSubjectColor, resolveTagColor, subjectColorValues } from "@/lib/colors";
import { localDateKey } from "@/lib/date";
import { artworkCompletionAtOffset, buildDailyFractal, compactDailyFractal, nextArtworkCompletionOffset } from "@/lib/fractals";
import { hasSameDailyFractalContent, isDailyFractalCurrent } from "@/lib/fractal-persistence";
import { detectLocale } from "@/lib/i18n";
import { normalizeExportPayload } from "@/lib/import-validation";
import { accumulateElapsed } from "@/lib/timer";
import type {
  AppSettings,
  AppSnapshot,
  CalendarDaySummary,
  DailyFractal,
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
    timerBeepEnabled: true,
    createdAt: now,
    updatedAt: now,
  };
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = sql();
      const schemaState = await db`
        SELECT
          to_regclass('public.app_settings') IS NOT NULL AS has_settings,
          to_regclass('public.subjects') IS NOT NULL AS has_subjects,
          to_regclass('public.tags') IS NOT NULL AS has_tags,
          to_regclass('public.study_days') IS NOT NULL AS has_days,
          to_regclass('public.study_blocks') IS NOT NULL AS has_blocks,
          to_regclass('public.daily_fractals') IS NOT NULL AS has_fractals,
          to_regclass('public.study_blocks_single_active_idx') IS NOT NULL AS has_single_active_index,
          to_regclass('public.daily_fractals_single_active_idx') IS NOT NULL AS has_single_active_fractal_index,
          to_regclass('public.daily_fractals_completion_offset_idx') IS NOT NULL AS has_fractal_offset_index,
          EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid = to_regclass('public.daily_fractals') AND conname = 'daily_fractals_date_key'
          ) AS has_unique_fractal_date
      `;
      const current = schemaState[0];
      if (
        current?.has_settings === true &&
        current.has_subjects === true &&
        current.has_tags === true &&
        current.has_days === true &&
        current.has_blocks === true &&
        current.has_fractals === true &&
        current.has_single_active_index === true &&
        current.has_single_active_fractal_index === true &&
        current.has_fractal_offset_index === true &&
        current.has_unique_fractal_date === false
      ) return;
      await db.transaction((txn) => [
        txn`
          CREATE TABLE IF NOT EXISTS app_settings (
            id TEXT PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `,
        txn`
          CREATE TABLE IF NOT EXISTS subjects (
            id TEXT PRIMARY KEY,
            archived_at TEXT,
            created_at TEXT NOT NULL,
            data JSONB NOT NULL
          )
        `,
        txn`
          CREATE TABLE IF NOT EXISTS tags (
            id TEXT PRIMARY KEY,
            archived_at TEXT,
            created_at TEXT NOT NULL,
            data JSONB NOT NULL
          )
        `,
        txn`
          CREATE TABLE IF NOT EXISTS study_days (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL,
            data JSONB NOT NULL
          )
        `,
        txn`
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
        `,
        txn`
          CREATE TABLE IF NOT EXISTS daily_fractals (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            data JSONB NOT NULL
          )
        `,
        txn`ALTER TABLE daily_fractals DROP CONSTRAINT IF EXISTS daily_fractals_date_key`,
        txn`
          WITH ranked_active AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY COALESCE(data->>'updatedAt', created_at) DESC, id DESC) AS position
            FROM study_blocks
            WHERE status = 'active'
          )
          UPDATE study_blocks AS block
          SET
            status = 'paused',
            started_at = NULL,
            data = block.data || jsonb_build_object(
              'status', 'paused',
              'elapsedSeconds', COALESCE((block.data->>'elapsedSeconds')::double precision, 0)::int +
                CASE
                  WHEN block.started_at IS NULL THEN 0
                  ELSE GREATEST(0, EXTRACT(EPOCH FROM (NOW() - block.started_at::timestamptz))::int)
                END,
              'startedAt', NULL,
              'updatedAt', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
            )
          FROM ranked_active
          WHERE block.id = ranked_active.id AND ranked_active.position > 1
        `,
        txn`
          WITH ranked_active_artwork AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY updated_at DESC, id DESC) AS position
            FROM daily_fractals
            WHERE data->>'status' = 'active'
          )
          DELETE FROM daily_fractals AS fractal
          USING ranked_active_artwork
          WHERE fractal.id = ranked_active_artwork.id AND ranked_active_artwork.position > 1
        `,
        txn`CREATE INDEX IF NOT EXISTS subjects_archived_at_idx ON subjects (archived_at)`,
        txn`CREATE INDEX IF NOT EXISTS tags_archived_at_idx ON tags (archived_at)`,
        txn`CREATE INDEX IF NOT EXISTS study_blocks_date_idx ON study_blocks (date)`,
        txn`CREATE INDEX IF NOT EXISTS study_blocks_subject_id_idx ON study_blocks (subject_id)`,
        txn`CREATE INDEX IF NOT EXISTS study_blocks_status_idx ON study_blocks (status)`,
        txn`CREATE UNIQUE INDEX IF NOT EXISTS study_blocks_single_active_idx ON study_blocks (status) WHERE status = 'active'`,
        txn`CREATE INDEX IF NOT EXISTS daily_fractals_date_idx ON daily_fractals (date)`,
        txn`CREATE UNIQUE INDEX IF NOT EXISTS daily_fractals_single_active_idx ON daily_fractals ((data->>'status')) WHERE data->>'status' = 'active'`,
        txn`CREATE UNIQUE INDEX IF NOT EXISTS daily_fractals_completion_offset_idx ON daily_fractals (((data->>'completionOffset')::int)) WHERE data ? 'completionOffset'`,
      ]);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
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

async function putDailyFractalIfCurrent(fractal: DailyFractal, existing: DailyFractal | null) {
  const db = await readySql();
  const compactFractal = compactDailyFractal(fractal);
  const expectedData = existing ? json(compactDailyFractal(existing)) : null;
  const rows = existing
    ? await db`
        UPDATE daily_fractals
        SET
          date = ${compactFractal.date},
          created_at = ${compactFractal.createdAt},
          updated_at = ${compactFractal.updatedAt},
          data = ${json(compactFractal)}::jsonb
        WHERE id = ${existing.id}
          AND updated_at = ${existing.updatedAt}
          AND data = ${expectedData}::jsonb
        RETURNING data
      `
    : await db`
        INSERT INTO daily_fractals (id, date, created_at, updated_at, data)
        VALUES (${compactFractal.id}, ${compactFractal.date}, ${compactFractal.createdAt}, ${compactFractal.updatedAt}, ${json(compactFractal)}::jsonb)
        ON CONFLICT (id) DO NOTHING
        RETURNING data
      `;
  return rows[0] ? dataOf<DailyFractal>(rows[0] as { data: DailyFractal | string }) : null;
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

export async function seedDefaultSubjectsIfEmpty(locale: Locale, knownSubjects?: Subject[]) {
  if (knownSubjects?.some((subject) => !subject.archivedAt)) return [];
  if (!knownSubjects) {
    const db = await readySql();
    const rows = await db`SELECT COUNT(*)::int AS count FROM subjects WHERE archived_at IS NULL`;
    if (Number(rows[0]?.count ?? 0) > 0) return [];
  }
  const now = nowIso();
  const subjects = seedSubjects[locale].map((name, index) => ({
    id: id("subject"),
    name,
    color: subjectColorValues[index % subjectColorValues.length],
    icon: "",
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  }));
  const db = await readySql();
  await db`
    INSERT INTO subjects (id, archived_at, created_at, data)
    SELECT item->>'id', item->>'archivedAt', item->>'createdAt', item
    FROM jsonb_array_elements(${json(subjects)}::jsonb) AS item
  `;
  return subjects;
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

export async function seedDefaultTagsIfEmpty(locale: Locale, knownTags?: Tag[]) {
  if (knownTags?.some((tag) => !tag.archivedAt)) return [];
  if (!knownTags) {
    const db = await readySql();
    const rows = await db`SELECT COUNT(*)::int AS count FROM tags WHERE archived_at IS NULL`;
    if (Number(rows[0]?.count ?? 0) > 0) return [];
  }
  const now = nowIso();
  const tags = seedTags[locale].map((name, index) => ({
    id: id("tag"),
    name,
    color: defaultTagColorValues[index % defaultTagColorValues.length],
    description: "",
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  }));
  const db = await readySql();
  await db`
    INSERT INTO tags (id, archived_at, created_at, data)
    SELECT item->>'id', item->>'archivedAt', item->>'createdAt', item
    FROM jsonb_array_elements(${json(tags)}::jsonb) AS item
  `;
  return tags;
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
  const blocks: StudyBlock[] = assignments.map((assignment, index) => ({
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
  }));
  await db.transaction((txn) => [
    txn`
      INSERT INTO study_days (id, date, created_at, data)
      VALUES (${day.id}, ${day.date}, ${day.createdAt}, ${json(day)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET
        date = EXCLUDED.date,
        created_at = EXCLUDED.created_at,
        data = EXCLUDED.data
    `,
    txn`DELETE FROM study_blocks WHERE date = ${date}`,
    txn`
      INSERT INTO study_blocks (id, day_id, date, subject_id, status, tag_ids, started_at, created_at, data)
      SELECT
        item->>'id',
        item->>'dayId',
        item->>'date',
        item->>'subjectId',
        item->>'status',
        COALESCE(item->'tagIds', '[]'::jsonb),
        item->>'startedAt',
        item->>'createdAt',
        item
      FROM jsonb_array_elements(${json(blocks)}::jsonb) AS item
    `,
  ]);
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
  const deletedRows = await db`
    DELETE FROM study_blocks
    WHERE id = ${blockId}
      AND status NOT IN ('active', 'completed')
      AND COALESCE((data->>'elapsedSeconds')::double precision, 0) = 0
      AND NULLIF(data->>'completedAt', '') IS NULL
    RETURNING data
  `;
  if (!deletedRows[0]) {
    const current = await getBlock(blockId);
    if (current?.status === "active") throw new Error("Active blocks cannot be deleted.");
    if (current && (current.status === "completed" || current.elapsedSeconds > 0 || current.completedAt)) throw new Error("Studied blocks cannot be deleted.");
    return;
  }
  const block = dataOf<StudyBlock>(deletedRows[0] as { data: StudyBlock | string });
  const dayRows = await db`SELECT data FROM study_days WHERE id = ${block.dayId} LIMIT 1`;
  const day = dayRows[0] ? dataOf<StudyDay>(dayRows[0] as { data: StudyDay | string }) : null;
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

type BlockRuntimePatch = Pick<StudyBlock, "status" | "updatedAt"> & {
  startedAt: string | null;
  elapsedSeconds?: number;
  completedAt?: string | null;
};

async function updateBlockRuntime(blockId: string, patch: BlockRuntimePatch) {
  const db = await readySql();
  const patchJson = json(patch);
  const rows = await db`
    UPDATE study_blocks
    SET
      status = ${patch.status},
      started_at = ${patch.startedAt},
      data = data || ${patchJson}::jsonb
    WHERE id = ${blockId}
      AND (
        (${patch.status}::text = 'active' AND status IN ('planned', 'paused'))
        OR (${patch.status}::text = 'paused' AND status = 'active')
        OR (${patch.status}::text IN ('completed', 'skipped') AND status IN ('planned', 'active', 'paused'))
      )
    RETURNING data
  `;
  return rows[0] ? dataOf<StudyBlock>(rows[0] as { data: StudyBlock | string }) : null;
}

async function pauseActiveBlocks(exceptId?: string) {
  const db = await readySql();
  const rows = await db`SELECT data FROM study_blocks WHERE status = 'active'`;
  const now = new Date();
  const paused: StudyBlock[] = [];
  for (const row of rows) {
    const block = dataOf<StudyBlock>(row as { data: StudyBlock | string });
    if (block.id === exceptId) continue;
    const updated = await updateBlockRuntime(block.id, {
      status: "paused",
      elapsedSeconds: accumulateElapsed(block, now),
      startedAt: null,
      updatedAt: now.toISOString(),
    });
    if (updated) paused.push(updated);
  }
  return paused;
}

export async function startBlock(blockId: string) {
  const changedById = new Map<string, StudyBlock>();
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const block = await getBlock(blockId);
    if (!block) return [...changedById.values()];
    if (block.status === "completed" || block.status === "skipped" || block.status === "active") {
      changedById.set(block.id, block);
      return [...changedById.values()];
    }
    const paused = await pauseActiveBlocks(blockId);
    paused.forEach((block) => changedById.set(block.id, block));
    const now = nowIso();
    try {
      const updated = await updateBlockRuntime(block.id, { status: "active", startedAt: now, updatedAt: now });
      if (updated) changedById.set(updated.id, updated);
      else {
        const current = await getBlock(block.id);
        if (current) changedById.set(current.id, current);
      }
      return [...changedById.values()];
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
      if (code !== "23505" || attempt === 1) throw error;
    }
  }
  return [...changedById.values()];
}

export async function pauseBlock(blockId: string) {
  const block = await getBlock(blockId);
  if (!block) return [];
  if (block.status !== "active") return [block];
  const now = new Date();
  const updated = await updateBlockRuntime(block.id, { status: "paused", elapsedSeconds: accumulateElapsed(block, now), startedAt: null, updatedAt: now.toISOString() });
  if (updated) return [updated];
  const current = await getBlock(block.id);
  return current ? [current] : [];
}

export async function completeBlock(blockId: string) {
  const block = await getBlock(blockId);
  if (!block) return { blocks: [], dailyFractals: [] };
  if (block.status === "completed" || block.status === "skipped") return { blocks: [block], dailyFractals: [] };
  const now = new Date();
  const updated = await updateBlockRuntime(block.id, {
    status: "completed",
    elapsedSeconds: accumulateElapsed(block, now),
    startedAt: null,
    completedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
  if (!updated) {
    const current = await getBlock(block.id);
    return { blocks: current ? [current] : [], dailyFractals: [] };
  }
  const fractal = await upsertDailyFractal(block.date, now.toISOString());
  return { blocks: [updated], dailyFractals: fractal ? [fractal] : [] };
}

async function listDailyFractals() {
  const db = await readySql();
  const rows = await db`
    SELECT data #- '{config,artwork}' AS data, data #> '{config,artwork}' IS NOT NULL AS had_artwork
    FROM daily_fractals
    ORDER BY date
  `;
  if (rows.some((row) => row.had_artwork === true)) {
    await db`UPDATE daily_fractals SET data = data #- '{config,artwork}' WHERE data #> '{config,artwork}' IS NOT NULL`;
  }
  return rows.map((row) => dataOf<DailyFractal>(row as { data: DailyFractal | string }));
}

async function upsertDailyFractal(date: string, now: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const [fractals, blocks, subjects, tags] = await Promise.all([listDailyFractals(), listAllBlocks(), listSubjects(), listTags()]);
    const existing = fractals.filter((fractal) => fractal.status === "active").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
    const nextCompletionOffset = nextArtworkCompletionOffset(fractals, blocks);
    const next = buildDailyFractal({
      existing,
      date: existing?.startDate ?? date,
      asOfDate: date,
      blocks,
      subjects,
      tags,
      now,
      completionOffset: existing ? nextCompletionOffset : (nextCompletionOffset ?? 0),
    });
    if (existing && hasSameDailyFractalContent(existing, next)) return existing;
    try {
      const persisted = await putDailyFractalIfCurrent(next, existing);
      if (persisted) return compactDailyFractal(persisted);
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
      if (code !== "23505" || attempt === 2) throw error;
    }
  }
  throw new Error("Artwork progress could not be saved after concurrent updates.");
}

async function ensureDailyFractalProgress({
  asOfDate,
  fractals,
  blocks,
  days,
  subjects,
  tags,
}: {
  asOfDate: string;
  fractals: DailyFractal[];
  blocks: StudyBlock[];
  days: StudyDay[];
  subjects: Subject[];
  tags: Tag[];
}) {
  const existing = fractals.filter((fractal) => fractal.status === "active").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const completionOffset = nextArtworkCompletionOffset(fractals, blocks) ?? 0;
  if (!existing) {
    const firstUnconsumedCompletion = artworkCompletionAtOffset(blocks, completionOffset);
    if (!firstUnconsumedCompletion || firstUnconsumedCompletion.date > asOfDate) return fractals;
    const next = buildDailyFractal({
      date: firstUnconsumedCompletion.date,
      asOfDate,
      blocks,
      subjects,
      tags,
      now: nowIso(),
      completionOffset,
    });
    try {
      const persisted = await putDailyFractalIfCurrent(next, null);
      if (!persisted) return listDailyFractals();
      return [...fractals, compactDailyFractal(persisted)];
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
      if (code === "23505") return listDailyFractals();
      throw error;
    }
  }
  if (isDailyFractalCurrent(existing, asOfDate, [...blocks, ...days])) return fractals;
  const next = buildDailyFractal({
    existing,
    date: existing.startDate ?? existing.date,
    asOfDate,
    blocks,
    subjects,
    tags,
    now: nowIso(),
    completionOffset,
  });
  if (hasSameDailyFractalContent(existing, next)) return fractals;
  const persisted = await putDailyFractalIfCurrent(next, existing);
  if (!persisted) return listDailyFractals();
  const compactNext = compactDailyFractal(persisted);
  return fractals.map((fractal) => (fractal.id === compactNext.id ? compactNext : fractal));
}

export async function skipBlock(blockId: string) {
  const block = await getBlock(blockId);
  if (!block) return [];
  if (block.status === "completed" || block.status === "skipped") return [block];
  const now = new Date();
  const updated = await updateBlockRuntime(block.id, { status: "skipped", elapsedSeconds: accumulateElapsed(block, now), startedAt: null, updatedAt: now.toISOString() });
  if (updated) return [updated];
  const current = await getBlock(block.id);
  return current ? [current] : [];
}

export async function updateBlockSubject(blockId: string, subjectId: string) {
  const db = await readySql();
  const patch = json({ subjectId, updatedAt: nowIso() });
  const rows = await db`
    UPDATE study_blocks
    SET subject_id = ${subjectId}, data = data || ${patch}::jsonb
    WHERE id = ${blockId}
    RETURNING data
  `;
  return rows[0] ? [dataOf<StudyBlock>(rows[0] as { data: StudyBlock | string })] : [];
}

export async function updateBlockTags(blockId: string, tagIds: string[]) {
  const db = await readySql();
  const patch = json({ tagIds, updatedAt: nowIso() });
  const rows = await db`
    UPDATE study_blocks
    SET tag_ids = ${json(tagIds)}::jsonb, data = data || ${patch}::jsonb
    WHERE id = ${blockId}
    RETURNING data
  `;
  return rows[0] ? [dataOf<StudyBlock>(rows[0] as { data: StudyBlock | string })] : [];
}

export async function updateBlockNote(blockId: string, note: string) {
  const db = await readySql();
  const updatedAt = nowIso();
  const patch = json({ note, updatedAt });
  const rows = await db`
    UPDATE study_blocks
    SET data = data || ${patch}::jsonb
    WHERE id = ${blockId}
    RETURNING data
  `;
  return rows[0] ? dataOf<StudyBlock>(rows[0] as { data: StudyBlock | string }) : null;
}

export async function getCalendarSummary(): Promise<CalendarDaySummary[]> {
  const [days, blocks] = await Promise.all([listAllDays(), listAllBlocks()]);
  return buildCalendarSummary(days, blocks);
}

export async function getStats(filters: StatsFilters, todayKey = localDateKey()): Promise<StatsSummary> {
  const [days, blocks, subjects, tags] = await Promise.all([listAllDays(), listAllBlocks(), listSubjects(), listTags()]);
  return buildStatsSummary({ days, blocks, subjects, tags, filters, todayKey });
}

export async function exportLocalData(): Promise<ExportPayload> {
  const [subjects, tags, studyDays, studyBlocks, dailyFractals, settings] = await Promise.all([listSubjects(), listTags(), listAllDays(), listAllBlocks(), listDailyFractals(), getSettings()]);
  return { version: 1, exportedAt: nowIso(), subjects, tags, studyDays, studyBlocks, dailyFractals, settings };
}

export async function importLocalData(payload: ExportPayload) {
  const next = normalizeExportPayload(payload);
  const db = await readySql();
  const compactFractals = next.dailyFractals.map(compactDailyFractal);
  const settings = next.settings ? [next.settings] : [];
  await db.transaction((txn) => [
    txn`DELETE FROM study_blocks`,
    txn`DELETE FROM daily_fractals`,
    txn`DELETE FROM study_days`,
    txn`DELETE FROM subjects`,
    txn`DELETE FROM tags`,
    txn`DELETE FROM app_settings`,
    txn`
      INSERT INTO subjects (id, archived_at, created_at, data)
      SELECT item->>'id', item->>'archivedAt', item->>'createdAt', item
      FROM jsonb_array_elements(${json(next.subjects)}::jsonb) AS item
    `,
    txn`
      INSERT INTO tags (id, archived_at, created_at, data)
      SELECT item->>'id', item->>'archivedAt', item->>'createdAt', item
      FROM jsonb_array_elements(${json(next.tags)}::jsonb) AS item
    `,
    txn`
      INSERT INTO study_days (id, date, created_at, data)
      SELECT item->>'id', item->>'date', item->>'createdAt', item
      FROM jsonb_array_elements(${json(next.studyDays)}::jsonb) AS item
    `,
    txn`
      INSERT INTO study_blocks (id, day_id, date, subject_id, status, tag_ids, started_at, created_at, data)
      SELECT
        item->>'id',
        item->>'dayId',
        item->>'date',
        item->>'subjectId',
        item->>'status',
        COALESCE(item->'tagIds', '[]'::jsonb),
        item->>'startedAt',
        item->>'createdAt',
        item
      FROM jsonb_array_elements(${json(next.studyBlocks)}::jsonb) AS item
    `,
    txn`
      INSERT INTO daily_fractals (id, date, created_at, updated_at, data)
      SELECT item->>'id', item->>'date', item->>'createdAt', item->>'updatedAt', item
      FROM jsonb_array_elements(${json(compactFractals)}::jsonb) AS item
    `,
    txn`
      INSERT INTO app_settings (id, data, updated_at)
      SELECT item->>'id', item, NOW()
      FROM jsonb_array_elements(${json(settings)}::jsonb) AS item
    `,
  ]);
}

export async function resetLocalData() {
  const db = await readySql();
  await db.transaction((txn) => [
    txn`DELETE FROM study_blocks`,
    txn`DELETE FROM daily_fractals`,
    txn`DELETE FROM study_days`,
    txn`DELETE FROM subjects`,
    txn`DELETE FROM tags`,
    txn`DELETE FROM app_settings`,
  ]);
}

export async function getSnapshot(todayKey = localDateKey()): Promise<AppSnapshot> {
  const [settings, initialSubjects, initialTags, allDays, allBlocks, initialDailyFractals] = await Promise.all([
    getSettings(),
    listSubjects(),
    listTags(),
    listAllDays(),
    listAllBlocks(),
    listDailyFractals(),
  ]);
  const seededSubjects = await seedDefaultSubjectsIfEmpty(settings.locale, initialSubjects);
  const seededTags = await seedDefaultTagsIfEmpty(settings.locale, initialTags);
  const subjects = [...initialSubjects, ...seededSubjects];
  const tags = [...initialTags, ...seededTags];
  const dailyFractals = await ensureDailyFractalProgress({ asOfDate: todayKey, fractals: initialDailyFractals, blocks: allBlocks, days: allDays, subjects, tags });
  const today = allDays.find((day) => day.date === todayKey) ?? null;
  const todayBlocks = today ? allBlocks.filter((block) => block.date === today.date).sort((a, b) => a.index - b.index) : [];
  const calendarSummary = buildCalendarSummary(allDays, allBlocks);
  return { settings, subjects, tags, today, todayBlocks, calendarSummary, allDays, allBlocks, dailyFractals };
}
