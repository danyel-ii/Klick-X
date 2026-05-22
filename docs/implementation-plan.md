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
