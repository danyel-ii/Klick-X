# Product Specification — Study Blocks

## Product thesis

Study Blocks is a local-first study planning and execution app for students and self-learners. It converts the vague goal of "study today" into a small number of concrete 30-minute blocks. The product emphasizes fast planning, low-friction execution, and meaningful history.

## User flow

1. First opening shows a clean onboarding card deck.
2. User can choose English or German during onboarding and later in Settings.
3. User maintains subjects in Settings.
4. User maintains tags in Settings.
5. Each day, user chooses how many 30-minute blocks they will study.
6. User assigns a subject to each block by clicking a subject chip.
7. User optionally assigns one or more tags to each block by clicking tag chips.
8. User starts studying from the daily Study Board.
9. Each block can be started, paused, resumed, completed, skipped, edited, tagged, and annotated.
10. The active timer can enter calm focus/screensaver mode.
11. Calendar and Stats show historical performance.

## Primary user stories

- As a student, I want to plan 3 study blocks for today so I know exactly what I will work on.
- As a student, I want to assign Mathematics, Biology, and Literature by clicking subjects, so planning stays fast.
- As a student, I want to add tags like Exam prep or Homework so I can later see why I studied.
- As a student, I want a timer that persists after reload so I do not lose progress.
- As a student, I want notes per block so I can record what I covered.
- As a student, I want a calm focus animation so the timer screen is pleasant during work.
- As a student, I want to see streaks, totals, averages, and subject/tag breakdowns so I understand my habits.
- As a bilingual user, I want the interface in English or German.

## Pages

### Today

Today is the central workflow page.

States:

- First-run onboarding gate if onboarding is incomplete.
- Daily setup if no study plan exists for the date.
- Study Board if a study plan exists.
- Completion summary if all blocks are completed or skipped.

### Settings

Settings manages:

- Subjects.
- Tags.
- Language.
- Theme.
- Start of week.
- Screensaver/focus mode settings.
- Onboarding replay.
- Import/export.
- Advanced local data reset.

### Calendar

Calendar shows:

- Month grid.
- Study intensity by day.
- Today marker.
- Selected day detail panel.
- Subjects, tags, durations, notes, and block status for each day.

### Stats

Stats shows:

- Totals.
- Averages.
- Streaks.
- Completion rate.
- Subject breakdown.
- Tag breakdown.
- Weekly trend.
- Monthly trend.
- Notes search.
- Filters by range, subject, and tag.

## Feature requirements

### Onboarding

The onboarding deck should be short, elegant, and functional. It should use a deck/card metaphor, but it should not feel like a marketing carousel. It should teach the workflow and get out of the way.

Required cards:

1. Welcome and value proposition.
2. Subjects: maintain your study areas.
3. Tags: label blocks by purpose.
4. Plan today: choose a number of 30-minute blocks.
5. Assign blocks: click subjects and optional tags.
6. Study: start timer, add notes, complete blocks.
7. Focus: use calm screensaver mode.
8. Reflect: calendar and stats.
9. Personalize: language, theme, and settings.

### Subjects

Subjects represent what is studied. A block has exactly one subject. Subjects are created and edited in Settings. Assigning a subject to a block must be click-based from the maintained list.

Default English subjects:

- Mathematics
- Physics
- Chemistry
- Biology
- Literature
- History
- Languages
- Computer Science

Default German subjects:

- Mathematik
- Physik
- Chemie
- Biologie
- Literatur
- Geschichte
- Sprachen
- Informatik

### Tags

Tags represent context, intent, or mode. A block can have multiple tags. Tags are created and edited in Settings. Assigning tags must be click-based from the maintained list.

Default English tags:

- Exam prep
- Homework
- Revision
- Deep focus
- Catch-up

Default German tags:

- Prüfungsvorbereitung
- Hausaufgaben
- Wiederholung
- Fokuszeit
- Nachholen

### Timer

The timer must support start, pause, resume, complete, and skip. One active block at a time. State persists across reload. Timer should display actual elapsed time and planned 30-minute target.

### Screensaver/focus mode

Focus mode should turn the active timer screen into a calm, low-distraction ambient view. It should include slow animation, visible remaining/elapsed time, subject, tags if space allows, and core controls. It should respect reduced-motion preferences.

### Calendar and stats

History is useful only if it is trustworthy. Use actual block data and elapsed time. Do not count merely planned blocks as studied time.

## Product tone

Clear, quiet, and motivating. Avoid exaggerated praise or noisy gamification. Streaks should encourage consistency without punishing missed days.
