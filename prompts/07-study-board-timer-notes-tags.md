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
