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
