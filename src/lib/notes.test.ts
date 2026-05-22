import { describe, expect, it } from "vitest";
import { findPreviousSubjectNote } from "./notes";
import type { StudyBlock } from "./types";

const blockBase: StudyBlock = {
  id: "block",
  dayId: "day",
  date: "2026-05-23",
  index: 0,
  subjectId: "math",
  tagIds: [],
  status: "completed",
  plannedMinutes: 30,
  elapsedSeconds: 1800,
  startedAt: null,
  completedAt: null,
  note: "",
  createdAt: "2026-05-23T08:00:00.000Z",
  updatedAt: "2026-05-23T08:00:00.000Z",
};

describe("findPreviousSubjectNote", () => {
  it("returns the latest earlier worked note for the same subject", () => {
    const current = { ...blockBase, id: "current", date: "2026-05-23", index: 2, note: "" };
    const previous = { ...blockBase, id: "previous", date: "2026-05-23", index: 1, note: "Quadratics" };
    const older = { ...blockBase, id: "older", date: "2026-05-22", index: 3, note: "Linear equations" };
    const otherSubject = { ...blockBase, id: "science", subjectId: "science", date: "2026-05-23", index: 1, note: "Cells" };

    expect(findPreviousSubjectNote(current, [older, otherSubject, previous])?.id).toBe("previous");
  });

  it("ignores future, empty, current, and unworked notes", () => {
    const current = { ...blockBase, id: "current", date: "2026-05-23", index: 1, note: "Current" };
    const future = { ...blockBase, id: "future", date: "2026-05-23", index: 2, note: "Future" };
    const empty = { ...blockBase, id: "empty", date: "2026-05-22", index: 0, note: "   " };
    const unworked = { ...blockBase, id: "unworked", date: "2026-05-21", index: 0, status: "planned" as const, elapsedSeconds: 0, note: "Not started" };

    expect(findPreviousSubjectNote(current, [current, future, empty, unworked])).toBeUndefined();
  });
});
