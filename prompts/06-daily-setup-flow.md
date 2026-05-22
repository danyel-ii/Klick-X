Read AGENTS.md and docs/*.md first. Follow the product, data, design, i18n, onboarding, tagging, and timer screensaver requirements exactly. Run lint/build/tests where available and fix issues before finishing.

Build the daily setup flow for `/today` and `/`.

Behavior:

- If onboarding is incomplete, show onboarding first.
- If today's plan does not exist, show Daily Setup.
- If today's plan exists, show Study Board.

Daily Setup:

- User chooses how many 30-minute blocks to work today.
- Fast options: 1, 2, 3, 4, 5, 6, 8, 10, 12.
- Plus/minus stepper.
- Assign exactly one subject per block by clicking subject chips from the maintained list.
- Optionally assign zero or more tags per block by clicking tag chips from the maintained list.
- Show visual preview of block sequence.
- Create persisted StudyDay and StudyBlock records.
- If no subjects/tags exist, direct user to Settings and seed defaults as appropriate.

Allow editing today’s plan before completed blocks exist. If completed blocks exist, allow adding blocks but avoid destructive reset.
