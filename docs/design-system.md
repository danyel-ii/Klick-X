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
