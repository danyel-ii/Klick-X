Build a production-quality local-first Study Blocks app.

Stack:

- Next.js App Router
- TypeScript
- Tailwind
- Framer Motion
- Zustand
- Dexie / IndexedDB
- Recharts
- date-fns
- lucide-react
- shadcn/ui if useful

Concept:

Users maintain a subject list and tag list in Settings. Each day, when opening the app, they choose how many 30-minute study blocks they will complete. They assign one subject to each block by clicking from the maintained subject list. They optionally assign tags to blocks by clicking from the maintained tag list. After setup, they enter a beautiful daily Study Board where each block is clickable. Clicking a block allows starting/pausing/resuming/completing/skipping a timer, changing the subject, adding/removing tags, and adding notes. The active timer has a calm focus/screensaver mode. Calendar and Stats keep complete history and analytics.

Required features:

- First-run onboarding card deck.
- English/German language settings.
- Subject management.
- Tag management.
- Click-based subject assignment.
- Click-based tag assignment.
- 30-minute default blocks.
- Persistent timers.
- Notes per block.
- Calm timer screensaver/focus animation.
- Calendar history.
- Stats: totals, averages, streaks, completion rate, subject breakdown, tag breakdown, trends, notes search.
- Import/export local data.
- Dark/light mode.
- Mobile-first, desktop-polished UI.
- Accessibility and reduced-motion support.
- Local-first, no backend.

Read AGENTS.md and docs/*.md if available. If they are missing, create them first. Add tests for analytics utilities. Run lint/build/tests and fix errors.
