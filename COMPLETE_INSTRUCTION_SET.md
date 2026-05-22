# Complete Study Blocks Codex Instruction Set


---

## File: `README.md`

# Study Blocks App — Complete Codex Instruction Kit

This package contains a full repo-ready instruction set for building a production-quality study planning app around 30-minute study blocks.

It includes:

- `AGENTS.md` — the main Codex project instruction file. Put this at the root of the app repo.
- `agent.md` — compatibility/naming note for humans. Codex reads `AGENTS.md`, not `agent.md`.
- `docs/*.md` — product, design, data, i18n, onboarding, timer screensaver, tagging, analytics, implementation, and QA specs.
- `prompts/*.md` — staged Codex prompts that can be piped into `codex exec`.
- `CODEX_READY_COMMANDS.md` — the complete staged command runbook.
- `COMPLETE_INSTRUCTION_SET.md` — a single-file merged version of the whole kit.

## App concept

Users maintain subjects and tags from Settings. Each day, they choose how many 30-minute blocks they will work, assign subjects by clicking from the maintained subject list, optionally add tags by clicking from the maintained tag list, and then study from a beautiful daily board. Each block supports a persistent timer, notes, completion state, and a calm focus/screensaver mode. Calendar and Stats provide full history, totals, averages, streaks, subject/tag breakdowns, notes search, and trends.

## Required stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Dexie / IndexedDB
- Zustand
- Recharts
- Framer Motion
- date-fns
- lucide-react
- shadcn/ui where helpful

## Core required features

- First-run onboarding card deck.
- English and German app language settings.
- Subject management from Settings.
- Tag management from Settings.
- Click-based subject assignment; no free typing in block planning.
- Click-based tag assignment; no ad-hoc tags inside the study flow.
- 30-minute default study blocks.
- Daily setup flow.
- Persistent timer per block.
- Notes per block.
- Calm timer screensaver/focus animation.
- Calendar history.
- Stats with totals, averages, streaks, subject and tag analytics.
- Import/export local data.
- Local-first v1 with no backend.

## How to use

1. Create a new Next.js app.
2. Copy `AGENTS.md` and the `docs/` directory into the root of the new repo.
3. Run the staged prompts from `CODEX_READY_COMMANDS.md`, or copy/paste individual prompts from `prompts/`.
4. Commit after each phase.
5. Run lint/build/tests after each implementation phase.

Recommended command shape:

```bash
cat prompts/01-design-system-app-shell.md | codex exec --sandbox workspace-write --ask-for-approval on-request -
```

## Files to copy into the project repo

At minimum, copy:

```text
AGENTS.md
docs/
prompts/
CODEX_READY_COMMANDS.md
```

Keep this package outside the repo as a reference if preferred.


---

## File: `AGENTS.md`

# AGENTS.md — Study Blocks App

## Project mission

Build a production-quality local-first study planning and to-do app centered on 30-minute study blocks. The app should feel calm, premium, fast, and focused. It must be simple enough for daily use while still providing serious study history and analytics.

## Product summary

The user maintains a list of subjects and a list of tags from Settings. Each day, on first opening the app or visiting Today, the user chooses how many 30-minute blocks they will work and assigns one subject to each block by clicking from the maintained subject list. The user can optionally assign tags to blocks by clicking from the maintained tag list. After setup, the user enters a beautiful Study Board where each block is clickable and supports timer controls, notes, subject changes, tag changes, completion, skipping, and focus mode.

Calendar and Stats pages keep full history of what was studied, when, for how long, with which subjects, with which tags, and with which notes.

## Non-negotiable requirements

- Local-first v1. Do not add a backend unless explicitly requested.
- Use Next.js App Router, TypeScript, Tailwind CSS, Dexie/IndexedDB, Zustand, Recharts, Framer Motion, date-fns, and lucide-react.
- 30-minute blocks are the default unit. Settings may allow changing the default later, but v1 copy and flows should center on 30-minute blocks.
- Subject assignment inside planning and board flows must be click-based from a maintained subject list. Do not use free-text subject entry inside block assignment.
- Tag assignment inside planning and board flows must be click-based from a maintained tag list. Do not use ad-hoc free-text tag creation inside the daily study flow.
- Each block has exactly one subject and zero or more tags.
- Only one timer block may be active at a time.
- Timer state must survive reloads.
- Notes are saved per block.
- First-run onboarding must appear before normal app usage until completed or skipped.
- App UI must support English and German.
- Settings must include language selection for English and German.
- The timer screen must include a calm screensaver/focus animation.
- Calendar and Stats must use real persisted data, not mock data.
- Accessibility is required: keyboard navigation, focus states, labels, and reduced-motion behavior.

## Pages and routes

- `/` redirects or renders Today.
- `/today` shows first-run onboarding if needed, then daily setup if no plan exists, otherwise Study Board.
- `/calendar` shows calendar history and day details.
- `/stats` shows analytics dashboard.
- `/settings` manages subjects, tags, language, theme, onboarding replay, import/export, and advanced reset.

## Core entities

### Subject

- `id: string`
- `name: string`
- `color: string`
- `icon?: string`
- `archivedAt?: string | null`
- `createdAt: string`
- `updatedAt: string`

### Tag

- `id: string`
- `name: string`
- `color: string`
- `archivedAt?: string | null`
- `createdAt: string`
- `updatedAt: string`

### StudyDay

- `id: string`
- `date: string` as `YYYY-MM-DD`
- `plannedBlockCount: number`
- `createdAt: string`
- `updatedAt: string`

### StudyBlock

- `id: string`
- `dayId: string`
- `date: string` as `YYYY-MM-DD`
- `index: number`
- `subjectId: string`
- `tagIds: string[]`
- `status: planned | active | paused | completed | skipped`
- `plannedMinutes: number`
- `elapsedSeconds: number`
- `startedAt?: string | null`
- `completedAt?: string | null`
- `note?: string`
- `createdAt: string`
- `updatedAt: string`

### Settings

- `blockMinutes: number`, default `30`
- `theme: system | light | dark`
- `locale: en | de`
- `onboardingCompletedAt?: string | null`
- `onboardingVersion: number`
- `startOfWeek: monday | sunday`
- `screensaverEnabled: boolean`
- `screensaverDelaySeconds: number`
- `notificationsEnabled?: boolean`

Optional: add `StudySession` or `StudyEvent` if it improves timer/history correctness.

## Onboarding requirements

Create a clean first-run onboarding deck of cards. It should explain:

1. What the app does.
2. Maintaining subjects in Settings.
3. Maintaining tags in Settings.
4. Planning a day with 30-minute blocks.
5. Assigning subjects and optional tags by clicking chips.
6. Starting timers, adding notes, and completing blocks.
7. Using calm focus/screensaver mode.
8. Reviewing progress in Calendar and Stats.
9. Choosing English or German and personalization in Settings.

Include Back, Next, Skip, and Get started actions. Include progress dots or a step indicator. Persist completion. Allow replay from Settings. Localize all onboarding copy in English and German. Use premium card motion; avoid childish carousel visuals.

## English/German requirements

Use a simple typed i18n dictionary unless a lightweight library is clearly justified. All core UI copy must be localizable:

- Navigation
- Onboarding
- Daily setup
- Study Board
- Timer controls
- Focus/screensaver mode
- Notes
- Subjects
- Tags
- Calendar
- Stats
- Settings
- Empty states
- Validation messages
- Import/export/reset flows

Use date-fns locale support for English/German dates. Default language should use browser locale when possible, falling back to English. User-created subject/tag names are not auto-translated. Seeded defaults should be localized based on the initial locale or represented with stable keys and localized labels.

## Timer and focus/screensaver requirements

The timer screen must support a calm focus mode/screensaver.

Activation:

- User clicks/taps Focus mode on an active block.
- Optionally auto-activate after `screensaverDelaySeconds` while a timer is active and `screensaverEnabled` is true.

Visual behavior:

- Slow breathing orb, soft gradient field, or similarly calm ambient animation.
- Subject color as accent.
- Current timer and subject remain visible.
- Progress ring or minimal time display remains visible.
- Controls: pause/resume, complete block, exit focus mode, and preferably add note.
- Respect `prefers-reduced-motion` by rendering a static calm screen.
- Must not break timer persistence.
- Must avoid expensive animations and excessive CPU use.

## Tagging requirements

Tags are optional block labels separate from subjects. They help group blocks by purpose, mode, or context.

Examples:

- English defaults: Exam prep, Homework, Revision, Deep focus, Catch-up.
- German defaults: Prüfungsvorbereitung, Hausaufgaben, Wiederholung, Fokuszeit, Nachholen.

Rules:

- Tags are managed in Settings.
- Tags have name and color. Icons are optional.
- Tags can be archived, not hard-deleted.
- Blocks can have zero, one, or multiple tags.
- Tags are assigned by clicking tag chips.
- Blocks show compact tag chips.
- Calendar day details show tags used that day.
- Stats include time by tag and tag filtering.
- Notes search should support tag filtering where practical.

## Design direction

Design a calm, state-of-the-art productivity app:

- Mobile-first, desktop-polished.
- Clean app shell with Today, Calendar, Stats, Settings.
- Strong visual hierarchy.
- Soft gradients and layered surfaces.
- Tactile, beautiful block cards.
- Clear timer/progress display.
- Subject and tag colors should be harmonious and accessible.
- Motion should feel premium and restrained.
- Light and dark modes must both be excellent.
- Avoid clutter, neon excess, generic dashboard blandness, or novelty visuals.

## Components to prefer

- `AppShell`
- `PageHeader`
- `SurfaceCard` / `GlassCard`
- `SubjectPill`
- `TagPill`
- `StudyBlockCard`
- `TimerRing`
- `TimerDisplay`
- `FocusScreensaver`
- `StatCard`
- `CalendarHeatmap` or calendar month grid
- `EmptyState`
- `LanguageSelector`
- `OnboardingDeck`
- `IconButton`

## Store/actions to implement

Use Dexie for persistence and Zustand for state orchestration. Required actions include:

- `seedDefaultSubjectsIfEmpty(locale)`
- `seedDefaultTagsIfEmpty(locale)`
- `listSubjects()`
- `createSubject()`
- `updateSubject()`
- `archiveSubject()`
- `listTags()`
- `createTag()`
- `updateTag()`
- `archiveTag()`
- `getSettings()`
- `updateSettings()`
- `setLocale(locale)`
- `completeOnboarding()`
- `resetOnboarding()`
- `getTodayDay()`
- `createOrUpdateDayPlan(date, plannedBlockCount, assignments)`
- `listBlocksForDate(date)`
- `updateBlockSubject(blockId, subjectId)`
- `updateBlockTags(blockId, tagIds)`
- `startBlock(blockId)`
- `pauseBlock(blockId)`
- `completeBlock(blockId)`
- `skipBlock(blockId)`
- `updateBlockNote(blockId, note)`
- `getCalendarSummary()`
- `getStats(range, filters)`
- `exportLocalData()`
- `importLocalData(json)`
- `resetLocalData()`

## Timer correctness rules

- When a block starts, set `status = active` and `startedAt = now`.
- When pausing/completing, add the difference between `now` and `startedAt` to `elapsedSeconds`, then clear `startedAt` unless completed timestamp is needed separately.
- When rendering an active block, displayed elapsed time equals persisted `elapsedSeconds + (now - startedAt)`.
- Starting a block pauses any other active block first.
- Reloading the app while a block is active must show the correct elapsed time.
- Completion should preserve actual elapsed duration, even if under or over 30 minutes.

## Analytics requirements

Stats should include:

- Total study time.
- Total completed blocks.
- Planned vs completed blocks.
- Completion rate.
- Current streak.
- Longest streak.
- Average study time per active day.
- Average blocks per active day.
- Time by subject.
- Time by tag.
- Weekly trends.
- Monthly trends.
- Most studied subject.
- Most used tag.
- Notes history and search.
- Filtering by date range, subject, and tag.

Streaks should count days with completed study time. Calendar intensity should be based on actual completed or studied time, not merely planned blocks.

## Quality gates

Before completing any implementation phase:

- Run `npm run lint` if available.
- Run `npm run build` if available.
- Run tests if available.
- Fix TypeScript errors.
- Fix obvious hydration issues.
- Confirm navigation works.
- Confirm empty states are acceptable.
- Confirm icon-only buttons have accessible labels.
- Confirm reduced-motion behavior for onboarding and focus mode.
- Confirm timer persistence across reloads.
- Avoid destructive actions without confirmation.

## Implementation discipline

- Keep files typed and maintainable.
- Prefer small reusable components over huge page files.
- Do not silently remove features from earlier phases.
- Use real persisted data once the data layer exists.
- Avoid introducing unnecessary dependencies.
- Make high-confidence changes. If a change is risky, document it rather than forcing it.


---

## File: `agent.md`

# agent.md

Codex uses `AGENTS.md` as the project instruction file. This file is included only because the instruction set was requested with an `agent.md` reference.

Use the root-level `AGENTS.md` file in this package as the actual Codex guidance file.


---

## File: `docs/product-spec.md`

# Product Specification — Study Blocks

## Product thesis

Study Blocks is a local-first study planning and execution app for students and self-learners. It converts the vague goal of "study today" into a small number of concrete 30-minute blocks. The product emphasizes fast planning, low-friction execution, and meaningful history.

## User flow

1. First opening shows a clean onboarding card deck.
2. User can choose English or German during onboarding and later in Settings.
3. User maintains subjects in Settings.
4. User maintains tags in Settings.
5. Each day, user chooses how many 30-minute blocks they will study.
6. User assigns a subject to each block by clicking a subject chip.
7. User optionally assigns one or more tags to each block by clicking tag chips.
8. User starts studying from the daily Study Board.
9. Each block can be started, paused, resumed, completed, skipped, edited, tagged, and annotated.
10. The active timer can enter calm focus/screensaver mode.
11. Calendar and Stats show historical performance.

## Primary user stories

- As a student, I want to plan 3 study blocks for today so I know exactly what I will work on.
- As a student, I want to assign Mathematics, Biology, and Literature by clicking subjects, so planning stays fast.
- As a student, I want to add tags like Exam prep or Homework so I can later see why I studied.
- As a student, I want a timer that persists after reload so I do not lose progress.
- As a student, I want notes per block so I can record what I covered.
- As a student, I want a calm focus animation so the timer screen is pleasant during work.
- As a student, I want to see streaks, totals, averages, and subject/tag breakdowns so I understand my habits.
- As a bilingual user, I want the interface in English or German.

## Pages

### Today

Today is the central workflow page.

States:

- First-run onboarding gate if onboarding is incomplete.
- Daily setup if no study plan exists for the date.
- Study Board if a study plan exists.
- Completion summary if all blocks are completed or skipped.

### Settings

Settings manages:

- Subjects.
- Tags.
- Language.
- Theme.
- Start of week.
- Screensaver/focus mode settings.
- Onboarding replay.
- Import/export.
- Advanced local data reset.

### Calendar

Calendar shows:

- Month grid.
- Study intensity by day.
- Today marker.
- Selected day detail panel.
- Subjects, tags, durations, notes, and block status for each day.

### Stats

Stats shows:

- Totals.
- Averages.
- Streaks.
- Completion rate.
- Subject breakdown.
- Tag breakdown.
- Weekly trend.
- Monthly trend.
- Notes search.
- Filters by range, subject, and tag.

## Feature requirements

### Onboarding

The onboarding deck should be short, elegant, and functional. It should use a deck/card metaphor, but it should not feel like a marketing carousel. It should teach the workflow and get out of the way.

Required cards:

1. Welcome and value proposition.
2. Subjects: maintain your study areas.
3. Tags: label blocks by purpose.
4. Plan today: choose a number of 30-minute blocks.
5. Assign blocks: click subjects and optional tags.
6. Study: start timer, add notes, complete blocks.
7. Focus: use calm screensaver mode.
8. Reflect: calendar and stats.
9. Personalize: language, theme, and settings.

### Subjects

Subjects represent what is studied. A block has exactly one subject. Subjects are created and edited in Settings. Assigning a subject to a block must be click-based from the maintained list.

Default English subjects:

- Mathematics
- Physics
- Chemistry
- Biology
- Literature
- History
- Languages
- Computer Science

Default German subjects:

- Mathematik
- Physik
- Chemie
- Biologie
- Literatur
- Geschichte
- Sprachen
- Informatik

### Tags

Tags represent context, intent, or mode. A block can have multiple tags. Tags are created and edited in Settings. Assigning tags must be click-based from the maintained list.

Default English tags:

- Exam prep
- Homework
- Revision
- Deep focus
- Catch-up

Default German tags:

- Prüfungsvorbereitung
- Hausaufgaben
- Wiederholung
- Fokuszeit
- Nachholen

### Timer

The timer must support start, pause, resume, complete, and skip. One active block at a time. State persists across reload. Timer should display actual elapsed time and planned 30-minute target.

### Screensaver/focus mode

Focus mode should turn the active timer screen into a calm, low-distraction ambient view. It should include slow animation, visible remaining/elapsed time, subject, tags if space allows, and core controls. It should respect reduced-motion preferences.

### Calendar and stats

History is useful only if it is trustworthy. Use actual block data and elapsed time. Do not count merely planned blocks as studied time.

## Product tone

Clear, quiet, and motivating. Avoid exaggerated praise or noisy gamification. Streaks should encourage consistency without punishing missed days.


---

## File: `docs/design-system.md`

# Design System Specification

## Design principles

- Calm over loud.
- Clarity over density.
- Tactile cards over flat lists.
- Premium motion over gimmicks.
- Accessible contrast over purely decorative color.
- Mobile-first, desktop-polished.

## Visual language

Use layered surfaces, soft gradients, subtle blur where performance allows, crisp borders, clear typography, and comfortable spacing. The Study Board should feel like the visual centerpiece: blocks should look tappable, ordered, and satisfying to complete.

## Theme

Support `light`, `dark`, and `system`.

Use CSS variables for:

- Background
- Foreground
- Muted foreground
- Card background
- Elevated surface
- Border
- Accent
- Success
- Warning
- Destructive
- Ring/focus

## Layout

### Mobile

- Top header with page title and primary action.
- Bottom navigation for Today, Calendar, Stats, Settings.
- Study blocks in a single-column or two-column responsive grid depending on width.
- Timer controls large enough for touch.
- Settings forms optimized for thumb interaction.

### Desktop

- Left side navigation.
- Content max-width with spacious cards.
- Today page can use a two-pane layout: block timeline/board plus active timer/detail panel.
- Stats can use dashboard grid.

## Components

### AppShell

Provides navigation, theme-aware background, safe area padding, and responsive page layout.

### PageHeader

Includes title, subtitle, and optional primary action. Should support localized copy.

### SubjectPill

Displays subject name, color, and optional icon. Used in settings, daily setup, and block cards.

### TagPill

Displays tag name and color. Smaller than subject pill. Supports selected/unselected states.

### StudyBlockCard

Shows:

- Block index.
- Subject.
- Tags.
- Status.
- Elapsed time.
- Planned duration.
- Note indicator.
- Completion/skipped state.

States must be visually distinct:

- Planned.
- Active.
- Paused.
- Completed.
- Skipped.

### TimerRing

Displays progress toward planned minutes and actual elapsed time. Must not imply the timer stops at 30 minutes unless implemented that way. Overrun should remain visible.

### FocusScreensaver

Full-screen or immersive panel with calm animation, visible timer, subject accent, and minimal controls.

### OnboardingDeck

Card deck with progress, keyboard navigation, localized content, Skip/Get started actions, and restrained motion.

### StatCard

Small summary metric card with label, value, optional helper text, and optional trend marker.

### CalendarMonthGrid

Month view with intensity. Must have accessible text alternative for day values.

## Motion

Use Framer Motion for:

- Onboarding card transitions.
- Study block assignment changes.
- Status changes.
- Focus mode entry/exit.
- Gentle screensaver animation.

Rules:

- Keep durations moderate.
- Avoid constant movement outside focus mode.
- Respect `prefers-reduced-motion`.
- Do not animate layout so heavily that it causes instability.

## Accessibility

- Every icon-only button must have an accessible name.
- Keyboard users must be able to navigate onboarding, setup, timer controls, and settings.
- Selected subject/tag states need visual and semantic indication.
- Calendar days need readable labels.
- Charts need non-chart summaries.
- Color must not be the only status indicator.

## Copy style

Use short, concrete labels:

- Start
- Pause
- Resume
- Complete
- Skip
- Add note
- Focus mode
- Exit focus
- Today’s plan
- Time by subject
- Time by tag

German copy should be natural, not word-for-word mechanical translation.


---

## File: `docs/data-model.md`

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


---

## File: `docs/i18n-spec.md`

# English/German i18n Specification

## Goals

The app must support English and German for all core interface copy. Language should be selectable in Settings and should take effect immediately without data loss.

## Locale detection

On first run:

1. Detect browser language.
2. Use German if browser language starts with `de`.
3. Otherwise use English.
4. Let the user change language during onboarding and in Settings.

## Dictionary structure

Use typed dictionaries unless a library is clearly beneficial.

Suggested structure:

```ts
export const dictionaries = {
  en: {
    nav: { today: 'Today', calendar: 'Calendar', stats: 'Stats', settings: 'Settings' },
    actions: { start: 'Start', pause: 'Pause', resume: 'Resume', complete: 'Complete' },
    onboarding: { /* ... */ },
    today: { /* ... */ },
    settings: { /* ... */ },
  },
  de: {
    nav: { today: 'Heute', calendar: 'Kalender', stats: 'Statistik', settings: 'Einstellungen' },
    actions: { start: 'Starten', pause: 'Pausieren', resume: 'Fortsetzen', complete: 'Abschließen' },
    onboarding: { /* ... */ },
    today: { /* ... */ },
    settings: { /* ... */ },
  },
} as const;
```

## Required localized areas

- Navigation.
- Onboarding.
- Daily setup.
- Study Board.
- Timer controls.
- Focus/screensaver mode.
- Notes.
- Subject settings.
- Tag settings.
- Calendar.
- Stats.
- Import/export/reset.
- Empty states.
- Validation messages.
- Toasts.

## Dates and formatting

Use date-fns locale support:

- `enUS` for English.
- `de` for German.

Use localized date formats on Calendar and Stats. Keep stored dates as `YYYY-MM-DD` regardless of language.

## Persisted names

Do not auto-translate user-created subject or tag names. Seed initial defaults based on first selected locale, or store seeded defaults with stable keys and localized labels. Avoid changing user data when language changes.

## Language settings UI

Settings should include a clear language selector:

- English
- Deutsch

Changing language should update the interface immediately and persist to IndexedDB.

## Copy guidance

German copy should be natural and concise. Avoid literal translations when German product language would use a different term.

Examples:

- `Today` → `Heute`
- `Study Board` → `Lernübersicht` or `Lernboard`
- `Focus mode` → `Fokusmodus`
- `Tags` → `Tags` or `Markierungen`; use one term consistently.
- `Exam prep` → `Prüfungsvorbereitung`
- `Catch-up` → `Nachholen`


---

## File: `docs/onboarding-spec.md`

# Onboarding Deck Specification

## Objective

Onboarding should quickly teach the app's workflow and then get out of the way. It should appear on first opening before normal app usage and be replayable from Settings.

## Behavior

- Show if `onboardingCompletedAt` is empty or if `onboardingVersion` is behind the current app onboarding version.
- Allow Skip.
- Allow Get started on the final card.
- Persist completion or skip.
- Allow replay from Settings without resetting user data.
- Include language selector either on the first card or as a small control in the deck.
- Localize all copy in English and German.

## Deck cards

1. Welcome: plan study time in focused 30-minute blocks.
2. Subjects: maintain the list of subjects from Settings.
3. Tags: maintain tags for purpose/context.
4. Plan today: choose how many blocks to study.
5. Assign: click subjects and optional tags for each block.
6. Study: start the timer, pause/resume, complete, skip.
7. Notes: capture what you covered.
8. Focus: use calm focus/screensaver mode while studying.
9. Reflect: review Calendar and Stats.
10. Personalize: language, theme, import/export, and settings.

## UI details

- Card deck layout.
- Clear title and short body text.
- Progress dots or step count.
- Back, Next, Skip, and Get started buttons.
- Keyboard support: Enter for primary action, Escape for Skip if appropriate, arrow keys optional.
- Motion should be smooth and restrained.
- Respect reduced-motion preferences.
- Mobile view should fit without awkward scrolling.

## Visual direction

Use soft surfaces, gentle depth, small illustrations or abstract shapes if useful. Do not use loud mascot-style onboarding. This app should feel mature and focused.

## Persistence

Store:

- `onboardingCompletedAt`
- `onboardingVersion`

Skipping counts as completion for the current onboarding version.


---

## File: `docs/tagging-spec.md`

# Tagging Specification

## Purpose

Tags give study blocks additional context beyond subject. Subjects answer "what did I study?" Tags answer "why or how did I study?"

## Data

A tag has:

- id
- name
- color
- archivedAt
- createdAt
- updatedAt

A study block has:

- `tagIds: string[]`

## Rules

- Tags are optional.
- A block can have zero, one, or many tags.
- Tags are separate from subjects.
- A block has exactly one subject.
- Tags are managed from Settings.
- Tags are assigned by clicking from the maintained tag list.
- No free-text tag creation inside daily setup or block detail.
- Tags can be archived, not hard-deleted.
- Archived tags remain visible on historical blocks but are not offered for new assignment by default.

## Defaults

English:

- Exam prep
- Homework
- Revision
- Deep focus
- Catch-up

German:

- Prüfungsvorbereitung
- Hausaufgaben
- Wiederholung
- Fokuszeit
- Nachholen

## UI placement

### Settings

Settings should include a Tags section near Subjects:

- List active tags.
- Add tag.
- Edit name.
- Choose color.
- Archive tag.
- Show archived tags in a collapsible section if useful.

### Daily setup

When assigning each block:

- Subject selection is required.
- Tag selection is optional.
- Show selected tags as compact chips.
- Allow repeated tag combinations across blocks.

### Study Board

Each block card should show compact tags. Block detail should allow adding/removing tags by clicking chips.

### Calendar

Day detail should show tags used that day and tag totals if practical.

### Stats

Stats should include:

- Time by tag.
- Most used tag.
- Tag filter.
- Notes search filter by tag.

## Analytics

If a block has multiple tags, avoid double-counting total studied time in global totals. For `time by tag`, it is acceptable for each tag to receive the full block duration, but label this as tag-associated time if necessary. Alternatively, distribute time across tags, but be consistent and document the method.

Recommended v1: count full block time for each tag in tag breakdowns, while global totals count each block once.


---

## File: `docs/timer-screensaver-spec.md`

# Timer Screensaver / Focus Mode Specification

## Goal

The active timer screen should include a calm focus mode that feels like a study-friendly screensaver. It should make the timer screen pleasant without distracting from study.

## Activation

- User can click/tap `Focus mode` on an active block.
- If enabled, focus mode may auto-activate after `screensaverDelaySeconds` while a timer is active.
- User can disable auto-activation in Settings.

## Required controls

Focus mode must allow:

- Pause/resume.
- Complete block.
- Exit focus mode.
- Add or edit note if practical.

## Display

Show:

- Subject.
- Optional tags.
- Elapsed time.
- Planned target or progress ring.
- Current status.

## Animation direction

Use one of these:

- Slow breathing orb.
- Soft ambient gradient field.
- Minimal wave/ring animation.

Rules:

- Use subject color as accent.
- Avoid fast particles.
- Avoid busy backgrounds.
- Avoid high CPU animation loops.
- Do not hide the timer.
- Do not create a fake video-like animation that drains battery.

## Accessibility and motion

- Respect `prefers-reduced-motion`.
- In reduced-motion mode, render static gradient/orb and keep controls visible.
- Ensure text contrast is sufficient.
- Maintain keyboard escape/exit behavior.

## Persistence

Focus mode should not affect timer persistence. Reloading during focus mode should either return to the Study Board with the timer still active or restore focus mode if that is intentionally stored.

## Settings

Settings should include:

- Screensaver/focus auto-activate enabled.
- Delay in seconds.
- Possibly preview focus screen.


---

## File: `docs/analytics-spec.md`

# Calendar and Analytics Specification

## Calendar

Calendar should show a full history month view.

Required:

- Month navigation.
- Today marker.
- Selected day state.
- Intensity based on actual studied time.
- Day detail panel.

Day detail should show:

- Total studied time.
- Blocks and statuses.
- Subjects studied.
- Tags used.
- Notes.

## Stats

Stats should provide a clear dashboard without clutter.

Required metrics:

- Total study time.
- Total completed blocks.
- Planned blocks.
- Completion rate.
- Current streak.
- Longest streak.
- Average study time per active day.
- Average blocks per active day.
- Most studied subject.
- Most used tag.
- Time by subject.
- Time by tag.
- Weekly trend.
- Monthly trend.
- Recent notes.

## Filters

Support:

- Range: 7 days, 30 days, 90 days, all time.
- Subject filter.
- Tag filter.

## Streak definition

A streak day is a day with completed studied time greater than zero. Planned-only days do not count. Skipped-only days do not count.

## Completion rate

Recommended:

```text
completed blocks / planned blocks
```

Use planned blocks from days that have study plans. Consider skipped blocks incomplete unless product copy says otherwise.

## Tag time counting

Global totals count each block once. Tag breakdowns can count full duration for every tag attached to a block. If multiple tags are attached, tag breakdown totals may exceed global total; label as tag-associated time if necessary.

## Notes search

Search notes by text and allow optional filters:

- Date range.
- Subject.
- Tag.

Group results by date and show subject/tag chips.

## Charts

Use Recharts for:

- Subject breakdown.
- Tag breakdown.
- Weekly/monthly trends.
- Completion distribution if useful.

Every chart should have a textual summary for accessibility.


---

## File: `docs/implementation-plan.md`

# Implementation Plan

## Phase 0 — Project setup

- Create Next.js app with TypeScript, Tailwind, ESLint, App Router, and src directory.
- Install dependencies.
- Add this instruction kit to the repo.
- Commit baseline.

## Phase 1 — Design foundation and app shell

- Implement global theme tokens.
- Build responsive app shell.
- Add routes: Today, Calendar, Stats, Settings.
- Add reusable components.
- Use mock data only for layout.

## Phase 2 — Local data layer

- Implement Dexie schema.
- Implement typed data model.
- Implement Zustand store/actions.
- Implement analytics utilities.
- Add tests for analytics and timer calculations.

## Phase 3 — i18n foundation

- Add typed dictionaries for English and German.
- Add locale provider/hook.
- Add date-fns locale handling.
- Persist locale in settings.

## Phase 4 — Settings

- Build subject management.
- Build tag management.
- Build language settings.
- Build theme settings.
- Add onboarding replay.
- Add screensaver settings.
- Add import/export and advanced reset.

## Phase 5 — Onboarding deck

- Add first-run gating.
- Build localized card deck.
- Add progress, Skip, Back, Next, Get started.
- Persist completion.
- Allow replay from Settings.

## Phase 6 — Daily setup

- Choose number of 30-minute blocks.
- Assign subject by clicking chips.
- Assign optional tags by clicking chips.
- Preview block sequence.
- Create persisted StudyDay and StudyBlock records.

## Phase 7 — Study Board

- Render real blocks.
- Add timer controls.
- Add notes.
- Add subject and tag editing.
- Enforce one active timer.
- Persist timer across reload.

## Phase 8 — Focus/screensaver mode

- Build calm focus view.
- Add manual activation.
- Add optional auto activation.
- Respect reduced motion.
- Keep timer controls accessible.

## Phase 9 — Calendar and Stats

- Calendar month grid.
- Day detail panel.
- Stats dashboard.
- Subject/tag breakdowns.
- Trends, streaks, averages, notes search.

## Phase 10 — Polish and QA

- Loading and error states.
- Empty states.
- Accessibility audit.
- Mobile polish.
- PWA metadata.
- E2E tests.
- Final Codex review.


---

## File: `docs/qa-test-plan.md`

# QA and Test Plan

## Manual test path

1. First launch shows onboarding.
2. Change language to German in onboarding.
3. Complete or skip onboarding.
4. Settings shows German UI.
5. Add/edit/archive a subject.
6. Add/edit/archive a tag.
7. Switch to English; UI updates without changing user-created names.
8. Create today's plan with 3 blocks.
9. Assign subjects by clicking chips.
10. Assign tags by clicking chips.
11. Start first block.
12. Reload page; timer elapsed time is correct.
13. Pause and resume block.
14. Add note.
15. Enter focus mode.
16. Exit focus mode.
17. Complete block.
18. Start another block; confirm only one active block.
19. Open Calendar; confirm today details.
20. Open Stats; confirm totals, subject breakdown, tag breakdown, streak.
21. Export data.
22. Reset data with confirmation.
23. Import data and confirm records return.

## Unit tests

Add tests for:

- Date helpers.
- Timer elapsed calculation.
- Streak calculation.
- Completion rate.
- Subject breakdown.
- Tag breakdown.
- Range filtering.
- Notes filtering.

## E2E tests

Add Playwright tests for:

- Onboarding completion.
- Language switch.
- Subject creation.
- Tag creation.
- Daily setup.
- Timer start/pause/complete.
- Note saving.
- Calendar visibility.
- Stats visibility.

## Accessibility checks

- Keyboard through onboarding.
- Keyboard through daily setup chips.
- Keyboard through timer controls.
- Focus states visible.
- Icon-only buttons labeled.
- Reduced-motion mode tested.
- Charts have text summaries.
- Calendar days have labels.

## Build gates

Run:

```bash
npm run lint
npm run build
npm test
```

Use the test command actually available in the repo if configured differently.


---

## File: `CODEX_READY_COMMANDS.md`

# Study Blocks App — Complete Codex Build Instructions

This document contains the full staged Codex command set for building a production-quality study plan and to-do app based on 30-minute study blocks.

The instructions include:

- Daily 30-minute study block planning
- Click-based subject assignment from a maintained subject list
- A premium daily study board
- Persistent timers and block notes
- Optional block tags, managed from Settings and assignable by clicking
- Calendar history
- Extensive analytics, streaks, and tag breakdowns
- First-run onboarding card deck
- English/German language settings
- Calm timer screensaver/focus animation
- Local-first IndexedDB persistence
- Dark/light mode
- Accessibility, polish, import/export, and PWA-ready behavior

Assumed stack:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Zustand
- Dexie / IndexedDB
- Recharts
- date-fns
- lucide-react
- Vitest / Testing Library
- Playwright

---

## 0. Codex setup

Install and sign in to Codex CLI.

```bash
npm i -g @openai/codex@latest
codex login
```

For the staged commands below, use non-interactive `codex exec` with workspace-write sandboxing:

```bash
codex exec --sandbox workspace-write --ask-for-approval on-request -
```

The commands below pipe each prompt through stdin using `-`.

---

## 1. Create the Next.js app

```bash
npx create-next-app@latest study-blocks \
  --ts \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd study-blocks
git init
git add .
git commit -m "Initial Next.js scaffold"
```

Install dependencies:

```bash
npm i \
  framer-motion \
  lucide-react \
  recharts \
  date-fns \
  zustand \
  dexie \
  clsx \
  tailwind-merge \
  class-variance-authority \
  react-hook-form \
  zod \
  @hookform/resolvers \
  sonner
```

Set up shadcn/ui:

```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog sheet tabs input textarea badge popover calendar select switch progress scroll-area separator dropdown-menu tooltip command toggle skeleton alert checkbox radio-group
```

Install test tooling:

```bash
npm i -D vitest jsdom @testing-library/react @testing-library/jest-dom playwright
```

---

## 2. Create durable project instructions and product documentation

```bash
cat <<'PROMPT' | codex exec --sandbox workspace-write --ask-for-approval on-request -
Create or update the repo with durable project guidance for a premium study-plan/to-do app.

Create these files if missing:
- AGENTS.md
- docs/product-spec.md
- docs/design-system.md
- docs/data-model.md
- docs/implementation-plan.md
- docs/i18n-spec.md
- docs/onboarding-spec.md
- docs/timer-screensaver-spec.md
- docs/tagging-spec.md

The app concept:
A study plan and to-do app built around 30-minute study blocks.

Core workflow:
1. User maintains a list of subjects from Settings.
2. Each day, when opening the app, user chooses how many 30-minute blocks they will work.
3. User assigns a subject to each block by clicking from the maintained subject list, not free-typing.
4. After setup, user enters a beautiful daily study board.
5. On the board, each block is clickable. Clicking a block allows:
   - start timer
   - pause timer
   - resume timer
   - complete block
   - skip block
   - add/edit notes
   - add/remove tags from the maintained tag list
   - change assigned subject from the subject list
6. Calendar and Stats pages keep full study history and analytics:
   - totals
   - averages
   - streaks
   - completion rate
   - subject breakdown
   - tag breakdown
   - weekly and monthly trends
   - notes history/search
   - filtering by subject and tag

New required features:
1. Clean first-run onboarding deck.
2. English and German language settings.
3. Calm screensaver/focus animation for the timer screen.
4. Optional tagging for study blocks, with tags maintained in Settings and assigned by clicking.

Product style:
- State-of-the-art, calm, premium productivity UI.
- Mobile-first, desktop-polished.
- Dark/light mode.
- Beautiful 30-minute block cards.
- Calendar heatmap and stats dashboards.
- Micro-interactions, motion, hover/press states.
- Accessible keyboard navigation and ARIA labels.
- No clutter. Fast daily setup. Minimal friction.

Technical assumptions:
- Next.js App Router, TypeScript, Tailwind.
- Local-first persistence using IndexedDB via Dexie.
- Zustand for app state.
- Recharts for stats visualizations.
- Framer Motion for motion.
- Date-fns for date/time utilities.
- No backend in v1.
- Data should be designed so backend sync can be added later.

Data model should include:
- Subject: id, name, color, icon, archivedAt, createdAt, updatedAt
- Tag: id, name, color, archivedAt, createdAt, updatedAt
- StudyDay: id, date, plannedBlockCount, createdAt, updatedAt
- StudyBlock: id, dayId, date, index, subjectId, tagIds, status, plannedMinutes, elapsedSeconds, startedAt, completedAt, note, createdAt, updatedAt
- StudySession or StudyEvent if useful for accurate analytics
- Settings: blockMinutes, theme, locale, onboardingCompletedAt, onboardingVersion, startOfWeek, notification preferences, screensaverEnabled, screensaverDelaySeconds

Onboarding spec:
- On first opening, before normal app usage, show a deck of onboarding cards.
- Cards should explain:
  1. What the app does
  2. Maintaining subjects in Settings
  3. Planning the day with 30-minute blocks
  4. Starting timers, adding notes, and tagging blocks
  5. Reviewing progress in Calendar and Stats
  6. Using tags to group blocks such as exam prep, homework, revision, or deep focus
  7. Choosing language and personalization in Settings
- Include Next, Back, Skip, and Get started actions.
- Include progress dots or step indicator.
- Persist completion in Settings.
- Allow replaying onboarding from Settings.
- Localize onboarding content in English and German.
- Use premium card deck motion without feeling childish or noisy.

English/German settings spec:
- Settings must include a language selector: English and German.
- Persist selected locale in IndexedDB/settings.
- Use simple app-level i18n dictionaries unless a lightweight i18n library is clearly justified.
- All core UI copy should be localized:
  - navigation
  - onboarding
  - daily setup
  - study board
  - timer controls
  - notes
  - calendar
  - stats
  - settings
  - empty states
  - validation messages
- Use date-fns locale support for English/German date formatting.
- Do not translate persisted subject names automatically. Default seeded subjects should be created in the active language on first run or have localized display labels where appropriate.
- Changing app language should update UI immediately without losing data.

Timer screensaver/focus animation spec:
- Add a calm screensaver/focus animation on the timer screen.
- It should activate in one of these ways:
  - user taps/clicks Focus mode on an active block, or
  - automatically after the configured delay while a timer is active if screensaver is enabled.
- The animation should be calm and study-friendly:
  - slow breathing orb or soft gradient field
  - subtle ambient motion
  - no distracting fast particles
  - subject color used as an accent
  - current timer and subject remain visible
  - progress ring or minimal time display remains visible
- Include controls:
  - pause/resume
  - complete block
  - exit focus mode
  - add note shortcut if practical
- Respect prefers-reduced-motion by showing a static calm focus screen.
- Must not break timer persistence across reloads.
- Must not consume excessive CPU.

Block tagging spec:
- Tags are optional labels attached to individual study blocks.
- Tags are separate from subjects. A block has exactly one subject but may have zero, one, or multiple tags.
- Tags are maintained from Settings, similar to subjects.
- Tags should be assigned by clicking tag pills/chips from the maintained tag list; avoid free-text tag creation inside the daily planning flow.
- Suggested default tags:
  - English: Exam prep, Homework, Revision, Deep focus, Catch-up
  - German: Prüfungsvorbereitung, Hausaufgaben, Wiederholung, Fokuszeit, Nachholen
- User-created tag names are not auto-translated.
- Tags should have a name and color; icons are optional.
- Tag colors should be visually distinct from subject colors but harmonious with the overall design.
- Blocks should show tag chips in compact form.
- Calendar day details should show tags used on that day.
- Stats should include time by tag and optional filtering by tag.
- Notes search should allow tag-based filtering where practical.

Implementation plan should break work into phases:
1. Design foundation and layout
2. Local data layer
3. Settings/subject/tag management
4. i18n foundation and language settings
5. First-run onboarding deck
6. Daily setup flow with optional block tags
7. Study board with timer, notes, and tags
8. Calm timer screensaver/focus mode
9. Calendar and stats with tag analytics
10. Polish, accessibility, tests, PWA-ready improvements

Do not implement the whole app yet. First create the documentation and AGENTS.md instructions only.
PROMPT
```

```bash
git add .
git commit -m "Add product spec and Codex project guidance"
```

---

## 3. Implement the premium design system and app shell

```bash
cat <<'PROMPT' | codex exec --sandbox workspace-write --ask-for-approval on-request -
Implement the design foundation for the study-blocks app.

Read AGENTS.md and docs/*.md first.

Build:
- Global visual design using Tailwind CSS variables.
- A premium app shell with:
  - top header
  - mobile bottom navigation
  - desktop side navigation
  - routes for Today, Calendar, Stats, Settings
- Dark/light theme support.
- Polished empty states.
- Reusable components:
  - AppShell
  - PageHeader
  - GlassCard or SurfaceCard
  - SubjectPill
  - TagPill
  - TagSelector
  - StudyBlockCard
  - TimerRing or TimerDisplay
  - StatCard
  - EmptyState
  - IconButton
  - LanguageAwareText helper if useful
- Smooth but restrained Framer Motion transitions.
- Responsive layout that looks excellent on phone, tablet, and desktop.

Design direction:
- Calm focus app.
- Soft gradients, layered cards, clear typography.
- High contrast and accessible focus states.
- Blocks should feel tactile and clickable.
- Avoid generic dashboard blandness.

Routes:
- /
- /today
- /calendar
- /stats
- /settings

For now, use mock data only where needed.
Make the app compile.
Run lint/build if available and fix issues.
PROMPT
```

```bash
npm run lint
npm run build
git add .
git commit -m "Implement premium app shell and design system"
```

---

## 4. Implement local-first data layer

```bash
cat <<'PROMPT' | codex exec --sandbox workspace-write --ask-for-approval on-request -
Implement the local-first data layer.

Read AGENTS.md and docs/*.md first.

Use Dexie for IndexedDB persistence and Zustand for app state.

Create:
- src/lib/db.ts
- src/lib/types.ts
- src/lib/date.ts
- src/lib/analytics.ts
- src/lib/i18n/types.ts if useful
- src/store/useStudyStore.ts or equivalent

Data model:
Subject:
- id
- name
- color
- icon
- archivedAt
- createdAt
- updatedAt

Tag:
- id
- name
- color
- archivedAt
- createdAt
- updatedAt

StudyDay:
- id
- date as YYYY-MM-DD
- plannedBlockCount
- createdAt
- updatedAt

StudyBlock:
- id
- dayId
- date as YYYY-MM-DD
- index
- subjectId
- tagIds: string[]
- status: planned | active | paused | completed | skipped
- plannedMinutes, default 30
- elapsedSeconds
- startedAt
- completedAt
- note
- createdAt
- updatedAt

Settings:
- id singleton
- blockMinutes, default 30
- theme: light | dark | system
- locale: en | de
- onboardingCompletedAt
- onboardingVersion
- startOfWeek: monday | sunday
- screensaverEnabled
- screensaverDelaySeconds
- createdAt
- updatedAt

Optionally add StudySession/StudyEvent if it improves accurate timer history.

Required store actions:
- initializeApp()
- getSettings()
- updateSettings(partial)
- setLocale(locale)
- completeOnboarding(version)
- resetOnboarding()
- seedDefaultSubjectsAndTagsIfEmpty(locale)
- seedDefaultSubjectsIfEmpty(locale)
- seedDefaultTagsIfEmpty(locale)
- listSubjects()
- createSubject()
- updateSubject()
- archiveSubject()
- listTags()
- createTag()
- updateTag()
- archiveTag()
- getTodayDay()
- createOrUpdateDayPlan(date, plannedBlockCount, assignments)
  - assignments should include subjectId and optional tagIds per block
- listBlocksForDate(date)
- updateBlockSubject(blockId, subjectId)
- updateBlockTags(blockId, tagIds)
- addBlockTag(blockId, tagId)
- removeBlockTag(blockId, tagId)
- startBlock(blockId)
- pauseBlock(blockId)
- completeBlock(blockId)
- skipBlock(blockId)
- updateBlockNote(blockId, note)
- getCalendarSummary()
- getStats(range)
- exportLocalData()
- importLocalData(json)
- resetLocalData()
- validate imported tags and block tagIds so deleted/unknown tag references do not crash the UI

Important behavior:
- One active block at a time.
- Starting a new block pauses any existing active block.
- Timer elapsed time must persist across reloads.
- If a block is active and the app reloads, calculate elapsed time from startedAt plus stored elapsedSeconds.
- Keep code type-safe.
- Add utility functions for streaks, totals, averages, subject breakdown, tag breakdown, calendar summaries, and notes search.
- Settings must persist and hydrate safely on the client.

Replace mock data only where safe; leave UI stable.
Add basic tests for analytics utilities and timer elapsed calculations.
Run lint/build/tests and fix issues.
PROMPT
```

```bash
npm run lint
npm run build
npm test -- --run || true
git add .
git commit -m "Implement local-first study data layer"
```

---

## 5. Implement i18n foundation and language settings

```bash
cat <<'PROMPT' | codex exec --sandbox workspace-write --ask-for-approval on-request -
Implement app-level English/German localization.

Read AGENTS.md and docs/*.md first.

Create a lightweight i18n system unless a library is clearly necessary.

Create:
- src/lib/i18n/locales.ts
- src/lib/i18n/dictionaries/en.ts
- src/lib/i18n/dictionaries/de.ts
- src/lib/i18n/useI18n.ts
- src/lib/i18n/format.ts

Requirements:
- Supported locales: en and de.
- Locale is stored in Settings in IndexedDB.
- UI updates immediately when language changes.
- Use date-fns locale support for date formatting.
- Provide a typed translation key system so missing keys are obvious during development.
- Avoid scattering raw UI copy through components.
- Do not translate user-created subject names.

Translate core UI copy:
- Navigation: Today, Calendar, Stats, Settings
- Common actions: Save, Cancel, Edit, Delete, Archive, Back, Next, Skip, Done, Start, Pause, Resume, Complete
- Daily setup
- Study board
- Timer controls
- Notes
- Tags and tag management
- Calendar
- Stats
- Settings
- Onboarding
- Empty states
- Validation messages
- Import/export/reset labels
- Screensaver/focus mode labels

German translation tone:
- Clear, natural, concise German.
- Use "Lernen" and "Fächer" where appropriate.
- Avoid awkward literal translations.

Settings page:
- Add a language selector with English and Deutsch.
- Changing language should not reset data.
- Show current language clearly.

Seeded default subjects:
- If seeding occurs after a locale is selected, use localized default subject names.
- If existing subjects already exist, do not rename them automatically.

Run lint/build/tests and fix issues.
PROMPT
```

```bash
npm run lint
npm run build
npm test -- --run || true
git add .
git commit -m "Add English and German localization"
```

---

## 6. Build Settings: subject and tag management, language, import/export

```bash
cat <<'PROMPT' | codex exec --sandbox workspace-write --ask-for-approval on-request -
Build the Settings page for maintaining the subject list, tag list, and app preferences.

Read AGENTS.md and docs/*.md first.

Implement /settings with:
- Subject list from IndexedDB/Zustand.
- Add subject.
- Edit subject name.
- Choose subject color from a curated palette.
- Choose icon from a small built-in set using lucide-react icons.
- Archive subject instead of hard delete.
- Prevent empty/duplicate active subject names.
- Show archived subjects in a collapsible section if useful.
- Tag list from IndexedDB/Zustand.
- Add tag.
- Edit tag name.
- Choose tag color from a curated palette.
- Archive tag instead of hard delete.
- Prevent empty/duplicate active tag names.
- Show archived tags in a collapsible section if useful.
- Seed sensible default subjects and tags on first run in the selected language.

Settings sections:
1. Subjects
2. Tags
3. Appearance
   - light/dark/system
4. Language
   - English
   - Deutsch
5. Study preferences
   - block length, default 30 minutes
   - start of week
6. Timer focus mode / screensaver
   - enabled toggle
   - auto-start delay while timer is active
7. Onboarding
   - replay onboarding
8. Data
   - export local data as JSON
   - import JSON backup with validation, including subjects, tags, blocks, notes, and settings
   - reset local data, guarded by confirmation

UX requirements:
- No free text assignment during daily planning; subjects come from the maintained subject list.
- Block tags are assigned by clicking from the maintained tag list. Creating/editing tags happens in Settings.
- Settings should be clean and fast.
- Use dialogs/sheets where appropriate.
- Excellent mobile usability.
- Accessible labels and focus states.
- All visible copy must use the i18n system.

Run lint/build/tests and fix issues.
PROMPT
```

```bash
npm run lint
npm run build
npm test -- --run || true
git add .
git commit -m "Build settings subjects tags localization and data tools"
```

---

## 7. Build first-run onboarding card deck

```bash
cat <<'PROMPT' | codex exec --sandbox workspace-write --ask-for-approval on-request -
Build the first-run onboarding deck.

Read AGENTS.md and docs/*.md first.

Behavior:
- On first app open, show onboarding before the normal Today workflow.
- Onboarding should appear if Settings.onboardingCompletedAt is empty or onboardingVersion is outdated.
- Persist completion in Settings.
- Allow replaying onboarding from Settings.
- Skipping onboarding should still mark it as completed.
- Onboarding must be localized in English and German.

Deck content:
1. Welcome
   - Explain that the app turns study goals into calm 30-minute blocks.
2. Maintain subjects
   - Explain that subjects are managed once in Settings.
3. Plan today
   - Explain choosing how many 30-minute blocks to work today.
4. Assign by clicking
   - Explain assigning subjects by clicking subject chips, not typing each time.
5. Add tags
   - Explain optional block tags for context such as exam prep, homework, revision, deep focus, or catch-up.
6. Study with focus
   - Explain timers, notes, completion, and focus/screensaver mode.
7. Review progress
   - Explain Calendar, Stats, totals, averages, streaks, tag breakdowns, and notes history.
8. Personalize
   - Explain English/German, theme, and preferences.

UI requirements:
- Beautiful deck of cards.
- Premium, calm, minimal.
- Progress dots or step indicator.
- Back, Next, Skip, Get started actions.
- Card illustrations may be built from CSS, icons, gradients, and simple shapes.
- Use Framer Motion for restrained transitions.
- Mobile-first and desktop-polished.
- Accessible keyboard navigation.
- Focus states.
- Respect reduced-motion.

Integration:
- App root should initialize settings and decide whether to show onboarding.
- Normal routes should not flash wrong content while settings hydrate.
- The user should be able to switch language in Settings later and replay onboarding in the selected language.

Run lint/build/tests and fix issues.
PROMPT
```

```bash
npm run lint
npm run build
npm test -- --run || true
git add .
git commit -m "Build first-run onboarding deck"
```

---

## 8. Build the daily setup flow

```bash
cat <<'PROMPT' | codex exec --sandbox workspace-write --ask-for-approval on-request -
Build the daily setup flow.

Read AGENTS.md and docs/*.md first.

Core behavior:
When the user opens /today or /:
- If onboarding is incomplete, show onboarding first.
- If today's plan does not exist, show Daily Setup.
- If today's plan exists, show the Study Board.

Daily Setup:
1. User chooses how many 30-minute blocks they will work today.
   - Fast controls: 1, 2, 3, 4, 5, 6, 8, 10, 12
   - Also plus/minus stepper
2. User assigns one subject to each block by clicking subject pills from the maintained list.
3. User may optionally assign one or more tags to each block by clicking tag pills from the maintained tag list.
4. No free typing for block subject or tag selection during planning.
5. Allow repeated subjects and tags across multiple blocks.
6. Show a visual preview of the day's block sequence, including subject and tag chips.
7. Continue button creates StudyDay and StudyBlock records.

UX:
- Make the flow feel excellent: one-screen where possible, clear block grid, tactile subject chips.
- Mobile-first.
- Use subtle motion when blocks are added/removed/assigned.
- If no subjects exist, direct user to Settings and seed defaults if needed.
- Include "Start studying" CTA.
- Allow editing today's plan before any completed blocks exist.
- If completed blocks exist, allow adding blocks but avoid destructive reset.
- All visible copy must use the i18n system.

Routes:
- / should redirect or render today's page.
- /today should handle onboarding vs setup vs board state.

Run lint/build/tests and fix issues.
PROMPT
```

```bash
npm run lint
npm run build
npm test -- --run || true
git add .
git commit -m "Build daily study setup flow"
```

---

## 9. Build the study board, timer, and notes

```bash
cat <<'PROMPT' | codex exec --sandbox workspace-write --ask-for-approval on-request -
Build the beautiful daily Study Board.

Read AGENTS.md and docs/*.md first.

Study Board behavior:
- Shows today's 30-minute blocks as premium clickable cards.
- Each card displays:
  - block number
  - subject pill
  - status
  - elapsed time
  - planned duration
  - note indicator
  - tag chips
  - completion state
- Clicking a block opens a focused interaction:
  - start timer
  - pause timer
  - resume timer
  - complete block
  - skip block
  - edit note
  - add/remove tags via tag selector
  - change subject via subject pill selector
  - enter focus/screensaver mode when timer is active
- Only one block may be active at a time.
- If another block is active, starting a new one pauses the previous block.
- Timer persists across reloads.
- Completed blocks should keep actual elapsed duration.
- Notes are saved per block.
- Tags are saved per block and may be edited before, during, or after a timer session.
- Provide a compact "Today's progress" summary:
  - completed blocks
  - total studied time today
  - active subject
  - planned vs actual time

Visual requirements:
- This should be the flagship page.
- Use a calm focus layout, beautiful cards, progress ring, sticky current timer area.
- Strong mobile experience.
- Desktop should show a board/timeline layout.
- Completed blocks should feel satisfying but not distracting.
- Empty, planned, active, paused, completed, skipped states must be visually distinct.
- Use accessible buttons and keyboard navigation.
- All visible copy must use the i18n system.

Edge cases:
- If onboarding incomplete, show onboarding first.
- If no plan exists, show setup.
- If all blocks completed, show a satisfying completion summary.
- If the app reloads while a timer is active, elapsed time must be correct.

Run lint/build/tests and fix issues.
PROMPT
```

```bash
npm run lint
npm run build
npm test -- --run || true
git add .
git commit -m "Build study board timer and notes"
```

---

## 10. Build calm timer screensaver / focus mode

```bash
cat <<'PROMPT' | codex exec --sandbox workspace-write --ask-for-approval on-request -
Build the calm screensaver/focus animation for the timer screen.

Read AGENTS.md and docs/*.md first.

Feature name:
- Focus mode
- Screensaver mode can be described as the ambient focus view within timer mode.

Activation:
- Add a Focus button on active/paused block timer UI.
- If Settings.screensaverEnabled is true, automatically enter focus mode after Settings.screensaverDelaySeconds while a block timer is active and the user has not interacted.
- Do not auto-enter if no timer is active.
- Do not auto-enter while dialogs/sheets are open.

Focus screen UI:
- Full-screen or near full-screen calm timer view.
- Show:
  - current subject
  - elapsed time or remaining/planned progress
  - progress ring or minimal progress line
  - block number
  - pause/resume
  - complete block
  - exit focus mode
  - optional note shortcut
- Use subject color as a subtle accent.
- Include a calm visual animation:
  - slow breathing orb, soft gradient field, or ambient wave
  - very slow movement
  - no aggressive particles
  - no rapid flashing
  - no distracting loops

Accessibility/performance:
- Respect prefers-reduced-motion by using a static calm background.
- Keep animation CSS-based where possible.
- Avoid expensive canvas loops unless carefully throttled.
- Ensure keyboard users can exit focus mode.
- Ensure Escape exits focus mode.
- Ensure all controls have accessible labels.
- Timer persistence must remain correct across reloads.
- If the app reloads while focus mode was active, returning to the board is acceptable, but the timer must be correct.

Settings integration:
- Add settings for:
  - enable/disable screensaver auto-start
  - delay seconds, with sensible options such as 30, 60, 120, 300
- Localize all copy in English and German.

Run lint/build/tests and fix issues.
PROMPT
```

```bash
npm run lint
npm run build
npm test -- --run || true
git add .
git commit -m "Build timer focus screensaver mode"
```

---

## 11. Build Calendar and Stats

```bash
cat <<'PROMPT' | codex exec --sandbox workspace-write --ask-for-approval on-request -
Build the Calendar and Stats pages.

Read AGENTS.md and docs/*.md first.

Calendar page:
- Full calendar history.
- Month view with day intensity based on study duration.
- Day detail panel showing:
  - blocks studied
  - subjects
  - tags
  - total duration
  - notes from that day
- Navigation between months.
- Today indicator.
- Empty states.
- Date formatting must respect selected locale and startOfWeek setting.

Stats page:
Show extensive analytics:
- Total study time
- Total completed blocks
- Current streak
- Longest streak
- Average study time per active day
- Average blocks per day
- Completion rate
- Time by subject
- Time by tag
- Weekly trend
- Monthly trend
- Most studied subject
- Notes history/search
- Recent sessions/blocks

Use Recharts for:
- subject breakdown
- tag breakdown
- weekly/monthly trend
- completion distribution if useful

Analytics:
- Use real persisted data.
- Include range filters:
  - 7 days
  - 30 days
  - 90 days
  - all time
- Streak counts should be based on days with completed study time.
- Notes should be searchable and grouped by date, subject, and tag.
- Stats should support filtering by subject and tag where practical.

UX:
- Premium dashboard, not cluttered.
- Clear summaries at top, deeper details below.
- Works on mobile and desktop.
- Accessible chart labels and non-chart summaries.
- All visible copy must use the i18n system.

Run lint/build/tests and fix issues.
PROMPT
```

```bash
npm run lint
npm run build
npm test -- --run || true
git add .
git commit -m "Build calendar and analytics dashboard"
```

---

## 12. Add polish, accessibility, PWA-ready behavior, and quality gates

```bash
cat <<'PROMPT' | codex exec --sandbox workspace-write --ask-for-approval on-request -
Polish the app to a production-quality v1.

Read AGENTS.md and docs/*.md first.

Improve:
- Loading states.
- Error states.
- Empty states.
- Keyboard navigation.
- ARIA labels.
- Focus rings.
- Reduced-motion support.
- Mobile safe-area spacing.
- Responsive layout.
- Dark/light mode consistency.
- Toasts for important actions.
- Date formatting consistency.
- Visual hierarchy.
- Copywriting in English and German.
- Prevent hydration flicker around settings, locale, and onboarding.

Add:
- App metadata.
- Manifest-style PWA metadata if appropriate.
- Basic install-friendly icons/placeholders if possible.
- Helpful onboarding empty state behavior.
- Replay onboarding action in Settings.
- Reset demo/local data developer action in Settings advanced section.
- Export local data as JSON from Settings.
- Import JSON backup from Settings, with validation.
- Clear confirmation before destructive reset.

Quality gates:
- No TypeScript errors.
- No obvious hydration issues.
- No broken navigation.
- No inaccessible icon-only buttons without labels.
- No timer drift across reloads.
- No destructive delete without confirmation.
- All core visible copy localized in English and German.
- Subject and tag workflows are localized, while user-created names are not auto-translated.
- Onboarding appears on first launch and does not reappear after completion unless reset/replayed.
- Screensaver/focus mode respects reduced motion.
- App remains useful on small mobile screens.

Run lint/build/tests and fix all issues.
PROMPT
```

```bash
npm run lint
npm run build
npm test -- --run || true
git add .
git commit -m "Polish accessibility localization and PWA-ready behavior"
```

---

## 13. Add end-to-end tests

```bash
cat <<'PROMPT' | codex exec --sandbox workspace-write --ask-for-approval on-request -
Add pragmatic end-to-end and integration tests for the core app flows.

Read AGENTS.md and docs/*.md first.

Use Playwright if configured; otherwise configure it minimally.

Test core flows:
1. First launch onboarding
   - onboarding appears
   - user can move through cards
   - user can complete onboarding
   - onboarding does not reappear after completion
2. Language switching
   - user can switch between English and German
   - core nav labels update
3. Subject and tag settings
   - user can create a subject
   - user can edit a subject
   - user can archive a subject
   - user can create a tag
   - user can edit a tag
   - user can archive a tag
4. Daily setup
   - user can choose block count
   - user can assign subjects by clicking chips
   - user can assign optional tags by clicking chips
   - user can create today's plan
5. Study board timer
   - user can start a timer
   - user can pause/resume
   - user can add a note
   - user can add/remove tags
   - user can complete a block
6. Focus/screensaver mode
   - user can enter focus mode
   - Escape exits focus mode
   - controls remain accessible
7. Calendar/stats smoke tests
   - completed study time appears in stats
   - tag breakdown appears after tagged completed blocks
   - calendar shows studied day

Also add or improve unit tests for:
- analytics totals
- streak calculation
- timer elapsed calculation
- locale formatting helpers
- tag breakdown analytics

Keep tests robust and not overly brittle about animation details.
Run lint/build/tests and fix all issues.
PROMPT
```

```bash
npm run lint
npm run build
npm test -- --run || true
npx playwright test || true
git add .
git commit -m "Add core flow tests"
```

---

## 14. Ask Codex to review and refine the implementation

```bash
cat <<'PROMPT' | codex exec --sandbox workspace-write --ask-for-approval on-request -
Review this study-blocks app as a senior product engineer, UX designer, accessibility specialist, and frontend architect.

Audit:
- Product flow
- First-run onboarding clarity
- Block tagging flow and tag analytics usefulness
- English/German localization completeness
- Language switching behavior
- Visual design quality
- Accessibility
- Mobile experience
- Timer correctness
- Focus/screensaver mode quality and performance
- IndexedDB persistence
- Analytics correctness
- Calendar/stats usefulness
- Type safety
- Performance
- Code organization
- Test coverage

Then make high-confidence fixes only.

Do not redesign everything.
Do not introduce a backend.
Do not remove existing functionality.
Prefer small, precise improvements.

Specific checks:
- Onboarding should appear only when needed.
- All important copy should be localized.
- Timer should survive reloads.
- Only one block should be active at a time.
- Focus mode should be calm and non-distracting.
- Reduced-motion users should not receive animated screensaver effects.
- Settings should clearly expose language, tag management, and screensaver preferences.
- Blocks should support optional tags without slowing down the core daily flow.

After changes, run lint/build/tests and fix issues.
End with a concise summary of what changed and what remains.
PROMPT
```

```bash
npm run lint
npm run build
npm test -- --run || true
npx playwright test || true
git add .
git commit -m "Codex review fixes"
```

---

## 15. Final local run

```bash
npm run dev
```

Manual test checklist:

```text
First launch
- Onboarding appears.
- Deck cards explain the app clearly.
- Back, Next, Skip, and Get started work.
- Completion persists.
- Replay onboarding works from Settings.

Settings
- Add/edit/archive subjects.
- Add/edit/archive tags.
- Switch English/German.
- Verify navigation and main UI copy changes language.
- Toggle light/dark/system.
- Configure screensaver/focus mode.
- Export data.
- Import valid backup.
- Reset local data only after confirmation.

Today setup
- Choose number of 30-minute blocks.
- Assign subjects by clicking chips.
- Assign optional tags by clicking chips.
- Repeated subjects and tags work.
- No free-text subject or tag assignment exists in daily planning.
- Create today's plan.

Study board
- Start a block timer.
- Pause/resume.
- Start another block and confirm previous active block pauses.
- Add notes.
- Add/remove tags.
- Complete or skip blocks.
- Reload and verify timer persistence.

Focus/screensaver mode
- Enter focus mode manually.
- Confirm calm animation.
- Confirm subject/timer remain visible.
- Pause/resume/complete from focus mode.
- Press Escape to exit.
- Enable reduced motion in OS/browser and confirm static or minimal animation.

Calendar
- Inspect today.
- Verify studied time, subjects, tags, and notes appear.
- Navigate months.

Stats
- Verify totals.
- Verify averages.
- Verify streaks.
- Verify subject breakdown.
- Verify tag breakdown.
- Verify trends.
- Search notes.

Responsive/accessibility
- Test small mobile width.
- Test desktop width.
- Tab through main flows.
- Confirm icon-only buttons have accessible names.
```

---

## 16. One-shot Codex prompt alternative

Use this only if you want Codex to attempt the full build in one pass. The staged version above is safer.

```bash
cat <<'PROMPT' | codex exec --sandbox workspace-write --ask-for-approval on-request -
Build a production-quality local-first study plan and to-do web app.

Stack:
- Next.js App Router
- TypeScript
- Tailwind
- shadcn/ui
- Framer Motion
- Zustand
- Dexie/IndexedDB
- Recharts
- date-fns
- lucide-react
- Vitest and Testing Library
- Playwright if practical

Concept:
Users maintain a subject list in Settings. Each day, when opening the app, they choose how many 30-minute study blocks they will complete. Then they assign subjects to those blocks by clicking from the maintained subject list. After setup, they enter a beautiful daily study board where each block is clickable. Clicking a block allows starting/pausing/resuming/completing a timer, changing the subject, adding/removing tags, or adding notes. A separate Calendar/Stats area keeps complete history and extensive analytics: totals, averages, streaks, subject breakdown, tag breakdown, weekly/monthly trends, completion rate, and notes history/search.

Additional required features:
1. Clean first-run onboarding card deck.
2. English and German app language settings.
3. Calm screensaver/focus animation for the active timer screen.
4. Optional block tags, managed in Settings and assigned to blocks by clicking tag chips.

Pages:
- /today or /: onboarding if needed, then daily setup if no plan exists, otherwise study board
- /calendar: full study history calendar
- /stats: analytics dashboard
- /settings: subject management, tag management, language, screensaver preferences, import/export, replay onboarding, advanced reset

Data:
- Subject: id, name, color, icon, archivedAt, createdAt, updatedAt
- StudyDay: id, date, plannedBlockCount, createdAt, updatedAt
- Tag: id, name, color, archivedAt, createdAt, updatedAt
- StudyBlock: id, dayId, date, index, subjectId, tagIds, status, plannedMinutes, elapsedSeconds, startedAt, completedAt, note, createdAt, updatedAt
- Settings: id, blockMinutes, theme, locale, onboardingCompletedAt, onboardingVersion, startOfWeek, screensaverEnabled, screensaverDelaySeconds, createdAt, updatedAt
- Optionally StudySession/StudyEvent for analytics accuracy

Hard requirements:
- Local-first persistence with IndexedDB.
- 30-minute default blocks.
- Subject assignment must be click-based from maintained list.
- Only one active timer at a time.
- Timer must survive reloads.
- Notes per block.
- Optional tags per block.
- First-run onboarding deck with localized cards.
- Settings must support English and German.
- All core visible UI copy must be localized.
- Calendar history.
- Stats: totals, averages, streaks, subject breakdown, tag breakdown, trends, completion rate, notes.
- Timer focus/screensaver mode must be calm, accessible, and reduced-motion aware.
- Mobile-first but excellent desktop layout.
- Dark/light mode.
- Accessible keyboard/focus/ARIA behavior.
- Beautiful premium UI with polished motion.
- No backend.
- No mock data in final core flows.

Design:
Calm premium productivity interface. Use beautiful cards, subject color tokens, subtle gradients, tactile block interactions, clear progress indicators, and restrained motion. The daily study board and focus timer screen should be the visual centerpieces.

Onboarding:
- Show on first launch before normal app usage.
- Card deck with Back, Next, Skip, Get started.
- Explain subjects, tags, daily planning, click assignment, timers, notes, stats, language/settings, and focus mode.
- Persist completion.
- Allow replay from Settings.

Tagging:
- Tags are optional labels for blocks, separate from subjects.
- Tags are maintained in Settings.
- Blocks may have zero, one, or multiple tags.
- Tags should be assigned by clicking tag chips from the maintained list.
- Suggested seeded tags: Exam prep, Homework, Revision, Deep focus, Catch-up.
- In German, suggested seeded tags: Prüfungsvorbereitung, Hausaufgaben, Wiederholung, Fokuszeit, Nachholen.
- Do not auto-translate user-created tag names.
- Calendar and Stats should support tag display and tag breakdowns.

Localization:
- English and German dictionaries.
- Store locale in settings.
- Use selected locale for date formatting.
- Do not auto-translate user-created subject names.
- Use localized seeded defaults only when seeding in that locale.

Focus/screensaver mode:
- Manual Focus button on active timer.
- Optional auto-start after configured delay while timer is active.
- Full-screen calm timer view with slow breathing orb or soft gradient field.
- Show subject, timer, progress, pause/resume, complete, exit.
- Escape exits.
- Reduced-motion users get static calm view.
- Must not break timer persistence.

Quality:
- Add tests for analytics utilities, tag breakdowns, timer elapsed calculations, streaks, and locale formatting.
- Add pragmatic e2e tests for onboarding, language switch, daily setup, timer, focus mode, and stats smoke flow if practical.
- Run lint/build/tests and fix errors.
- Keep code clean, typed, and maintainable.
PROMPT
```

---

## 17. Suggested GitHub-ready README summary

After the app is built, ask Codex to create a concise README:

```bash
cat <<'PROMPT' | codex exec --sandbox workspace-write --ask-for-approval on-request -
Create or update README.md for this app.

Include:
- Product overview
- Core features
- Tech stack
- Local development instructions
- Data persistence note: local-first IndexedDB
- English/German localization note
- Subject and block tag management note
- Onboarding and focus mode overview
- Testing commands
- Known limitations

Keep it professional and concise.
PROMPT
```

```bash
git add README.md
git commit -m "Add README"
```

---

## 18. Notes for Codex usage

These prompts are intentionally staged. Use them in order for the best result:

1. Documentation and durable project context
2. Design system
3. Data layer
4. Localization
5. Settings with subjects and tags
6. Onboarding
7. Daily setup with optional block tags
8. Study board with timer, notes, and tags
9. Focus/screensaver mode
10. Calendar/stats with tag analytics
11. Polish/tests
12. Review fixes

The one-shot prompt can work, but it is more likely to produce a rough first pass that needs cleanup.


---

## File: `prompts/00-create-project-docs.md`

Create or update durable project guidance for the Study Blocks app.

Create these files if missing:

- AGENTS.md
- docs/product-spec.md
- docs/design-system.md
- docs/data-model.md
- docs/i18n-spec.md
- docs/onboarding-spec.md
- docs/tagging-spec.md
- docs/timer-screensaver-spec.md
- docs/analytics-spec.md
- docs/implementation-plan.md
- docs/qa-test-plan.md

The app is a local-first study planner built around 30-minute blocks. It includes first-run onboarding, English/German language settings, subject management, tag management, click-based block assignment, timers, notes, calm focus/screensaver mode, calendar history, and analytics.

Do not implement the whole app yet. First create or refine only the documentation and AGENTS.md instructions.


---

## File: `prompts/01-design-system-app-shell.md`

Read AGENTS.md and docs/*.md first. Follow the product, data, design, i18n, onboarding, tagging, and timer screensaver requirements exactly. Run lint/build/tests where available and fix issues before finishing.

Implement the premium design foundation and app shell.

Build:

- Global Tailwind CSS variables.
- Light/dark/system theme support.
- Responsive AppShell.
- Mobile bottom navigation.
- Desktop side navigation.
- Routes: `/`, `/today`, `/calendar`, `/stats`, `/settings`.
- Reusable components: PageHeader, SurfaceCard, SubjectPill, TagPill, StudyBlockCard, TimerRing, StatCard, EmptyState, IconButton.
- Polished empty states.
- Restrained Framer Motion transitions.

Use mock data only where necessary for design scaffolding. Keep the UI mobile-first and desktop-polished.


---

## File: `prompts/02-data-layer.md`

Read AGENTS.md and docs/*.md first. Follow the product, data, design, i18n, onboarding, tagging, and timer screensaver requirements exactly. Run lint/build/tests where available and fix issues before finishing.

Implement the local-first data layer.

Use Dexie for IndexedDB and Zustand for state/actions.

Create typed models for:

- Subject
- Tag
- StudyDay
- StudyBlock
- Settings
- Optional StudySession/StudyEvent

Implement required actions from AGENTS.md, including subject/tag management, settings, locale, onboarding completion, daily plan creation, timer controls, note updates, calendar summary, stats, import/export, and reset.

Critical requirements:

- One active timer at a time.
- Timer persists across reloads.
- Active elapsed time must be calculated from stored elapsedSeconds plus startedAt delta.
- Tags are stored per block.
- Settings include locale and screensaver preferences.
- Add analytics utility tests.


---

## File: `prompts/03-i18n-language-settings.md`

Read AGENTS.md and docs/*.md first. Follow the product, data, design, i18n, onboarding, tagging, and timer screensaver requirements exactly. Run lint/build/tests where available and fix issues before finishing.

Implement the English/German i18n foundation.

Build:

- Typed dictionaries for English and German.
- Locale provider/hook.
- Browser locale detection on first run.
- Persisted locale in Settings.
- date-fns locale mapping.
- Localized UI copy for navigation, onboarding, today, timer controls, focus mode, notes, calendar, stats, settings, subjects, tags, import/export/reset, validation, toasts, and empty states.

Changing the language must update UI immediately and must not translate or mutate user-created subject/tag names.


---

## File: `prompts/04-settings-subjects-tags.md`

Read AGENTS.md and docs/*.md first. Follow the product, data, design, i18n, onboarding, tagging, and timer screensaver requirements exactly. Run lint/build/tests where available and fix issues before finishing.

Build the Settings page.

Implement:

- Subject management: add, edit, color, icon, archive, archived section.
- Tag management: add, edit, color, archive, archived section.
- Language selector: English and Deutsch.
- Theme setting.
- Screensaver/focus mode settings: enabled and delay.
- Replay onboarding action.
- Export local data as JSON.
- Import JSON backup with validation.
- Advanced reset local data with confirmation.

Validation:

- Prevent empty subject/tag names.
- Prevent duplicate active subject/tag names.
- Archive rather than hard delete.
- Seed localized defaults if empty.

Use accessible dialogs/sheets and strong mobile UX.


---

## File: `prompts/05-onboarding-card-deck.md`

Read AGENTS.md and docs/*.md first. Follow the product, data, design, i18n, onboarding, tagging, and timer screensaver requirements exactly. Run lint/build/tests where available and fix issues before finishing.

Build the first-run onboarding card deck.

Requirements:

- Shows before normal app usage if onboarding is incomplete.
- Localized English/German content.
- Includes language selector or easy language switch.
- Cards explain subjects, tags, 30-minute blocks, daily setup, timers, notes, focus/screensaver mode, calendar/stats, and settings.
- Back, Next, Skip, Get started.
- Progress dots or step count.
- Persist completion and onboarding version.
- Replay from Settings.
- Restrained premium motion.
- Reduced-motion support.
- Keyboard-accessible.

Do not block access permanently; Skip should complete onboarding for the current version.


---

## File: `prompts/06-daily-setup-flow.md`

Read AGENTS.md and docs/*.md first. Follow the product, data, design, i18n, onboarding, tagging, and timer screensaver requirements exactly. Run lint/build/tests where available and fix issues before finishing.

Build the daily setup flow for `/today` and `/`.

Behavior:

- If onboarding is incomplete, show onboarding first.
- If today's plan does not exist, show Daily Setup.
- If today's plan exists, show Study Board.

Daily Setup:

- User chooses how many 30-minute blocks to work today.
- Fast options: 1, 2, 3, 4, 5, 6, 8, 10, 12.
- Plus/minus stepper.
- Assign exactly one subject per block by clicking subject chips from the maintained list.
- Optionally assign zero or more tags per block by clicking tag chips from the maintained list.
- Show visual preview of block sequence.
- Create persisted StudyDay and StudyBlock records.
- If no subjects/tags exist, direct user to Settings and seed defaults as appropriate.

Allow editing today’s plan before completed blocks exist. If completed blocks exist, allow adding blocks but avoid destructive reset.


---

## File: `prompts/07-study-board-timer-notes-tags.md`

Read AGENTS.md and docs/*.md first. Follow the product, data, design, i18n, onboarding, tagging, and timer screensaver requirements exactly. Run lint/build/tests where available and fix issues before finishing.

Build the Study Board.

Each block card shows:

- Block number.
- Subject pill.
- Tag chips.
- Status.
- Elapsed time.
- Planned duration.
- Note indicator.
- Completion/skipped state.

Clicking a block opens a focused interaction panel/dialog/sheet with:

- Start.
- Pause.
- Resume.
- Complete.
- Skip.
- Edit note.
- Change subject by clicking subject chips.
- Add/remove tags by clicking tag chips.
- Enter focus mode.

Rules:

- Only one active timer at a time.
- Starting a block pauses any other active block.
- Timer persists across reloads.
- Completed blocks preserve actual elapsed duration.
- Notes save per block.
- Today's progress summary shows completed blocks, total studied time, active subject, planned vs actual time.

Make this the flagship page: tactile cards, clear timer, excellent mobile UX, polished desktop layout.


---

## File: `prompts/08-timer-screensaver-focus-mode.md`

Read AGENTS.md and docs/*.md first. Follow the product, data, design, i18n, onboarding, tagging, and timer screensaver requirements exactly. Run lint/build/tests where available and fix issues before finishing.

Build the calm timer screensaver / focus mode.

Requirements:

- Manual Focus mode button on active timer/block.
- Optional auto-activation after Settings delay when screensaver is enabled.
- Slow breathing orb, soft gradient field, or similarly calm ambient animation.
- Use subject color as subtle accent.
- Timer remains visible.
- Subject and optional tags remain visible.
- Controls remain available: pause/resume, complete, exit focus, and note shortcut if practical.
- Respect `prefers-reduced-motion` with static calm screen.
- Avoid CPU-heavy animations.
- Do not break timer persistence across reloads.
- Localize all copy in English/German.

Add settings integration for enabling/disabling auto-activation and choosing delay.


---

## File: `prompts/09-calendar-stats-analytics.md`

Read AGENTS.md and docs/*.md first. Follow the product, data, design, i18n, onboarding, tagging, and timer screensaver requirements exactly. Run lint/build/tests where available and fix issues before finishing.

Build Calendar and Stats using real persisted data.

Calendar:

- Full month view.
- Study intensity by actual studied time.
- Today marker.
- Month navigation.
- Selected day detail with blocks, subjects, tags, durations, statuses, and notes.

Stats:

- Total study time.
- Total completed blocks.
- Current streak.
- Longest streak.
- Average study time per active day.
- Average blocks per active day.
- Completion rate.
- Time by subject.
- Time by tag.
- Weekly trend.
- Monthly trend.
- Most studied subject.
- Most used tag.
- Notes history/search.

Filters:

- 7 days.
- 30 days.
- 90 days.
- All time.
- Subject.
- Tag.

Use Recharts with accessible text summaries. Localize all copy and date formatting.


---

## File: `prompts/10-polish-pwa-import-export.md`

Read AGENTS.md and docs/*.md first. Follow the product, data, design, i18n, onboarding, tagging, and timer screensaver requirements exactly. Run lint/build/tests where available and fix issues before finishing.

Polish the app to production-quality v1.

Improve:

- Loading states.
- Error states.
- Empty states.
- Keyboard navigation.
- ARIA labels.
- Focus rings.
- Reduced-motion support.
- Mobile safe-area spacing.
- Responsive layouts.
- Dark/light consistency.
- Toasts.
- Date formatting.
- Copywriting.

Add or refine:

- App metadata.
- Manifest-style PWA metadata if appropriate.
- Onboarding replay.
- Import/export local data.
- Advanced reset action guarded by confirmation.
- Non-chart stats summaries.

Quality gates:

- No TypeScript errors.
- No broken navigation.
- No inaccessible icon-only buttons.
- No timer drift across reloads.
- No destructive action without confirmation.


---

## File: `prompts/11-e2e-tests.md`

Read AGENTS.md and docs/*.md first. Follow the product, data, design, i18n, onboarding, tagging, and timer screensaver requirements exactly. Run lint/build/tests where available and fix issues before finishing.

Add tests.

Unit tests:

- Timer elapsed calculations.
- Streak calculations.
- Completion rate.
- Subject analytics.
- Tag analytics.
- Notes search/filter.
- Date helpers.

E2E tests with Playwright if configured:

- First-run onboarding.
- Language switch English/German.
- Create subject.
- Create tag.
- Daily setup with subject and tags.
- Start/pause/resume/complete timer.
- Save note.
- Focus mode entry/exit.
- Calendar shows completed day.
- Stats show totals and tag breakdown.

Run all available tests and fix issues.


---

## File: `prompts/12-final-review.md`

Review this Study Blocks app as a senior product engineer, UX designer, frontend architect, and accessibility reviewer.

Read AGENTS.md and docs/*.md first.

Audit:

- Product flow.
- Onboarding clarity.
- English/German localization.
- Subject and tag workflows.
- Visual design quality.
- Mobile experience.
- Timer correctness.
- Focus/screensaver behavior.
- IndexedDB persistence.
- Calendar correctness.
- Stats correctness.
- Tag analytics.
- Accessibility.
- Reduced-motion support.
- Type safety.
- Performance.
- Test coverage.

Make high-confidence fixes only. Do not introduce a backend. Do not remove features. Do not redesign everything.

Run lint/build/tests and fix issues. End with a concise summary of changes and remaining risks.


---

## File: `prompts/one-shot-full-build.md`

Build a production-quality local-first Study Blocks app.

Stack:

- Next.js App Router
- TypeScript
- Tailwind
- Framer Motion
- Zustand
- Dexie / IndexedDB
- Recharts
- date-fns
- lucide-react
- shadcn/ui if useful

Concept:

Users maintain a subject list and tag list in Settings. Each day, when opening the app, they choose how many 30-minute study blocks they will complete. They assign one subject to each block by clicking from the maintained subject list. They optionally assign tags to blocks by clicking from the maintained tag list. After setup, they enter a beautiful daily Study Board where each block is clickable. Clicking a block allows starting/pausing/resuming/completing/skipping a timer, changing the subject, adding/removing tags, and adding notes. The active timer has a calm focus/screensaver mode. Calendar and Stats keep complete history and analytics.

Required features:

- First-run onboarding card deck.
- English/German language settings.
- Subject management.
- Tag management.
- Click-based subject assignment.
- Click-based tag assignment.
- 30-minute default blocks.
- Persistent timers.
- Notes per block.
- Calm timer screensaver/focus animation.
- Calendar history.
- Stats: totals, averages, streaks, completion rate, subject breakdown, tag breakdown, trends, notes search.
- Import/export local data.
- Dark/light mode.
- Mobile-first, desktop-polished UI.
- Accessibility and reduced-motion support.
- Local-first, no backend.

Read AGENTS.md and docs/*.md if available. If they are missing, create them first. Add tests for analytics utilities. Run lint/build/tests and fix errors.
