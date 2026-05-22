Read AGENTS.md and docs/*.md first. Follow the product, data, design, i18n, onboarding, tagging, and timer screensaver requirements exactly. Run lint/build/tests where available and fix issues before finishing.

Build the calm timer screensaver / focus mode.

Requirements:

- Manual Focus mode button on active timer/block.
- Optional auto-activation after Settings delay when screensaver is enabled.
- Slow breathing orb, soft gradient field, or similarly calm ambient animation.
- Use subject color as subtle accent.
- Timer remains visible.
- Subject and optional tags remain visible.
- Controls remain available: pause/resume, complete, exit focus, and note shortcut if practical.
- Respect `prefers-reduced-motion` with static calm screen.
- Avoid CPU-heavy animations.
- Do not break timer persistence across reloads.
- Localize all copy in English/German.

Add settings integration for enabling/disabling auto-activation and choosing delay.
