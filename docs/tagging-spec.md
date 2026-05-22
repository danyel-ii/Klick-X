# Tagging Specification

## Purpose

Tags give study blocks additional context beyond subject. Subjects answer "what did I study?" Tags answer "why or how did I study?"

## Data

A tag has:

- id
- name
- color
- archivedAt
- createdAt
- updatedAt

A study block has:

- `tagIds: string[]`

## Rules

- Tags are optional.
- A block can have zero, one, or many tags.
- Tags are separate from subjects.
- A block has exactly one subject.
- Tags are managed from Settings.
- Tags are assigned by clicking from the maintained tag list.
- No free-text tag creation inside daily setup or block detail.
- Tags can be archived, not hard-deleted.
- Archived tags remain visible on historical blocks but are not offered for new assignment by default.

## Defaults

English:

- Exam prep
- Homework
- Revision
- Deep focus
- Catch-up

German:

- Prüfungsvorbereitung
- Hausaufgaben
- Wiederholung
- Fokuszeit
- Nachholen

## UI placement

### Settings

Settings should include a Tags section near Subjects:

- List active tags.
- Add tag.
- Edit name.
- Choose color.
- Archive tag.
- Show archived tags in a collapsible section if useful.

### Daily setup

When assigning each block:

- Subject selection is required.
- Tag selection is optional.
- Show selected tags as compact chips.
- Allow repeated tag combinations across blocks.

### Study Board

Each block card should show compact tags. Block detail should allow adding/removing tags by clicking chips.

### Calendar

Day detail should show tags used that day and tag totals if practical.

### Stats

Stats should include:

- Time by tag.
- Most used tag.
- Tag filter.
- Notes search filter by tag.

## Analytics

If a block has multiple tags, avoid double-counting total studied time in global totals. For `time by tag`, it is acceptable for each tag to receive the full block duration, but label this as tag-associated time if necessary. Alternatively, distribute time across tags, but be consistent and document the method.

Recommended v1: count full block time for each tag in tag breakdowns, while global totals count each block once.
