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
