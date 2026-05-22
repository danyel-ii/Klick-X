# Onboarding Deck Specification

## Objective

Onboarding should quickly teach the app's workflow and then get out of the way. It should appear on first opening before normal app usage and be replayable from Settings.

## Behavior

- Show if `onboardingCompletedAt` is empty or if `onboardingVersion` is behind the current app onboarding version.
- Allow Skip.
- Allow Get started on the final card.
- Persist completion or skip.
- Allow replay from Settings without resetting user data.
- Include language selector either on the first card or as a small control in the deck.
- Localize all copy in English and German.

## Deck cards

1. Welcome: plan study time in focused 30-minute blocks.
2. Subjects: maintain the list of subjects from Settings.
3. Tags: maintain tags for purpose/context.
4. Plan today: choose how many blocks to study.
5. Assign: click subjects and optional tags for each block.
6. Study: start the timer, pause/resume, complete, skip.
7. Notes: capture what you covered.
8. Focus: use calm focus/screensaver mode while studying.
9. Reflect: review Calendar and Stats.
10. Personalize: language, theme, import/export, and settings.

## UI details

- Card deck layout.
- Clear title and short body text.
- Progress dots or step count.
- Back, Next, Skip, and Get started buttons.
- Keyboard support: Enter for primary action, Escape for Skip if appropriate, arrow keys optional.
- Motion should be smooth and restrained.
- Respect reduced-motion preferences.
- Mobile view should fit without awkward scrolling.

## Visual direction

Use soft surfaces, gentle depth, small illustrations or abstract shapes if useful. Do not use loud mascot-style onboarding. This app should feel mature and focused.

## Persistence

Store:

- `onboardingCompletedAt`
- `onboardingVersion`

Skipping counts as completion for the current onboarding version.
