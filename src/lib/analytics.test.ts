import { describe, expect, it } from "vitest";
import { buildStatsSummary, calculateStreaks, completionRate } from "./analytics";
import type { StudyBlock, StudyDay, Subject, Tag } from "./types";

const subjects: Subject[] = [
  { id: "math", name: "Math", color: "#2563eb", createdAt: "", updatedAt: "", archivedAt: null },
  { id: "bio", name: "Biology", color: "#16a34a", createdAt: "", updatedAt: "", archivedAt: null },
];
const tags: Tag[] = [{ id: "exam", name: "Exam", color: "#be123c", createdAt: "", updatedAt: "", archivedAt: null }];
const days: StudyDay[] = [
  { id: "d1", date: "2026-05-20", plannedBlockCount: 2, createdAt: "", updatedAt: "" },
  { id: "d2", date: "2026-05-21", plannedBlockCount: 1, createdAt: "", updatedAt: "" },
];
const blockBase = {
  dayId: "d1",
  plannedMinutes: 30,
  startedAt: null,
  completedAt: null,
  note: "",
  createdAt: "",
  updatedAt: "",
};
const blocks: StudyBlock[] = [
  { ...blockBase, id: "b1", date: "2026-05-20", index: 0, subjectId: "math", tagIds: ["exam"], status: "completed", elapsedSeconds: 1800 },
  { ...blockBase, id: "b2", date: "2026-05-20", index: 1, subjectId: "bio", tagIds: [], status: "skipped", elapsedSeconds: 0 },
  { ...blockBase, id: "b3", dayId: "d2", date: "2026-05-21", index: 0, subjectId: "math", tagIds: ["exam"], status: "completed", elapsedSeconds: 1200, note: "Chapter 4" },
];

describe("analytics", () => {
  it("calculates completion rate", () => {
    expect(completionRate(2, 4)).toBe(0.5);
    expect(completionRate(0, 0)).toBe(0);
  });

  it("calculates current and longest streaks from studied days", () => {
    expect(calculateStreaks(blocks, "2026-05-21")).toEqual({ currentStreak: 2, longestStreak: 2 });
  });

  it("builds subject, tag, notes, and totals from real blocks", () => {
    const stats = buildStatsSummary({
      days,
      blocks,
      subjects,
      tags,
      filters: { range: "all" },
      todayKey: "2026-05-21",
    });
    expect(stats.totalSeconds).toBe(3000);
    expect(stats.completedBlocks).toBe(2);
    expect(stats.timeBySubject[0].id).toBe("math");
    expect(stats.timeBySubject[0].color).toBe("var(--color-primary)");
    expect(stats.timeByTag[0].seconds).toBe(3000);
    expect(stats.timeByTag[0].color).toBe("var(--color-error)");
    expect(stats.notes[0].block.note).toBe("Chapter 4");
  });

  it("filters by subject and tag", () => {
    const stats = buildStatsSummary({
      days,
      blocks,
      subjects,
      tags,
      filters: { range: "all", tagId: "exam", subjectId: "math" },
      todayKey: "2026-05-21",
    });
    expect(stats.totalSeconds).toBe(3000);
    expect(stats.timeBySubject).toHaveLength(1);
  });
});
