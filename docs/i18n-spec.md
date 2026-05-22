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
