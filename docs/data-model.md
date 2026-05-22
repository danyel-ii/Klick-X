# Data Model and Persistence Specification

## Persistence strategy

Use IndexedDB via Dexie. Use Zustand for state orchestration and UI-level actions. Keep the model local-first and backend-sync-compatible.

## Timestamps

Store timestamps as ISO strings. Store dates as local date strings in `YYYY-MM-DD` format.

## Tables

### subjects

```ts
type Subject = {
  id: string;
  name: string;
  color: string;
  icon?: string;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};
```

### tags

```ts
type Tag = {
  id: string;
  name: string;
  color: string;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};
```

### studyDays

```ts
type StudyDay = {
  id: string;
  date: string; // YYYY-MM-DD
  plannedBlockCount: number;
  createdAt: string;
  updatedAt: string;
};
```

### studyBlocks

```ts
type StudyBlockStatus = 'planned' | 'active' | 'paused' | 'completed' | 'skipped';

type StudyBlock = {
  id: string;
  dayId: string;
  date: string; // YYYY-MM-DD
  index: number;
  subjectId: string;
  tagIds: string[];
  status: StudyBlockStatus;
  plannedMinutes: number;
  elapsedSeconds: number;
  startedAt?: string | null;
  completedAt?: string | null;
  note?: string;
  createdAt: string;
  updatedAt: string;
};
```

Dexie can index tag arrays with a multi-entry index such as `*tagIds`, or the implementation may use a join table if preferred for analytics.

### settings

```ts
type AppSettings = {
  id: 'app';
  blockMinutes: number;
  theme: 'system' | 'light' | 'dark';
  locale: 'en' | 'de';
  onboardingCompletedAt?: string | null;
  onboardingVersion: number;
  startOfWeek: 'monday' | 'sunday';
  screensaverEnabled: boolean;
  screensaverDelaySeconds: number;
  notificationsEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
};
```

### optional studySessions or studyEvents

For more accurate analytics, add a session/event table:

```ts
type StudySession = {
  id: string;
  blockId: string;
  dayId: string;
  date: string;
  subjectId: string;
  tagIds: string[];
  startedAt: string;
  endedAt?: string | null;
  durationSeconds: number;
  createdAt: string;
  updatedAt: string;
};
```

This is optional in v1, but useful if pause/resume history should be auditable.

## Seed data

Seed defaults only if no active records exist.

English subjects:

- Mathematics
- Physics
- Chemistry
- Biology
- Literature
- History
- Languages
- Computer Science

German subjects:

- Mathematik
- Physik
- Chemie
- Biologie
- Literatur
- Geschichte
- Sprachen
- Informatik

English tags:

- Exam prep
- Homework
- Revision
- Deep focus
- Catch-up

German tags:

- Prüfungsvorbereitung
- Hausaufgaben
- Wiederholung
- Fokuszeit
- Nachholen

## Store actions

Required actions:

```ts
seedDefaultSubjectsIfEmpty(locale: 'en' | 'de'): Promise<void>;
seedDefaultTagsIfEmpty(locale: 'en' | 'de'): Promise<void>;
listSubjects(): Promise<Subject[]>;
createSubject(input): Promise<Subject>;
updateSubject(id, input): Promise<void>;
archiveSubject(id): Promise<void>;
listTags(): Promise<Tag[]>;
createTag(input): Promise<Tag>;
updateTag(id, input): Promise<void>;
archiveTag(id): Promise<void>;
getSettings(): Promise<AppSettings>;
updateSettings(patch): Promise<void>;
setLocale(locale): Promise<void>;
completeOnboarding(): Promise<void>;
resetOnboarding(): Promise<void>;
getTodayDay(): Promise<StudyDay | null>;
createOrUpdateDayPlan(date, plannedBlockCount, assignments): Promise<void>;
listBlocksForDate(date): Promise<StudyBlock[]>;
updateBlockSubject(blockId, subjectId): Promise<void>;
updateBlockTags(blockId, tagIds): Promise<void>;
startBlock(blockId): Promise<void>;
pauseBlock(blockId): Promise<void>;
completeBlock(blockId): Promise<void>;
skipBlock(blockId): Promise<void>;
updateBlockNote(blockId, note): Promise<void>;
getCalendarSummary(): Promise<CalendarSummary>;
getStats(range, filters): Promise<StatsSummary>;
exportLocalData(): Promise<ExportPayload>;
importLocalData(payload): Promise<void>;
resetLocalData(): Promise<void>;
```

## Timer persistence algorithm

When starting a block:

1. Pause any other active block, accumulating elapsed time.
2. Set selected block status to `active`.
3. Set selected block `startedAt` to current timestamp.
4. Keep existing `elapsedSeconds`.

When pausing:

1. Calculate delta between now and `startedAt`.
2. Add delta to `elapsedSeconds`.
3. Set status to `paused`.
4. Clear `startedAt`.

When completing:

1. If active, accumulate delta.
2. Set status to `completed`.
3. Set `completedAt`.
4. Clear `startedAt`.

When rendering:

```ts
const visibleElapsedSeconds = block.status === 'active' && block.startedAt
  ? block.elapsedSeconds + secondsBetween(now, block.startedAt)
  : block.elapsedSeconds;
```

## Import/export

Export all tables in a versioned JSON payload. Validate imported JSON before writing. Use confirmations for destructive replacement. Keep import/export copy localized.
