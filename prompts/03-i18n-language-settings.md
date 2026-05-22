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
