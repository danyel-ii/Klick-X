import { describe, expect, it } from "vitest";
import { buildDailyFractal, buildFractalParams, generateFractalConfig } from "./fractals";
import type { StudyBlock, Subject, Tag } from "./types";

const now = "2026-05-22T12:00:00.000Z";
const subject: Subject = {
  id: "subject_math",
  name: "Mathematics",
  color: "var(--color-primary)",
  icon: "",
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
};
const tag: Tag = {
  id: "tag_focus",
  name: "Deep focus",
  color: "var(--color-secondary)",
  description: "",
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
};

function block(date: string, index: number, status: StudyBlock["status"] = "completed"): StudyBlock {
  return {
    id: `block_${date}_${index}`,
    dayId: `day_${date}`,
    date,
    index,
    subjectId: subject.id,
    tagIds: [tag.id],
    status,
    plannedMinutes: 30,
    elapsedSeconds: status === "completed" ? 1800 : 0,
    startedAt: null,
    completedAt: status === "completed" ? `${date}T12:00:00.000Z` : null,
    note: "",
    createdAt: `${date}T11:00:00.000Z`,
    updatedAt: `${date}T12:00:00.000Z`,
  };
}

describe("daily fractals", () => {
  it("builds deterministic config from study streak inputs", () => {
    const blocks = [block("2026-05-20", 0), block("2026-05-22", 0), block("2026-05-22", 1)];
    const params = buildFractalParams({ date: "2026-05-22", blocks, subjects: [subject], tags: [tag] });
    const first = generateFractalConfig(params);
    const second = generateFractalConfig(params);

    expect(params.completedBlocksToday).toBe(2);
    expect(params.daysSinceLastUse).toBe(1);
    expect(params.subjectStreaks[subject.id]).toBe(1);
    expect(params.tagStreaks[tag.id]).toBe(1);
    expect(second).toEqual(first);
  });

  it("preserves the daily record identity while evolving the seed", () => {
    const first = buildDailyFractal({ date: "2026-05-22", blocks: [block("2026-05-22", 0)], subjects: [subject], tags: [tag], now });
    const next = buildDailyFractal({
      existing: first,
      date: "2026-05-22",
      blocks: [block("2026-05-22", 0), block("2026-05-22", 1)],
      subjects: [subject],
      tags: [tag],
      now: "2026-05-22T13:00:00.000Z",
    });

    expect(next.id).toBe(first.id);
    expect(next.createdAt).toBe(first.createdAt);
    expect(next.updatedAt).toBe("2026-05-22T13:00:00.000Z");
    expect(next.seed).not.toBe(first.seed);
  });
});
