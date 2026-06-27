import { describe, expect, it } from "vitest";
import { artworkStepCount, buildDailyFractal, buildFractalParams, calculateArtworkProgress, generateFractalConfig } from "./fractals";
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

function block(date: string, index: number, status: StudyBlock["status"] = "completed", completedAt = `${date}T12:00:00.000Z`): StudyBlock {
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
    completedAt: status === "completed" ? completedAt : null,
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
    expect(params.seed).toContain("streak-1");
    expect(second).toEqual(first);
    expect(first.artwork?.lineCount).toBe(artworkStepCount);
    expect(first.artwork?.faces.length).toBeGreaterThan(1);
    expect(first.artwork?.faces[0]?.hatchSegments.length).toBeGreaterThan(0);
  });

  it("preserves the artwork identity while evolving visible progress", () => {
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
    expect(next.config.artwork?.lineCount).toBe(artworkStepCount);
    expect(next.visibleSteps).toBeGreaterThan(first.visibleSteps ?? 0);
  });

  it("advances one step per completed block and reverts one step on missed days", () => {
    const progress = calculateArtworkProgress({
      startDate: "2026-05-20",
      asOfDate: "2026-05-23",
      blocks: [block("2026-05-20", 0), block("2026-05-20", 1), block("2026-05-22", 0)],
    });

    expect(progress.visibleSteps).toBe(1);
    expect(progress.completedAt).toBeNull();
  });

  it("starts a same-day rollover artwork from the next completed block", () => {
    const previousBlocks = Array.from({ length: artworkStepCount }, (_, index) => block("2026-05-22", index, "completed", "2026-05-22T12:00:00.000Z"));
    const firstNewBlock = block("2026-05-22", artworkStepCount, "completed", "2026-05-22T15:00:00.000Z");
    const next = buildDailyFractal({
      date: "2026-05-22",
      blocks: [...previousBlocks, firstNewBlock],
      subjects: [subject],
      tags: [tag],
      now: "2026-05-22T15:00:00.000Z",
    });

    expect(next.visibleSteps).toBe(1);
    expect(next.status).toBe("active");
    expect(next.stats?.completedBlocks).toBe(1);
  });
});
