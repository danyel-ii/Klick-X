# QA and Test Plan

## Manual test path

1. First launch shows onboarding.
2. Change language to German in onboarding.
3. Complete or skip onboarding.
4. Settings shows German UI.
5. Add/edit/archive a subject.
6. Add/edit/archive a tag.
7. Switch to English; UI updates without changing user-created names.
8. Create today's plan with 3 blocks.
9. Assign subjects by clicking chips.
10. Assign tags by clicking chips.
11. Start first block.
12. Reload page; timer elapsed time is correct.
13. Pause and resume block.
14. Add note.
15. Enter focus mode.
16. Exit focus mode.
17. Complete block.
18. Start another block; confirm only one active block.
19. Open Calendar; confirm today details.
20. Open Stats; confirm totals, subject breakdown, tag breakdown, streak.
21. Export data.
22. Reset data with confirmation.
23. Import data and confirm records return.

## Unit tests

Add tests for:

- Date helpers.
- Timer elapsed calculation.
- Streak calculation.
- Completion rate.
- Subject breakdown.
- Tag breakdown.
- Range filtering.
- Notes filtering.

## E2E tests

Add Playwright tests for:

- Onboarding completion.
- Language switch.
- Subject creation.
- Tag creation.
- Daily setup.
- Timer start/pause/complete.
- Note saving.
- Calendar visibility.
- Stats visibility.

## Accessibility checks

- Keyboard through onboarding.
- Keyboard through daily setup chips.
- Keyboard through timer controls.
- Focus states visible.
- Icon-only buttons labeled.
- Reduced-motion mode tested.
- Charts have text summaries.
- Calendar days have labels.

## Build gates

Run:

```bash
npm run lint
npm run build
npm test
```

Use the test command actually available in the repo if configured differently.
