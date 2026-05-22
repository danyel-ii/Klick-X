# Calendar and Analytics Specification

## Calendar

Calendar should show a full history month view.

Required:

- Month navigation.
- Today marker.
- Selected day state.
- Intensity based on actual studied time.
- Day detail panel.

Day detail should show:

- Total studied time.
- Blocks and statuses.
- Subjects studied.
- Tags used.
- Notes.

## Stats

Stats should provide a clear dashboard without clutter.

Required metrics:

- Total study time.
- Total completed blocks.
- Planned blocks.
- Completion rate.
- Current streak.
- Longest streak.
- Average study time per active day.
- Average blocks per active day.
- Most studied subject.
- Most used tag.
- Time by subject.
- Time by tag.
- Weekly trend.
- Monthly trend.
- Recent notes.

## Filters

Support:

- Range: 7 days, 30 days, 90 days, all time.
- Subject filter.
- Tag filter.

## Streak definition

A streak day is a day with completed studied time greater than zero. Planned-only days do not count. Skipped-only days do not count.

## Completion rate

Recommended:

```text
completed blocks / planned blocks
```

Use planned blocks from days that have study plans. Consider skipped blocks incomplete unless product copy says otherwise.

## Tag time counting

Global totals count each block once. Tag breakdowns can count full duration for every tag attached to a block. If multiple tags are attached, tag breakdown totals may exceed global total; label as tag-associated time if necessary.

## Notes search

Search notes by text and allow optional filters:

- Date range.
- Subject.
- Tag.

Group results by date and show subject/tag chips.

## Charts

Use Recharts for:

- Subject breakdown.
- Tag breakdown.
- Weekly/monthly trends.
- Completion distribution if useful.

Every chart should have a textual summary for accessibility.
