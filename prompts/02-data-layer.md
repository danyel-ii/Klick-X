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
