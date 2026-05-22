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
