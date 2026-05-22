import { describe, expect, it } from "vitest";
import { accumulateElapsed, formatDuration, visibleElapsedSeconds } from "./timer";
import type { StudyBlock } from "./types";

const block: StudyBlock = {
  id: "block",
  dayId: "day",
  date: "2026-05-22",
  index: 0,
  subjectId: "subject",
  tagIds: [],
  status: "active",
  plannedMinutes: 30,
  elapsedSeconds: 120,
  startedAt: "2026-05-22T10:00:00.000Z",
  completedAt: null,
  note: "",
  createdAt: "2026-05-22T09:00:00.000Z",
  updatedAt: "2026-05-22T09:00:00.000Z",
};

describe("timer helpers", () => {
  it("renders active elapsed time from persisted seconds plus startedAt delta", () => {
    expect(visibleElapsedSeconds(block, new Date("2026-05-22T10:01:30.000Z"))).toBe(210);
  });

  it("accumulates elapsed seconds when pausing or completing", () => {
    expect(accumulateElapsed(block, new Date("2026-05-22T10:00:10.000Z"))).toBe(130);
  });

  it("formats durations", () => {
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(3661)).toBe("1:01:01");
  });
});
