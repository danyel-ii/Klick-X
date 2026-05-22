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
