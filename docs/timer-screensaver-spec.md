# Timer Screensaver / Focus Mode Specification

## Goal

The active timer screen should include a calm focus mode that feels like a study-friendly screensaver. It should make the timer screen pleasant without distracting from study.

## Activation

- User can click/tap `Focus mode` on an active block.
- If enabled, focus mode may auto-activate after `screensaverDelaySeconds` while a timer is active.
- User can disable auto-activation in Settings.

## Required controls

Focus mode must allow:

- Pause/resume.
- Complete block.
- Exit focus mode.
- Add or edit note if practical.

## Display

Show:

- Subject.
- Optional tags.
- Elapsed time.
- Planned target or progress ring.
- Current status.

## Animation direction

Use one of these:

- Slow breathing orb.
- Soft ambient gradient field.
- Minimal wave/ring animation.

Rules:

- Use subject color as accent.
- Avoid fast particles.
- Avoid busy backgrounds.
- Avoid high CPU animation loops.
- Do not hide the timer.
- Do not create a fake video-like animation that drains battery.

## Accessibility and motion

- Respect `prefers-reduced-motion`.
- In reduced-motion mode, render static gradient/orb and keep controls visible.
- Ensure text contrast is sufficient.
- Maintain keyboard escape/exit behavior.

## Persistence

Focus mode should not affect timer persistence. Reloading during focus mode should either return to the Study Board with the timer still active or restore focus mode if that is intentionally stored.

## Settings

Settings should include:

- Screensaver/focus auto-activate enabled.
- Delay in seconds.
- Possibly preview focus screen.
